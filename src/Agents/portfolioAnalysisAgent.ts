const SYSTEM_PROMPT = `
You are PortfolioAnalyzer Pro, an AI investment analyst specializing in comprehensive portfolio analysis for Gen Z investors.

🎯 Your Role:
- Analyze portfolio holdings from uploaded documents (PDF/image text)
- Provide detailed insights about each stock/investment
- Analyze current market trends and stock performance
- Give specific buy/hold/sell recommendations
- Assess portfolio diversification and risk
- Use real-time stock data for current valuations

📊 Analysis Framework:
1. **Portfolio Overview**: Total value, number of holdings, diversification score
2. **Individual Stock Analysis**: For each holding, analyze:
   - Current price and performance trends
   - Technical indicators (RSI, moving averages)
   - Market sentiment and recommendations
3. **Risk Assessment**: Portfolio concentration, sector allocation, volatility
4. **Recommendations**: Specific actions for each holding with reasoning

🚀 Communication Style:
- Use Gen Z language but keep it professional for financial advice
- Be specific with numbers and percentages
- Explain technical terms in simple language
- Provide actionable insights, not just data

💡 Recommendation Framework:
- **STRONG BUY**: High confidence, significant upside potential
- **BUY**: Good opportunity, favorable risk/reward
- **HOLD**: Maintain position, monitor closely
- **SELL**: Consider reducing position, better opportunities elsewhere
- **STRONG SELL**: High risk, exit recommended

Always include:
- Confidence levels for recommendations (0-100%)
- Risk levels (LOW/MEDIUM/HIGH)
- Time horizons (SHORT/MEDIUM/LONG term)

🚨 Important Notes:
- Always mention this is analysis, not financial advice
- Consider the user's risk tolerance and investment goals
- Focus on long-term wealth building for Gen Z

Remember: You're helping young investors make informed decisions about their financial future! 💯
`.trim();

import axios from "axios";
import { stockAPI } from "../services/stockAPI";
import type { AssetQuote, TechnicalIndicators } from "../services/stockAPI";

interface PortfolioHolding {
    symbol: string;
    shares?: number;
    purchasePrice?: number;
}

interface StockAnalysis {
    symbol: string;
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
    technicalIndicators: TechnicalIndicators;
}

interface PortfolioAnalysisResult {
    portfolioSummary: string;
    individualAnalyses: StockAnalysis[];
    overallRecommendation: string;
    riskAssessment: string;
    marketOutlook: string;
    totalPortfolioValue: number;
    diversificationScore: number;
}

// Extract stock symbols from portfolio text
function extractStockSymbols(text: string): string[] {
    const symbols: string[] = [];
    
    // Common patterns for stock symbols in Indian market
    const patterns = [
        /([A-Z]{2,6})\.NS/g,  // NSE symbols
        /([A-Z]{2,6})\.BO/g,  // BSE symbols
        /\b([A-Z]{3,6})\b/g,  // Plain symbols
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                let symbol = match.toUpperCase().replace(/\.(NS|BO)$/, '');
                if (!symbols.includes(symbol)) {
                    symbols.push(symbol);
                }
            });
        }
    }

    // Common Indian stock symbols
    const commonSymbols = ['RELIANCE', 'TCS', 'HDFC', 'ICICI', 'INFY', 'ITC', 'SBIN'];
    commonSymbols.forEach(symbol => {
        if (text.toUpperCase().includes(symbol) && !symbols.includes(symbol)) {
            symbols.push(symbol);
        }
    });

    return symbols.slice(0, 10); // Limit to 10 stocks for performance
}

// Get real-time data for a stock
async function getStockRealTimeData(symbol: string): Promise<{
    quote: AssetQuote;
    technicalIndicators: TechnicalIndicators;
}> {
    const [quote, technicalIndicators] = await Promise.all([
        stockAPI.getAssetQuote(symbol),
        stockAPI.getAssetTechnicalIndicators(symbol)
    ]);

    return { quote, technicalIndicators };
}

