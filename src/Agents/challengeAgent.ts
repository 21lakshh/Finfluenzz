const SYSTEM_PROMPT = `
You are QuestMaster Fin, an AI gamemaster who creates genuinely beneficial and enjoyable financial quests for Gen Z users. Your mission is to transform boring money tasks into exciting adventures that actually improve their financial life.

🎯 CORE PRINCIPLES
• Every quest MUST provide clear, measurable financial benefit
• Make it FUN and achievable - users should feel excited to complete it
• Use their REAL expense data to create personalized, relevant challenges
• Focus on building positive money habits, not just restriction
• All monetary values in Indian Rupees (₹) only

📊 ANALYZE USER DATA
Look at their weeklyExpenses to find:
• Biggest spending categories (opportunities to optimize)
• Patterns (daily coffee, frequent food delivery, etc.)
• Quick wins (small changes with big impact)
• Areas where they can build better habits

🎮 QUEST CATEGORIES (choose wisely)
• SAVING - Smart ways to reduce waste and build emergency funds
• INVESTING - Start small, grow wealth (SIPs, mutual funds, etc.)
• BUDGETING - Track spending with fun challenges
• LEARNING - Practical finance skills that pay off immediately

🎲 DIFFICULTY LEVELS
• GRASSHOPPER (50-75 XP) - Quick wins, 1-2 days
• APPRENTICE (100-150 XP) - Weekly habits, moderate effort
• MASTER (175-200 XP) - Challenging but rewarding, game-changers

✨ MAKE IT ENJOYABLE
• Use gaming language ("unlock", "level up", "achievement")
• Add personal touches based on their data
• Include mini-milestones and celebration moments
• Frame restrictions as "power-ups" or "skill builds"
• Make the benefit crystal clear and exciting

💡 QUEST EXAMPLES (adapt to user data)
Instead of: "Don't spend on food delivery"
Try: "Unlock the Chef Achievement: Cook 5 meals this week and pocket the ₹800 you'd spend on delivery. Reward yourself with something special!"

Instead of: "Track your expenses"
Try: "Become a Money Detective: Discover your 3 biggest expense patterns this week. You might uncover ₹500+ in hidden savings!"

OUTPUT FORMAT (JSON array only):
[
  {
    "title": "Catchy quest name with gaming flair",
    "description": "Specific, actionable quest with clear benefit in ₹. Make it sound exciting and achievable!",
    "category": "SAVING|INVESTING|BUDGETING|LEARNING",
    "difficulty": "GRASSHOPPER|APPRENTICE|MASTER",
    "xpReward": 50-200,
    "deadline": "in X days",
    "emoji": "🎯"
  }
]

CRITICAL RULES
• Calculate exact ₹ amounts from their expense data
• Make each quest feel like a game, not a chore
• Focus on positive habits, not just restrictions
• Ensure every quest has a clear
• Return ONLY valid JSON array, no extra text`;

import axios from "axios";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface UserProfile {
    currentlyEarn: string;
    employmentType: string;
    mainPurpose: string;
    financeKnowledge: string;
    weeklyExpenses: SimpleExpenseItem[];
}

interface ExpenseItem {
    id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
}

interface SimpleExpenseItem {
    category: string;
    amount: number;
    description: string;
}

interface Challenge {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    xpReward: number;
    deadline: string;
    emoji: string;
    completed?: boolean;
}

export default async function challengeAgent(userProfile: UserProfile): Promise<Challenge[]> {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not found in environment variables");
    }

    const userContext = `
User Profile:
- Currently Earning: ${userProfile.currentlyEarn}
- Employment: ${userProfile.employmentType}
- Main Goal: ${userProfile.mainPurpose}
- Finance Knowledge: ${userProfile.financeKnowledge}

Weekly Expenses Data (Last 7 Days):
${userProfile.weeklyExpenses.length > 0 ? 
  userProfile.weeklyExpenses.map(expense => 
    `• ${expense.category}: ₹${expense.amount} - ${expense.description}`
  ).join('\n') 
  : 
  '• No expenses recorded in the last 7 days'
}

Total Weekly Spending: ₹${userProfile.weeklyExpenses.reduce((total, exp) => total + exp.amount, 0)}

EXPENSE ANALYSIS FOR CHALLENGE CREATION:
${userProfile.weeklyExpenses.length > 0 ? (() => {
  const categoryTotals = userProfile.weeklyExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return `Top spending categories this week:
${sortedCategories.map(([cat, amount]) => `  • ${cat}: ₹${amount}`).join('\n')}

PERSONALIZATION REQUIREMENTS:
- Create challenges that directly address the top spending categories above
- Calculate realistic savings amounts based on actual spending patterns
- Reference specific categories and amounts in challenge descriptions
- Make challenges achievable based on current spending habits`;
})() : 
  'No recent spending data - create general beneficial challenges for this user profile.'
}

IMPORTANT: Use this EXACT expense data to create personalized challenges. Each challenge MUST reference specific categories, amounts, or patterns from the expense data above. If no recent expenses, create general beneficial challenges for a ${userProfile.employmentType} with ${userProfile.financeKnowledge} finance knowledge.

Generate 3-4 personalized, beneficial financial challenges. Return ONLY a valid JSON array with no other text.
    `.trim();

    const messages: ChatMessage[] = [
        { role: "user", content: userContext }
    ];

    try {
        const result = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.3,
            max_tokens: 2000,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages,
            ],
        }, {
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (result.status !== 200) {
            console.error('🤖 Challenge Agent - API Error:', result.status, result.data);
            throw new Error(`Groq API error: ${result.status} – ${result.data}`);
        }

        const response = result.data.choices[0].message.content;
        
        try {
            let jsonString = response.trim();
            
            const jsonStart = jsonString.indexOf('[');
            const jsonEnd = jsonString.lastIndexOf(']') + 1;
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonString = jsonString.substring(jsonStart, jsonEnd);
            }
            
            const challenges = JSON.parse(jsonString);
            
            if (!Array.isArray(challenges)) {
                console.error('🤖 Challenge Agent - Response is not an array:', challenges);
                throw new Error('Response is not an array');
            }
            
            return challenges.map((challenge: any) => ({
                title: challenge.title,
                description: challenge.description,
                category: challenge.category,
                difficulty: challenge.difficulty,
                xpReward: challenge.xpReward,
                deadline: challenge.deadline || 'in 7 days',
                emoji: challenge.emoji,
                completed: false
            }));
        } catch (parseError) {
            console.error('🤖 Challenge Agent - Failed to parse JSON:', parseError);
            console.error('🤖 Challenge Agent - Raw response:', response);
            return []; // Return empty array on parsing failure
        }

    } catch (error) {
        console.error('🤖 Challenge Agent - API call failed:', error);
        return []; // Return empty array on API failure
    }
}

export type { UserProfile, ExpenseItem, SimpleExpenseItem, Challenge, ChatMessage }; 