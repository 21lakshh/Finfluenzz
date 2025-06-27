import axios from "axios";
import { stockAPI } from "../services/stockAPI";
import type { StockQuote, StockHistoricalData, TechnicalIndicators } from "../services/stockAPI";

const SYSTEM_PROMPT = `
You are FinanceGuru, a Gen Z financial advisor AI with serious market knowledge but a fun, relatable personality.

🎯 Your Personality:
- Use Gen Z slang naturally (no cap, fr fr, lowkey/highkey, slaps, hits different, periodt, etc.)
- Be encouraging and motivational 
- Keep it real about risks - no sugarcoating
- Use emojis and make finance fun but informative
- Reference current events and culture when relevant

📊 Your Expertise:
- Deep technical analysis of stocks
- Market trends and sentiment analysis  
- Risk assessment and portfolio advice
- Investment strategies for different goals
- Options, crypto, ETFs knowledge

🚀 Analysis Style:
- Always provide specific data-driven insights
- Explain technical indicators in simple terms
- Give clear buy/hold/sell recommendations with reasoning
- Mention price targets and support/resistance levels
- Discuss volume, momentum, and market sentiment
- Consider both fundamental and technical analysis

💡 Communication Rules:
- Start responses with a Gen Z greeting/reaction
- Use technical analysis but explain it simply
- Always mention risks and not financial advice disclaimer
- Be optimistic but realistic about market conditions
- End with actionable advice or next steps

📈 Stock Analysis Format:
1. Current vibe check (price action, sentiment)
2. Technical breakdown (RSI, MACD, moving averages)
3. Chart pattern analysis
4. Risk/reward assessment  
5. Your honest take + recommendation

Remember: You're the friend who actually knows finance, not just someone who watched a few TikToks. Keep it real! 💯
`.trim();

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface StockAnalysisData {
    quote: StockQuote;
    historicalData: StockHistoricalData[];
    technicalIndicators: TechnicalIndicators;
    symbol: string;
}

interface AnalysisResponse {
    message: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    priceTarget?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
}

export default async function financeAdvisorAgent(
    userMessage: string,
    chatHistory: ChatMessage[] = []
): Promise<AnalysisResponse> {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not found in environment variables");
    }

    try {
        // Extract stock symbol from user message
        const stockSymbol = extractStockSymbol(userMessage);
        let stockData: StockAnalysisData | null = null;

        // If user is asking about a specific stock, fetch real data
        if (stockSymbol) {
            stockData = await getStockAnalysisData(stockSymbol);
        }

        // Prepare the context for the AI
        const contextMessage = stockData 
            ? createStockAnalysisContext(stockData, userMessage)
            : userMessage;

        const messages: ChatMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory,
            { role: "user", content: contextMessage }
        ];

        const result = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama3-8b-8192",
            temperature: 0.7,
            max_tokens: 2000,
            messages,
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
        
        // Parse the response to extract structured data
        const analysisResponse = parseAnalysisResponse(response, stockData);
        
        return analysisResponse;

    } catch (error) {
        console.error('Finance advisor agent error:', error);
        return {
            message: "Yo, my bad! 😅 Something went wrong on my end. The servers are being a bit sus right now. Try asking me again in a sec! 🔄",
            recommendation: 'HOLD',
            confidence: 0,
            riskLevel: 'HIGH',
            timeHorizon: 'SHORT'
        };
    }
}

// Extract stock symbol from user message
function extractStockSymbol(message: string): string | null {
    // Common patterns for stock symbols
    const patterns = [
        /\$([A-Z]{1,5})\b/g,           // $AAPL
        /\b([A-Z]{2,5})\s+stock/gi,    // AAPL stock
        /\b([A-Z]{2,5})\s+price/gi,    // AAPL price
        /\b([A-Z]{2,5})\s+chart/gi,    // AAPL chart
        /about\s+([A-Z]{2,5})\b/gi,    // about AAPL
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);
        if (match) {
            return match[1].toUpperCase();
        }
    }

    // Check for popular company names
    const companyMap: Record<string, string> = {
        'apple': 'AAPL',
        'google': 'GOOGL',
        'microsoft': 'MSFT',
        'tesla': 'TSLA',
        'nvidia': 'NVDA',
        'amazon': 'AMZN',
        'meta': 'META',
        'netflix': 'NFLX'
    };

    const lowerMessage = message.toLowerCase();
    for (const [company, symbol] of Object.entries(companyMap)) {
        if (lowerMessage.includes(company)) {
            return symbol;
        }
    }

    return null;
}

// Get comprehensive stock data for analysis
async function getStockAnalysisData(symbol: string): Promise<StockAnalysisData> {
    const [quote, historicalData, technicalIndicators] = await Promise.all([
        stockAPI.getStockQuote(symbol),
        stockAPI.getHistoricalData(symbol, 30),
        stockAPI.getTechnicalIndicators(symbol)
    ]);

    return {
        quote,
        historicalData,
        technicalIndicators,
        symbol
    };
}

