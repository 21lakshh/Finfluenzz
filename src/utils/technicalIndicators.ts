import type { AssetHistoricalData, TechnicalIndicators } from '../services/stockAPI';

/**
 * Technical Indicators Utility
 * Pure functions for calculating technical analysis indicators
 */

// Calculate all technical indicators from historical data
export function calculateTechnicalIndicators(historicalData: AssetHistoricalData[]): TechnicalIndicators {
    if (historicalData.length < 14) {
        console.warn(`⚠️ Limited data (${historicalData.length} days), using simplified indicators`);
    }

    const prices = historicalData.map(d => d.close);
    
    const rsi = calculateRSI(prices, Math.min(14, prices.length - 1));
    const sma20 = calculateSMA(prices, Math.min(20, prices.length));
    const sma50 = calculateSMA(prices, Math.min(50, prices.length));
    const macd = calculateMACD(prices);

    console.log(`✅ Calculated indicators: RSI=${rsi.toFixed(1)}, SMA20=${sma20.toFixed(2)}, SMA50=${sma50.toFixed(2)}`);

    return { rsi, sma20, sma50, macd };
}

// Generate fallback technical indicators
export function generateFallbackTechnicalIndicators(symbol: string): TechnicalIndicators {
    console.log(`📊 Generating fallback technical indicators for ${symbol}`);
    
    const rsi = 30 + Math.random() * 40; // RSI between 30-70 (neutral zone)
    const basePrice = 1000 + Math.random() * 10000;
    const sma20 = basePrice * (0.95 + Math.random() * 0.1);
    const sma50 = basePrice * (0.9 + Math.random() * 0.2);
    
    const macdValue = (Math.random() - 0.5) * 2; // MACD between -1 and 1
    const signalValue = macdValue * (0.8 + Math.random() * 0.4);
    
    return {
        rsi,
        sma20,
        sma50,
        macd: {
            line: macdValue,
            signal: signalValue,
            histogram: macdValue - signalValue
        }
    };
}

// RSI (Relative Strength Index) calculation
export function calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50; // Default neutral RSI

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        avgGain = ((avgGain * (period - 1)) + (change > 0 ? change : 0)) / period;
        avgLoss = ((avgLoss * (period - 1)) + (change < 0 ? -change : 0)) / period;
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// SMA (Simple Moving Average) calculation
export function calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;
    
    const recentPrices = prices.slice(0, period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
}

// MACD (Moving Average Convergence Divergence) calculation
export function calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    if (prices.length < 26) {
        return { line: 0, signal: 0, histogram: 0 };
    }
    
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.8; // Simplified signal line
    
    return {
        line: macdLine,
        signal: signalLine,
        histogram: macdLine - signalLine
    };
}

// EMA (Exponential Moving Average) calculation
export function calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[period - 1]; // Start with SMA
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
} 