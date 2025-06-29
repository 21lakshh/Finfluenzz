const SYSTEM_PROMPT = `
You are ChallengeForge, an AI that creates personalized gamified financial challenges for Gen Z users.

🎮 Your mission: Generate 3-5 fun, achievable financial challenges based on user profile.

📊 User Profile Data:
  • currentlyEarn: (yes/no) - whether they earn money
  • employmentType: (student/freelancer/intern/fulltime)
  • mainPurpose: (saving/investing/budgeting)
  • financeKnowledge: (beginner/intermediate/advanced)
  • weeklyExpenses: array of expense objects {category, amount, description}

🏆 Challenge Requirements:
  • Retro gaming theme (use gaming terminology)
  • Specific, measurable goals (use INR ₹ currency)
  • Time-bound (1 week challenges)
  • Difficulty matched to their knowledge level
  • Related to their main purpose and spending patterns

💡 Challenge Categories:
  • SAVING QUESTS: Reduce spending, find deals, emergency fund
  • INVESTMENT MISSIONS: Learn about stocks, start investing, portfolio building
  • BUDGET BATTLES: Track expenses, categorize spending, optimize costs
  • KNOWLEDGE RAIDS: Learn financial concepts, complete courses

🎯 Output Format: Return ONLY valid JSON array, no explanations or text before/after:
[
  {
    "id": "unique_id",
    "title": "🎮 CHALLENGE_NAME",
    "description": "Clear description with specific goal",
    "category": "SAVING_QUEST|INVESTMENT_MISSION|BUDGET_BATTLE|KNOWLEDGE_RAID",
    "difficulty": "NOOB|PLAYER|PRO",
    "xpReward": 50-200,
    "deadline": "7 days",
    "emoji": "relevant_emoji"
  }
]

CRITICAL: Respond with ONLY the JSON array. No text before or after. No explanations.
`.trim();

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
    id: string;
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
- Weekly Expenses: ${JSON.stringify(userProfile.weeklyExpenses, null, 2)}

Generate 3-4 personalized financial challenges for this user. Return ONLY a valid JSON array with no other text.
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
            throw new Error(`Groq API error: ${result.status} – ${result.data}`);
        }

        const response = result.data.choices[0].message.content;
        
        // Extract JSON from response (in case AI adds extra text)
        try {
            let jsonString = response.trim();
            
            // Try to find JSON array in the response
            const jsonStart = jsonString.indexOf('[');
            const jsonEnd = jsonString.lastIndexOf(']') + 1;
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                jsonString = jsonString.substring(jsonStart, jsonEnd);
            }
            
            const challenges = JSON.parse(jsonString);
            
            // Validate that it's an array
            if (!Array.isArray(challenges)) {
                throw new Error('Response is not an array');
            }
            
            return challenges.map((challenge: any) => ({
                ...challenge,
                completed: false
            }));
        } catch (parseError) {
            console.error('Failed to parse challenges JSON:', parseError);
            console.error('Raw response:', response);
            // Return fallback challenges if parsing fails
            return getFallbackChallenges(userProfile);
        }

    } catch (error) {
        console.error('Challenge agent error:', error);
        // Return fallback challenges if API fails
        return getFallbackChallenges(userProfile);
    }
}

// Fallback challenges if API fails
function getFallbackChallenges(userProfile: UserProfile): Challenge[] {
    const baseChallenges = [
        {
            id: "save_quest_1",
            title: "🎮 THE PENNY COLLECTOR",
            description: "Save $5 this week by skipping one small purchase",
            category: "SAVING_QUEST",
            difficulty: "NOOB",
            xpReward: 50,
            deadline: "7 days",
            emoji: "💰",
            completed: false
        },
        {
            id: "budget_battle_1",
            title: "🎯 EXPENSE TRACKER PRO",
            description: "Log every expense for 3 consecutive days",
            category: "BUDGET_BATTLE",
            difficulty: "PLAYER",
            xpReward: 75,
            deadline: "7 days",
            emoji: "📊",
            completed: false
        },
        {
            id: "knowledge_raid_1",
            title: "🧠 FINANCE WARRIOR TRAINING",
            description: "Learn about compound interest and take a quiz",
            category: "KNOWLEDGE_RAID",
            difficulty: userProfile.financeKnowledge === 'beginner' ? "NOOB" : "PLAYER",
            xpReward: 100,
            deadline: "7 days",
            emoji: "📚",
            completed: false
        }
    ];

    // Add investment challenge if user's goal is investing
    if (userProfile.mainPurpose === 'investing') {
        baseChallenges.push({
            id: "investment_mission_1",
            title: "🚀 ROOKIE INVESTOR",
            description: "Research 3 beginner-friendly stocks and write down what you learned",
            category: "INVESTMENT_MISSION",
            difficulty: userProfile.financeKnowledge === 'beginner' ? "NOOB" : "PLAYER",
            xpReward: 125,
            deadline: "7 days",
            emoji: "📈",
            completed: false
        });
    }

    return baseChallenges;
}

export type { UserProfile, ExpenseItem, SimpleExpenseItem, Challenge, ChatMessage }; 