// Create context message with stock data for AI analysis
function createStockAnalysisContext(data: StockAnalysisData, userMessage: string): string {
    const { quote, historicalData, technicalIndicators, symbol } = data;
    
    // Calculate additional metrics
    const priceChange30Day = historicalData.length >= 30 
        ? ((quote.price - historicalData[29].close) / historicalData[29].close) * 100
        : 0;

    const recentVolume = historicalData.slice(0, 5).reduce((sum, day) => sum + day.volume, 0) / 5;
    const avgVolume = historicalData.reduce((sum, day) => sum + day.volume, 0) / historicalData.length;
    const volumeRatio = recentVolume / avgVolume;

    return `
User Question: ${userMessage}

REAL STOCK DATA FOR ${symbol}:

📊 Current Quote:
- Price: ₹${(quote.price * 83).toFixed(2)} (${quote.price.toFixed(2)} USD)
- Daily Change: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)
- Volume: ${quote.volume.toLocaleString()}
- 52W High: ₹${((quote.high52Week || 0) * 83).toFixed(2)}
- 52W Low: ₹${((quote.low52Week || 0) * 83).toFixed(2)}

📈 Technical Indicators:
- RSI: ${technicalIndicators.rsi.toFixed(1)} ${technicalIndicators.rsi > 70 ? '(Overbought)' : technicalIndicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
- SMA 20: ₹${(technicalIndicators.sma20 * 83).toFixed(2)}
- SMA 50: ₹${(technicalIndicators.sma50 * 83).toFixed(2)}
- MACD: ${technicalIndicators.macd.line.toFixed(3)} (Signal: ${technicalIndicators.macd.signal.toFixed(3)})

📊 Price Performance:
- 30-day change: ${priceChange30Day >= 0 ? '+' : ''}${priceChange30Day.toFixed(2)}%
- Volume vs Average: ${volumeRatio.toFixed(1)}x ${volumeRatio > 1.2 ? '(High Volume)' : volumeRatio < 0.8 ? '(Low Volume)' : '(Normal Volume)'}

🎯 Recent Price Action (Last 7 Days):
${historicalData.slice(0, 7).map(day => 
    `${day.date}: ₹${(day.close * 83).toFixed(2)} (${((day.close - day.open) / day.open * 100).toFixed(1)}%)`
).join('\n')}

Analyze this data and provide your Gen Z finance guru perspective with specific insights!
    `.trim();
}

// Parse AI response to extract structured data
function parseAnalysisResponse(response: string, stockData: StockAnalysisData | null): AnalysisResponse {
    // Extract recommendation
    let recommendation: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
    if (response.toLowerCase().includes('buy') || response.toLowerCase().includes('bullish')) {
        recommendation = 'BUY';
    } else if (response.toLowerCase().includes('sell') || response.toLowerCase().includes('bearish')) {
        recommendation = 'SELL';
    }

    // Extract confidence (look for percentages or confidence words)
    let confidence = 50;
    const confidenceMatch = response.match(/(\d+)%\s*(confidence|sure|certain)/i);
    if (confidenceMatch) {
        confidence = parseInt(confidenceMatch[1]);
    } else if (response.toLowerCase().includes('highly confident') || response.toLowerCase().includes('very sure')) {
        confidence = 85;
    } else if (response.toLowerCase().includes('confident') || response.toLowerCase().includes('sure')) {
        confidence = 70;
    } else if (response.toLowerCase().includes('uncertain') || response.toLowerCase().includes('risky')) {
        confidence = 30;
    }

    // Extract risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (response.toLowerCase().includes('high risk') || response.toLowerCase().includes('very risky')) {
        riskLevel = 'HIGH';
    } else if (response.toLowerCase().includes('low risk') || response.toLowerCase().includes('safe')) {
        riskLevel = 'LOW';
    }

    // Extract time horizon
    let timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG' = 'MEDIUM';
    if (response.toLowerCase().includes('short term') || response.toLowerCase().includes('quick')) {
        timeHorizon = 'SHORT';
    } else if (response.toLowerCase().includes('long term') || response.toLowerCase().includes('hodl')) {
        timeHorizon = 'LONG';
    }

    // Extract price target
    let priceTarget: number | undefined;
    const priceTargetMatch = response.match(/target.*?₹([\d,]+)/i);
    if (priceTargetMatch) {
        priceTarget = parseFloat(priceTargetMatch[1].replace(',', ''));
    }

    return {
        message: response,
        recommendation,
        confidence,
        priceTarget,
        riskLevel,
        timeHorizon
    };
}

export type { ChatMessage, AnalysisResponse, StockAnalysisData }; 