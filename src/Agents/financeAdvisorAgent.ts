import axios from "axios";
import { stockAPI } from "../services/stockAPI";
import { extractAssetSymbol, correctSymbol } from "../utils/symbolUtils";
import { calculateTechnicalIndicators } from "../utils/technicalIndicators";
import type { AssetQuote, AssetHistoricalData, TechnicalIndicators, AssetType } from "../services/stockAPI";

const SYSTEM_PROMPT = `
You are FinanceGuru, a Gen Z financial advisor AI with serious market knowledge but a fun, relatable personality.

🎯 Your Personality:
- Use Gen Z slang naturally (no cap, fr fr, lowkey/highkey, slaps, hits different, periodt, etc.)
- Be encouraging and motivational 
- Keep it real about risks - no sugarcoating
- Use emojis and make finance fun but informative
- Reference current events and culture when relevant

📊 Your Expertise:
- Deep technical analysis of stocks AND crypto
- Market trends and sentiment analysis  
- Risk assessment and portfolio advice
- Investment strategies for different goals
- Options, crypto, ETFs, DeFi knowledge
- Cross-asset analysis and correlations

🚀 Analysis Style:
- Always provide specific data-driven insights
- Explain technical indicators in simple terms
- Give clear buy/hold/sell recommendations with reasoning
- Mention price targets and support/resistance levels
- Discuss volume, momentum, and market sentiment
- Consider both fundamental and technical analysis
- For crypto: mention on-chain metrics, adoption, and utility

💡 Communication Rules:
- Start responses with a Gen Z greeting/reaction
- Use technical analysis but explain it simply
- Always mention risks and not financial advice disclaimer
- Be optimistic but realistic about market conditions
- End with actionable advice or next steps
- For crypto, also discuss technology and ecosystem

📈 RESPONSE FORMAT RULES:

🎯 FOR SPECIFIC STOCK/CRYPTO ANALYSIS (when user asks about a particular asset):
Always include these structured elements:
- RECOMMENDATION: State "BUY", "HOLD", or "SELL" clearly
- CONFIDENCE: Give a percentage (0-100%) of how confident you are
- RISK LEVEL: State "LOW RISK", "MEDIUM RISK", or "HIGH RISK" 
- TIME HORIZON: State "SHORT TERM", "MEDIUM TERM", or "LONG TERM"
- PRICE TARGET: If giving a buy/sell recommendation, mention a specific price target

Example for asset analysis:
"My recommendation: BUY
Confidence level: 75%
Risk assessment: MEDIUM RISK  
Time horizon: LONG TERM
Price target: $50,000 (for crypto) or ₹15,000 (for stocks)"

💬 FOR GENERAL FINANCIAL QUESTIONS (market trends, strategies, concepts, etc.):
Only include these elements when giving actual financial advice:
- CONFIDENCE: How confident you are in your advice (0-100%)
- RISK LEVEL: State "LOW RISK", "MEDIUM RISK", or "HIGH RISK" for the topic/strategy discussed

Example for financial advice:
"Confidence level: 80%
Risk assessment: MEDIUM RISK"

🗣️ FOR GREETINGS, CASUAL CONVERSATION, OR NON-FINANCIAL TOPICS:
Do NOT include any structured elements (no confidence, no risk level, no recommendation).
Just provide a natural, conversational response.

Example for casual chat:
Just respond naturally without any analysis metrics.

Remember: You're the friend who actually knows finance AND crypto, not just someone who watched a few TikToks. Keep it real! 💯
`.trim();

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface AssetAnalysisData {
    quote: AssetQuote;
    historicalData: AssetHistoricalData[];
    technicalIndicators: TechnicalIndicators;
    symbol: string;
    assetType: AssetType;
}

