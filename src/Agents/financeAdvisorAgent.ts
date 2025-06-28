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

📈 IMPORTANT - Always include these structured elements in your response:
- RECOMMENDATION: State "BUY", "HOLD", or "SELL" clearly
- CONFIDENCE: Give a percentage (0-100%) of how confident you are
- RISK LEVEL: State "LOW RISK", "MEDIUM RISK", or "HIGH RISK" 
- TIME HORIZON: State "SHORT TERM", "MEDIUM TERM", or "LONG TERM"
- PRICE TARGET: If giving a buy/sell recommendation, mention a specific price target

Example format to include:
"My recommendation: BUY
Confidence level: 75%
Risk assessment: MEDIUM RISK  
Time horizon: LONG TERM
Price target: ₹15,000"

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
        console.error('❌ GROQ_API_KEY not found! Please add it to your .env file');
        return {
            message: "Yo! 😅 I need my AI brain to work properly! Looks like the GROQ_API_KEY is missing from your .env file. Can you add it so I can give you some fire financial advice? 🧠💡\n\nGet your free key at: https://console.groq.com/ 🔑",
            recommendation: 'HOLD',
            confidence: 0,
            riskLevel: 'HIGH',
            timeHorizon: 'SHORT'
        };
    }

    try {
        // Extract stock symbol from user message
        const stockSymbol = extractStockSymbol(userMessage);
        let stockData: StockAnalysisData | null = null;

        // If user is asking about a specific stock, fetch real data
        if (stockSymbol) {
            try {
                stockData = await getStockAnalysisData(stockSymbol);
            } catch (stockError) {
                console.error('Stock data error:', stockError);
                const errorMessage = stockError instanceof Error ? stockError.message : 'Unknown error occurred';
                return {
                    message: `Yo! 😬 I tried to get the latest data for ${stockSymbol} but ran into some issues: ${errorMessage}\n\nThis might be because:\n• Stock symbol doesn't exist or is misspelled\n• API rate limits hit\n• Stock market is closed\n• API keys need to be checked\n\nTry asking about a different stock or check back later! 🔄📈`,
                    recommendation: 'HOLD',
                    confidence: 0,
                    riskLevel: 'HIGH',
                    timeHorizon: 'SHORT'
                };
            }
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

        const response = result.data.choices[0]?.message?.content;
        
        if (!response) {
            throw new Error('Empty response from Groq API');
        }
        
        // Parse the response to extract structured data
        const analysisResponse = parseAnalysisResponse(response, stockData);
        
        return analysisResponse;

    } catch (error) {
        console.error('Finance advisor agent error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // More specific error messages based on error type
        if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
            return {
                message: "Yikes! 🔐 My API key seems to be acting up. The Groq API is saying 'unauthorized' - this usually means the API key is invalid or expired. Can you double-check your VITE_GROQ_API_KEY in the .env file? 🔑✨",
                recommendation: 'HOLD',
                confidence: 0,
                riskLevel: 'HIGH',
                timeHorizon: 'SHORT'
            };
        }
        
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            return {
                message: "Whoa there! 🛑 I'm getting rate limited by the API. Too many requests too fast! Give me like 30 seconds to cool down and then we can continue our finance chat! ⏰📈",
                recommendation: 'HOLD',
                confidence: 0,
                riskLevel: 'MEDIUM',
                timeHorizon: 'SHORT'
            };
        }

        return {
            message: "Yo, my bad! 😅 Something went wrong on my end. The servers are being a bit sus right now. The error was: " + errorMessage + "\n\nTry asking me again in a sec! 🔄",
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
        'netflix': 'NFLX',
        'alphabet': 'GOOGL',
        'fb': 'META',
        'facebook': 'META'
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

🔥 LIVE STOCK DATA FOR ${symbol} (REAL-TIME):

📊 Current Quote:
- Price: ₹${(quote.price * 83).toFixed(2)} (${quote.price.toFixed(2)} USD)
- Daily Change: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)
- Volume: ${quote.volume.toLocaleString()}
- 52W High: ₹${((quote.high52Week || 0) * 83).toFixed(2)}
- 52W Low: ₹${((quote.low52Week || 0) * 83).toFixed(2)}

📈 Technical Indicators (LIVE):
- RSI: ${technicalIndicators.rsi.toFixed(1)} ${technicalIndicators.rsi > 70 ? '(Overbought 🔴)' : technicalIndicators.rsi < 30 ? '(Oversold 🟢)' : '(Neutral 🟡)'}
- SMA 20: ₹${(technicalIndicators.sma20 * 83).toFixed(2)}
- SMA 50: ₹${(technicalIndicators.sma50 * 83).toFixed(2)}
- Price vs SMA20: ${quote.price > technicalIndicators.sma20 ? 'Above 📈' : 'Below 📉'}
- Price vs SMA50: ${quote.price > technicalIndicators.sma50 ? 'Above 📈' : 'Below 📉'}
- MACD: ${technicalIndicators.macd.line.toFixed(3)} (Signal: ${technicalIndicators.macd.signal.toFixed(3)})
- MACD Trend: ${technicalIndicators.macd.line > technicalIndicators.macd.signal ? 'Bullish 🟢' : 'Bearish 🔴'}

📊 Price Performance:
- 30-day change: ${priceChange30Day >= 0 ? '+' : ''}${priceChange30Day.toFixed(2)}%
- Volume vs Average: ${volumeRatio.toFixed(1)}x ${volumeRatio > 1.2 ? '(High Volume 🔥)' : volumeRatio < 0.8 ? '(Low Volume 😴)' : '(Normal Volume ✅)'}

🎯 Recent Price Action (Last 7 Days):
${historicalData.slice(0, 7).map(day => 
    `${day.date}: ₹${(day.close * 83).toFixed(2)} (${((day.close - day.open) / day.open * 100).toFixed(1)}%)`
).join('\n')}

💡 Key Levels:
- Support: ₹${(Math.min(...historicalData.slice(0, 7).map(d => d.low)) * 83).toFixed(2)}
- Resistance: ₹${(Math.max(...historicalData.slice(0, 7).map(d => d.high)) * 83).toFixed(2)}

Analyze this REAL data and provide your Gen Z finance guru perspective with specific insights! Remember to be honest about risks and mention this is not financial advice! 🚀💯
    `.trim();
}

// Parse AI response to extract structured data
function parseAnalysisResponse(response: string, stockData: StockAnalysisData | null): AnalysisResponse {
    const lowerResponse = response.toLowerCase();
    
    // Extract recommendation with multiple patterns
    let recommendation: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
    
    // Structured patterns first
    const recommendationMatch = response.match(/recommendation:\s*(BUY|HOLD|SELL)/i);
    if (recommendationMatch) {
        recommendation = recommendationMatch[1].toUpperCase() as 'BUY' | 'HOLD' | 'SELL';
    } else {
        // Fallback to keyword detection
        if (lowerResponse.includes('buy') || lowerResponse.includes('bullish') || lowerResponse.includes('strong buy') || 
            lowerResponse.includes('accumulate') || lowerResponse.includes('go long')) {
            recommendation = 'BUY';
        } else if (lowerResponse.includes('sell') || lowerResponse.includes('bearish') || lowerResponse.includes('dump') || 
                   lowerResponse.includes('short') || lowerResponse.includes('avoid')) {
            recommendation = 'SELL';
        }
    }

    // Extract confidence with better patterns
    let confidence = 50;
    
    // Look for structured confidence first
    const confidenceStructuredMatch = response.match(/confidence.*?(\d+)%/i);
    if (confidenceStructuredMatch) {
        confidence = parseInt(confidenceStructuredMatch[1]);
    } else {
        // Look for any percentage followed by confidence-related words
        const confidenceMatch = response.match(/(\d+)%\s*(confidence|sure|certain|convinced)/i);
        if (confidenceMatch) {
            confidence = parseInt(confidenceMatch[1]);
        } else {
            // Fallback to keyword-based confidence
            if (lowerResponse.includes('very confident') || lowerResponse.includes('highly confident') || lowerResponse.includes('super sure')) {
                confidence = 85;
            } else if (lowerResponse.includes('pretty confident') || lowerResponse.includes('quite sure') || lowerResponse.includes('solid bet')) {
                confidence = 75;
            } else if (lowerResponse.includes('confident') || lowerResponse.includes('sure') || lowerResponse.includes('convinced')) {
                confidence = 65;
            } else if (lowerResponse.includes('somewhat confident') || lowerResponse.includes('moderately sure') || lowerResponse.includes('decent chance')) {
                confidence = 55;
            } else if (lowerResponse.includes('uncertain') || lowerResponse.includes('not sure') || lowerResponse.includes('risky') || lowerResponse.includes('iffy')) {
                confidence = 35;
            } else if (lowerResponse.includes('very uncertain') || lowerResponse.includes('really risky') || lowerResponse.includes('no idea')) {
                confidence = 20;
            }
        }
    }

    // Extract risk level with better patterns
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    
    // Structured risk pattern first
    const riskMatch = response.match(/risk.*?(LOW|MEDIUM|HIGH)\s*RISK/i);
    if (riskMatch) {
        riskLevel = riskMatch[1].toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH';
    } else {
        // Keyword-based risk detection
        if (lowerResponse.includes('high risk') || lowerResponse.includes('very risky') || lowerResponse.includes('dangerous') || 
            lowerResponse.includes('volatile') || lowerResponse.includes('aggressive') || lowerResponse.includes('speculative')) {
            riskLevel = 'HIGH';
        } else if (lowerResponse.includes('low risk') || lowerResponse.includes('safe') || lowerResponse.includes('conservative') || 
                   lowerResponse.includes('stable') || lowerResponse.includes('secure') || lowerResponse.includes('defensive')) {
            riskLevel = 'LOW';
        }
    }

    // Extract time horizon with better patterns
    let timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG' = 'MEDIUM';
    
    // Structured horizon pattern first
    const horizonMatch = response.match(/horizon.*?(SHORT|MEDIUM|LONG)\s*TERM/i);
    if (horizonMatch) {
        timeHorizon = horizonMatch[1].toUpperCase() as 'SHORT' | 'MEDIUM' | 'LONG';
    } else {
        // Keyword-based horizon detection
        if (lowerResponse.includes('short term') || lowerResponse.includes('quick') || lowerResponse.includes('day trading') || 
            lowerResponse.includes('swing trade') || lowerResponse.includes('weeks') || lowerResponse.includes('short-term')) {
            timeHorizon = 'SHORT';
        } else if (lowerResponse.includes('long term') || lowerResponse.includes('hodl') || lowerResponse.includes('years') || 
                   lowerResponse.includes('long-term') || lowerResponse.includes('buy and hold') || lowerResponse.includes('decade')) {
            timeHorizon = 'LONG';
        }
    }

    // Extract price target with multiple patterns
    let priceTarget: number | undefined;
    const priceTargetPatterns = [
        /target.*?₹([\d,]+)/i,
        /price target.*?₹([\d,]+)/i,
        /target.*?([\d,]+)/i,
        /₹([\d,]+)\s*target/i
    ];
    
    for (const pattern of priceTargetPatterns) {
        const match = response.match(pattern);
        if (match) {
            priceTarget = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    // Smart defaults based on technical indicators if we have stock data
    if (stockData) {
        const { technicalIndicators } = stockData;
        
        // Adjust confidence based on technical strength
        if (confidence === 50) { // If still default
            if (technicalIndicators.rsi > 70 || technicalIndicators.rsi < 30) {
                confidence = 70; // Strong technical signal
            } else if (technicalIndicators.rsi > 60 || technicalIndicators.rsi < 40) {
                confidence = 60; // Moderate signal
            }
        }
        
        // Adjust risk based on volatility indicators
        if (riskLevel === 'MEDIUM') { // If still default
            if (technicalIndicators.rsi > 80 || technicalIndicators.rsi < 20) {
                riskLevel = 'HIGH'; // Extreme RSI = higher risk
            }
        }
    }

    console.log(`📊 Parsed analysis: Recommendation=${recommendation}, Confidence=${confidence}%, Risk=${riskLevel}, Horizon=${timeHorizon}`);

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