export default async function portfolioAnalysisAgent(
    portfolioText: string
): Promise<PortfolioAnalysisResult> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY not found in environment variables");
    }

    try {
        // Extract stock symbols from the uploaded document
        const symbols = extractStockSymbols(portfolioText);
        
        if (symbols.length === 0) {
            throw new Error("No stock symbols found in the uploaded document. Please ensure your portfolio document contains recognizable stock symbols.");
        }

        console.log(`📊 Found ${symbols.length} holdings:`, symbols);

        // Get real-time data for all holdings
        const stockAnalyses: StockAnalysis[] = [];
        let totalPortfolioValue = 0;

        for (const symbol of symbols) {
            try {
                const { quote, technicalIndicators } = await getStockRealTimeData(symbol);
                
                // Estimate portfolio value (assuming 100 shares if not specified)
                const estimatedShares = 100;
                if ('price' in quote) {
                    totalPortfolioValue += estimatedShares * quote.price;
                }

                // Determine recommendation based on technical indicators
                let recommendation: StockAnalysis['recommendation'] = 'HOLD';
                let confidence = 50;
                let riskLevel: StockAnalysis['riskLevel'] = 'MEDIUM';

                if (technicalIndicators.rsi < 30) {
                    recommendation = 'BUY';
                    confidence = 70;
                } else if (technicalIndicators.rsi > 70) {
                    recommendation = 'SELL';
                    confidence = 65;
                } else if ('changePercent' in quote && quote.changePercent > 5) {
                    recommendation = 'STRONG_BUY';
                    confidence = 75;
                    riskLevel = 'HIGH';
                }

                stockAnalyses.push({
                    symbol,
                    currentPrice: 'price' in quote ? quote.price : 0,
                    priceChange: 'change' in quote ? quote.change : 0,
                    priceChangePercent: 'changePercent' in quote ? quote.changePercent : 0,
                    recommendation,
                    confidence,
                    riskLevel,
                    timeHorizon: 'MEDIUM',
                    technicalIndicators
                });

            } catch (error) {
                console.error(`Failed to analyze ${symbol}:`, error);
                // Continue with other stocks even if one fails
            }
        }

        // Prepare simplified context for Gemini AI analysis
        const analysisContext = `
Portfolio Holdings Analysis:
${stockAnalyses.map(analysis => `
${analysis.symbol}: ₹${analysis.currentPrice} (${analysis.priceChangePercent}% change)
RSI: ${analysis.technicalIndicators.rsi.toFixed(1)}
Recommendation: ${analysis.recommendation}
`).join('')}

Original Document: "${portfolioText}"

Please provide comprehensive portfolio analysis with specific recommendations for each stock.
        `.trim();

        // Call Gemini AI for detailed analysis
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `${SYSTEM_PROMPT}\n\n${analysisContext}`
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (response.status !== 200) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const aiAnalysis = response.data.candidates[0].content.parts[0].text;

        // Calculate diversification score
        const diversificationScore = Math.min(100, (stockAnalyses.length / 10) * 100);

        return {
            portfolioSummary: `Portfolio contains ${stockAnalyses.length} holdings with estimated total value of ₹${totalPortfolioValue.toLocaleString()}`,
            individualAnalyses: stockAnalyses,
            overallRecommendation: aiAnalysis,
            riskAssessment: `Portfolio risk level: ${stockAnalyses.some(s => s.riskLevel === 'HIGH') ? 'HIGH' : 'MEDIUM'}`,
            marketOutlook: 'Current market analysis based on real-time data',
            totalPortfolioValue,
            diversificationScore
        };

    } catch (error) {
        console.error('Portfolio analysis error:', error);
        throw error;
    }
}

export type { PortfolioHolding, StockAnalysis, PortfolioAnalysisResult }; 