interface AnalysisResponse {
    message: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    priceTarget?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
    isFinancialAdvice: boolean;
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
            timeHorizon: 'SHORT',
            isFinancialAdvice: false
        };
    }

    try {
        // Extract asset symbol from user message (now supports both stocks and crypto)
        const assetSymbol = extractAssetSymbol(userMessage);
        let assetData: AssetAnalysisData | null = null;

        // If user is asking about a specific asset, ALWAYS fetch real data and provide detailed analysis
        if (assetSymbol) {
            try {
                assetData = await getAssetAnalysisData(assetSymbol);
                console.log(`📊 Fetched data for ${assetSymbol} (${assetData.assetType}):`, assetData.quote);
            } catch (assetError) {
                console.error('Asset data error:', assetError);
                const errorMessage = assetError instanceof Error ? assetError.message : 'Unknown error occurred';
                return {
                    message: `Yo! 😬 I tried to get the latest data for ${assetSymbol} but ran into some issues: ${errorMessage}\n\nThis might be because:\n• Asset symbol doesn't exist or is misspelled\n• API rate limits hit\n• Market is closed (for stocks)\n• Network issues\n\nTry asking about a different asset or check back later! 🔄📈`,
                    recommendation: 'HOLD',
                    confidence: 0,
                    riskLevel: 'HIGH',
                    timeHorizon: 'SHORT',
                    isFinancialAdvice: false
                };
            }
        }

        // Prepare the context for the AI
        const contextMessage = assetData 
            ? createAssetAnalysisContext(assetData, userMessage)
            : userMessage;

        const messages: ChatMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory,
            { role: "user", content: contextMessage }
        ];

        const result = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_tokens: 2500,
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
        const analysisResponse = parseAnalysisResponse(response, assetData);
        
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
                timeHorizon: 'SHORT',
                isFinancialAdvice: false
            };
        }
        
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            return {
                message: "Whoa there! 🛑 I'm getting rate limited by the API. Too many requests too fast! Give me like 30 seconds to cool down and then we can continue our finance chat! ⏰📈",
                recommendation: 'HOLD',
                confidence: 0,
                riskLevel: 'MEDIUM',
                timeHorizon: 'SHORT',
                isFinancialAdvice: false
            };
        }

        return {
            message: "Yo, my bad! 😅 Something went wrong on my end. The servers are being a bit sus right now. The error was: " + errorMessage + "\n\nTry asking me again in a sec! 🔄",
            recommendation: 'HOLD',
            confidence: 0,
            riskLevel: 'HIGH',
            timeHorizon: 'SHORT',
            isFinancialAdvice: false
        };
    }
}



// Get comprehensive asset data for analysis (supports both stocks and crypto)
async function getAssetAnalysisData(symbol: string): Promise<AssetAnalysisData> {
    const assetType = stockAPI.getAssetType(symbol);
    
    // Fix common symbol mistakes
    const correctedSymbol = correctSymbol(symbol);
    console.log(`🔍 Analyzing ${correctedSymbol} (${assetType})`);
    
    // Optimize API calls - fetch quote and historical data, then calculate indicators from historical data
    const [quote, historicalData] = await Promise.all([
        stockAPI.getAssetQuote(correctedSymbol),
        stockAPI.getAssetHistoricalData(correctedSymbol, 50) // Get more data for better indicators
    ]);
    
    // Calculate technical indicators from existing historical data (no additional API call)
    const technicalIndicators = calculateTechnicalIndicators(historicalData);

    return {
        quote,
        historicalData: historicalData.slice(0, 30), // Return 30 days for charts
        technicalIndicators,
        symbol: correctedSymbol,
        assetType
    };
}





