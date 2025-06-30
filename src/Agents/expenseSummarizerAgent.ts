const SYSTEM_PROMPT = `
You are ExpenseSummarizer, an AI financial analyst that provides concise expense summaries.

🎯 Your Role:
- Analyze expense data and provide actionable insights
- Generate clear, structured summaries with spending patterns
- Offer practical money-saving tips based on actual spending
- Use Gen Z friendly language but keep it professional

📊 Summary Format:
1. **Overview**: Total spent, transaction count, daily average
2. **Top Categories**: Highest spending categories with amounts
3. **Spending Patterns**: Notable trends, peak spending days
4. **Insights**: Key observations about spending behavior
5. **Recommendations**: 2-3 actionable tips to optimize spending

💡 Guidelines:
- Keep summaries under 300 words
- Use bullet points for clarity
- Include specific amounts in INR (₹)
- Focus on actionable insights, not just data repetition
- Be encouraging while highlighting areas for improvement
- Use emojis sparingly for readability

🚫 Never:
- Ask follow-up questions
- Request more information
- Provide generic advice
- Make assumptions about income or goals
`.trim();

import axios from "axios";

export interface ExpenseItem {
    id: string;
    category: string;
    amount: number;
    description: string;
    date?: string;
}

export interface SummaryRequest {
    expenses: ExpenseItem[];
    period: 'week' | 'month';
    periodLabel: string; // e.g., "Past Week", "Past Month"
}

export default async function expenseSummarizerAgent(summaryRequest: SummaryRequest): Promise<string> {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not found in environment variables");
    }

    const { expenses, period, periodLabel } = summaryRequest;
    
    // Calculate basic statistics
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const transactionCount = expenses.length;
    const dailyAverage = period === 'week' ? totalSpent / 7 : totalSpent / 30;
    
    // Group by category
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);
    
    // Get top categories
    const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    // Group by date for pattern analysis
    const dailySpending = expenses.reduce((acc, expense) => {
        const date = expense.date || new Date().toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);
    
    // Create analysis prompt
    const analysisPrompt = `
Analyze the following expense data for ${periodLabel.toLowerCase()}:

**Basic Stats:**
- Total Spent: ₹${totalSpent.toFixed(2)}
- Transactions: ${transactionCount}
- Daily Average: ₹${dailyAverage.toFixed(2)}

**Top Categories:**
${topCategories.map(([category, amount]) => 
    `- ${category}: ₹${amount.toFixed(2)} (${((amount/totalSpent)*100).toFixed(1)}%)`
).join('\n')}

**Daily Breakdown:**
${Object.entries(dailySpending).map(([date, amount]) => 
    `- ${date}: ₹${amount.toFixed(2)}`
).join('\n')}

**Recent Transactions:**
${expenses.slice(-5).map(expense => 
    `- ${expense.category}: ₹${expense.amount} (${expense.description})`
).join('\n')}

Provide a comprehensive expense summary following the specified format. Focus on actionable insights and practical recommendations.
`;

    try {
        const result = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.3,
            max_tokens: 800,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: analysisPrompt }
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

        return result.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating expense summary:', error);
        
        // Fallback summary if API fails
        return `## ${periodLabel} Expense Summary 📊

**Overview:**
- Total Spent: ₹${totalSpent.toFixed(2)}
- Transactions: ${transactionCount}
- Daily Average: ₹${dailyAverage.toFixed(2)}

**Top Spending Categories:**
${topCategories.slice(0, 3).map(([category, amount]) => 
    `• ${category}: ₹${amount.toFixed(2)}`
).join('\n')}

**Quick Insights:**
${totalSpent > 0 ? `• Your highest expense category was ${topCategories[0]?.[0] || 'N/A'}` : '• No expenses recorded for this period'}
${transactionCount > 0 ? `• You made ${transactionCount} transactions` : '• No transactions recorded'}

**Recommendations:**
• Track your expenses regularly to identify spending patterns
• Consider setting category-wise budgets
• Look for opportunities to reduce spending in top categories

*Summary generated automatically based on your expense data.*`;
    }
} 