// Create enhanced context message with asset data for AI analysis
function createAssetAnalysisContext(data: AssetAnalysisData, userMessage: string): string {
    const { quote, historicalData, technicalIndicators, symbol, assetType } = data;
    
    // Calculate additional metrics
    const priceChange30Day = historicalData.length >= 30 
        ? ((quote.price - historicalData[29].close) / historicalData[29].close) * 100
        : 0;

    const recentVolume = historicalData.slice(0, 5).reduce((sum, day) => sum + day.volume, 0) / 5;
    const avgVolume = historicalData.reduce((sum, day) => sum + day.volume, 0) / historicalData.length;
    const volumeRatio = avgVolume > 0 ? recentVolume / avgVolume : 1;

    // Create asset-specific context
    if (assetType === 'crypto') {
        const cryptoQuote = quote as any; // CryptoQuote type
        return `
User Question: ${userMessage}

🔥 LIVE CRYPTO DATA FOR ${symbol} (REAL-TIME):

💰 Current Quote:
- Name: ${cryptoQuote.name}
- Price: $${quote.price.toFixed(6)} USD
- Daily Change: ${quote.change >= 0 ? '+' : ''}$${quote.change.toFixed(4)} (${quote.changePercent.toFixed(2)}%)
- 24h Volume: $${(quote.volume / 1000000).toFixed(2)}M
- Market Cap: $${cryptoQuote.marketCap ? (cryptoQuote.marketCap / 1000000000).toFixed(2) + 'B' : 'N/A'}
- 24h High: $${cryptoQuote.high24h?.toFixed(6) || 'N/A'}
- 24h Low: $${cryptoQuote.low24h?.toFixed(6) || 'N/A'}
- Market Rank: ${cryptoQuote.rank ? '#' + cryptoQuote.rank : 'N/A'}

📈 Technical Indicators (LIVE):
- RSI: ${technicalIndicators.rsi.toFixed(1)} ${technicalIndicators.rsi > 70 ? '(Overbought 🔴)' : technicalIndicators.rsi < 30 ? '(Oversold 🟢)' : '(Neutral 🟡)'}
- SMA 20: $${technicalIndicators.sma20.toFixed(6)}
- SMA 50: $${technicalIndicators.sma50.toFixed(6)}
- Price vs SMA20: ${quote.price > technicalIndicators.sma20 ? 'Above 📈' : 'Below 📉'}
- Price vs SMA50: ${quote.price > technicalIndicators.sma50 ? 'Above 📈' : 'Below 📉'}
- MACD: ${technicalIndicators.macd.line.toFixed(6)} (Signal: ${technicalIndicators.macd.signal.toFixed(6)})
- MACD Trend: ${technicalIndicators.macd.line > technicalIndicators.macd.signal ? 'Bullish 🟢' : 'Bearish 🔴'}

📊 Price Performance:
- 30-day change: ${priceChange30Day >= 0 ? '+' : ''}${priceChange30Day.toFixed(2)}%
- Volume Activity: ${volumeRatio.toFixed(1)}x ${volumeRatio > 1.2 ? '(High Volume 🔥)' : volumeRatio < 0.8 ? '(Low Volume 😴)' : '(Normal Volume ✅)'}

🎯 Recent Price Action (Last 7 Days):
${historicalData.slice(0, 7).map(day => 
    `${day.date}: $${day.close.toFixed(6)} (${((day.close - day.open) / day.open * 100).toFixed(1)}%)`
).join('\n')}

💡 Key Levels:
- Support: $${(Math.min(...historicalData.slice(0, 7).map(d => d.low))).toFixed(6)}
- Resistance: $${(Math.max(...historicalData.slice(0, 7).map(d => d.high))).toFixed(6)}

This is LIVE crypto data! Analyze this thoroughly and provide your Gen Z crypto guru perspective with specific insights about the technology, adoption, and price action! Remember to be honest about risks and mention this is not financial advice! 🚀💯
        `.trim();
    } else {
        // Stock analysis context (enhanced)
        return `
User Question: ${userMessage}

🔥 LIVE STOCK DATA FOR ${symbol} (REAL-TIME):

📊 Current Quote:
- Price: ₹${(quote.price * 83).toFixed(2)} (${quote.price.toFixed(2)} USD)
- Daily Change: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)
- Volume: ${quote.volume.toLocaleString()}
- 52W High: ₹${(((quote as any).high52Week || 0) * 83).toFixed(2)}
- 52W Low: ₹${(((quote as any).low52Week || 0) * 83).toFixed(2)}

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
}

// Check if the response contains actual financial advice vs casual conversation
function isFinancialAdviceResponse(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    
    // Keywords that indicate financial advice
    const financeKeywords = [
        'invest', 'buy', 'sell', 'portfolio', 'diversify', 'risk', 'return', 'market', 
        'strategy', 'allocation', 'dollar cost averaging', 'volatility', 'bull market',
        'bear market', 'recession', 'inflation', 'interest rates', 'etf', 'mutual fund',
        'bonds', 'dividends', 'growth', 'value investing', 'trading', 'hodl'
    ];
    
    // Greeting/casual keywords that indicate non-financial conversation
    const casualKeywords = [
        'hello', 'hi', 'hey', 'yo', 'what\'s up', 'good', 'how are you', 'wassup',
        'sup', 'fam', 'bro', 'dude', 'ready to help', 'here to help', 'fire away'
    ];
    
    // Check if it's primarily a casual greeting
    const casualCount = casualKeywords.reduce((count, keyword) => 
        lowerResponse.includes(keyword) ? count + 1 : count, 0);
    
    // Check if it contains financial advice
    const financeCount = financeKeywords.reduce((count, keyword) => 
        lowerResponse.includes(keyword) ? count + 1 : count, 0);
    
    // If it's mainly casual greetings with no financial content, it's not financial advice
    if (casualCount > 0 && financeCount === 0) {
        return false;
    }
    
    // If it contains financial keywords, it's likely financial advice
    return financeCount > 0;
}

// Parse AI response to extract structured data
function parseAnalysisResponse(response: string, assetData: AssetAnalysisData | null): AnalysisResponse {
    const lowerResponse = response.toLowerCase();
    const isAssetSpecificQuery = assetData !== null;
    const isFinancialAdvice = isFinancialAdviceResponse(response);
    
    // For asset-specific queries, extract recommendation
    let recommendation: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
    
    if (isAssetSpecificQuery) {
        // Structured patterns first
        const recommendationMatch = response.match(/recommendation:\s*(BUY|HOLD|SELL)/i);
        if (recommendationMatch) {
            recommendation = recommendationMatch[1].toUpperCase() as 'BUY' | 'HOLD' | 'SELL';
        } else {
            // Fallback to keyword detection for asset queries
            if (lowerResponse.includes('buy') || lowerResponse.includes('bullish') || lowerResponse.includes('strong buy') || 
                lowerResponse.includes('accumulate') || lowerResponse.includes('go long')) {
                recommendation = 'BUY';
            } else if (lowerResponse.includes('sell') || lowerResponse.includes('bearish') || lowerResponse.includes('dump') || 
                       lowerResponse.includes('short') || lowerResponse.includes('avoid')) {
                recommendation = 'SELL';
            }
        }
    }

    // Extract confidence and risk only for financial advice
    let confidence = 50;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    
    if (isAssetSpecificQuery || isFinancialAdvice) {
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
    }

    // Extract time horizon only for asset-specific queries
    let timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG' = 'MEDIUM';
    
    if (isAssetSpecificQuery) {
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
    }

    // Extract price target only for asset-specific queries
    let priceTarget: number | undefined;
    
    if (isAssetSpecificQuery) {
        const priceTargetPatterns = [
            /target.*?[\$₹]([\d,]+(?:\.\d+)?)/i,
            /price target.*?[\$₹]([\d,]+(?:\.\d+)?)/i,
            /[\$₹]([\d,]+(?:\.\d+)?)\s*target/i
        ];
        
        for (const pattern of priceTargetPatterns) {
            const match = response.match(pattern);
            if (match) {
                priceTarget = parseFloat(match[1].replace(/,/g, ''));
                break;
            }
        }
    }

    // Smart defaults based on technical indicators if we have asset data
    if (assetData) {
        const { technicalIndicators } = assetData;
        
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

    if (isAssetSpecificQuery) {
        console.log(`📊 Asset analysis: Recommendation=${recommendation}, Confidence=${confidence}%, Risk=${riskLevel}, Horizon=${timeHorizon}, Target=${priceTarget || 'None'}`);
    } else if (isFinancialAdvice) {
        console.log(`💬 Financial advice: Confidence=${confidence}%, Risk=${riskLevel}`);
    } else {
        console.log(`🗣️ Casual conversation: No analysis metrics`);
    }

    return {
        message: response,
        recommendation,
        confidence,
        priceTarget,
        riskLevel,
        timeHorizon,
        isFinancialAdvice: isAssetSpecificQuery || isFinancialAdvice
    };
}

export type { ChatMessage, AnalysisResponse, AssetAnalysisData }; 