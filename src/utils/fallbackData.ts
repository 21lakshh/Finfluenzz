import type { CryptoQuote, CryptoHistoricalData, StockQuote, StockHistoricalData, DailyAdjustedData, CandlestickData, TechnicalIndicators } from '../services/stockAPI';

/**
 * Fallback Data Utility
 * Functions for generating realistic mock data when APIs fail
 */

// ====================
// STOCK FALLBACK DATA
// ====================

// Generate fallback stock quote when Alpha Vantage API fails
export function generateFallbackStockQuote(symbol: string): StockQuote {
    console.log(`📊 Generating fallback stock quote for ${symbol}`);
    
    // Base data for popular stocks with realistic current prices
    const fallbackData: Record<string, Partial<StockQuote>> = {
        'AAPL': { price: 175, change: 2.5, changePercent: 1.45, volume: 45000000 },
        'TSLA': { price: 250, change: -5.2, changePercent: -2.03, volume: 85000000 },
        'NVDA': { price: 450, change: 12.8, changePercent: 2.93, volume: 35000000 },
        'MSFT': { price: 320, change: 1.8, changePercent: 0.57, volume: 28000000 },
        'GOOGL': { price: 140, change: -0.9, changePercent: -0.64, volume: 22000000 },
        'AMZN': { price: 130, change: 3.2, changePercent: 2.52, volume: 38000000 },
        'META': { price: 280, change: 4.5, changePercent: 1.63, volume: 18000000 },
        'NFLX': { price: 480, change: -8.1, changePercent: -1.66, volume: 12000000 },
        'AMD': { price: 120, change: 2.1, changePercent: 1.78, volume: 45000000 },
        'INTC': { price: 35, change: -0.5, changePercent: -1.41, volume: 35000000 },
        'RELIANCE': { price: 2500, change: 45, changePercent: 1.83, volume: 8500000 },
        'TCS': { price: 3800, change: -25, changePercent: -0.65, volume: 3200000 },
        'INFY': { price: 1500, change: 15, changePercent: 1.01, volume: 8500000 },
        'HDFC': { price: 1650, change: 12, changePercent: 0.73, volume: 4200000 },
        'ICICIBANK': { price: 950, change: -8, changePercent: -0.83, volume: 6800000 }
    };

    const fallback = fallbackData[symbol.toUpperCase()] || { 
        price: 100, 
        change: (Math.random() - 0.5) * 5, 
        changePercent: (Math.random() - 0.5) * 3, 
        volume: Math.floor(Math.random() * 50000000) + 10000000 
    };

    const basePrice = fallback.price!;
    const change = fallback.change!;
    const changePercent = fallback.changePercent!;
    const volume = fallback.volume!;

    return {
        symbol: symbol.toUpperCase(),
        price: basePrice,
        change: change,
        changePercent: changePercent,
        volume: volume,
        marketCap: basePrice * Math.floor(Math.random() * 1000000000),
        peRatio: 15 + Math.random() * 25, // Realistic P/E ratios
        high52Week: basePrice * (1.1 + Math.random() * 0.3), // 10-40% above current
        low52Week: basePrice * (0.7 + Math.random() * 0.2)   // 10-30% below current
    };
}

// Generate fallback stock historical data when Alpha Vantage API fails
export function generateFallbackStockData(symbol: string, days: number): StockHistoricalData[] {
    console.log(`📊 Generating fallback stock historical data for ${symbol}`);
    
    // Base prices for popular stocks
    const basePrices: Record<string, number> = {
        'AAPL': 175,
        'TSLA': 250,
        'NVDA': 450,
        'MSFT': 320,
        'GOOGL': 140,
        'AMZN': 130,
        'META': 280,
        'NFLX': 480,
        'AMD': 120,
        'INTC': 35,
        'RELIANCE': 2500,
        'TCS': 3800,
        'INFY': 1500,
        'HDFC': 1650,
        'ICICIBANK': 950
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    const data: StockHistoricalData[] = [];
    
    let currentPrice = basePrice;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate realistic stock price movement (±3% daily volatility for stocks)
        const volatility = (Math.random() - 0.5) * 0.06; // ±3%
        currentPrice = currentPrice * (1 + volatility);
        
        const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
        const close = currentPrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        
        data.push({
            date: date.toISOString().split('T')[0],
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: Math.floor(Math.random() * 50000000) + 10000000
        });
    }
    
    return data.reverse(); // Most recent first
}

// Generate fallback daily adjusted data
export function generateFallbackDailyAdjustedData(symbol: string, days: number): DailyAdjustedData[] {
    console.log(`📊 Generating fallback daily adjusted data for ${symbol}`);
    
    const basePrices: Record<string, number> = {
        'AAPL': 175,
        'TSLA': 250,
        'NVDA': 450,
        'MSFT': 320,
        'GOOGL': 140,
        'AMZN': 130,
        'META': 280,
        'NFLX': 480,
        'AMD': 120,
        'INTC': 35,
        'RELIANCE': 2500,
        'TCS': 3800,
        'INFY': 1500,
        'HDFC': 1650,
        'ICICIBANK': 950
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    const data: DailyAdjustedData[] = [];
    
    let currentPrice = basePrice;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const volatility = (Math.random() - 0.5) * 0.06;
        currentPrice = currentPrice * (1 + volatility);
        
        const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
        const close = currentPrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        
        data.push({
            date: date.toISOString().split('T')[0],
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            adjustedClose: Math.round(close * 100) / 100,
            volume: Math.floor(Math.random() * 50000000) + 10000000,
            dividendAmount: Math.random() > 0.8 ? Math.random() * 2 : 0, // 20% chance of dividend
            splitCoefficient: 1 // No splits in fallback data
        });
    }
    
    return data.reverse();
}

// Generate fallback intraday candlestick data
export function generateFallbackIntradayData(symbol: string): CandlestickData[] {
    console.log(`📊 Generating fallback intraday data for ${symbol}`);
    
    const basePrices: Record<string, number> = {
        'AAPL': 175,
        'TSLA': 250,
        'NVDA': 450,
        'MSFT': 320,
        'GOOGL': 140,
        'AMZN': 130,
        'META': 280,
        'NFLX': 480,
        'AMD': 120,
        'INTC': 35,
        'RELIANCE': 2500,
        'TCS': 3800,
        'INFY': 1500,
        'HDFC': 1650,
        'ICICIBANK': 950
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    const data: CandlestickData[] = [];
    
    let currentPrice = basePrice;
    const now = new Date();
    
    // Generate 1-minute candlesticks for the current day (market hours: 9:30 AM - 4:00 PM)
    for (let minute = 0; minute < 390; minute++) { // 6.5 hours = 390 minutes
        const timestamp = new Date(now);
        timestamp.setHours(9, 30 + minute, 0, 0); // Start at 9:30 AM
        
        // Simulate intraday price movement (±1% per minute)
        const volatility = (Math.random() - 0.5) * 0.02;
        currentPrice = currentPrice * (1 + volatility);
        
        const open = currentPrice * (1 + (Math.random() - 0.5) * 0.005);
        const close = currentPrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.005);
        const low = Math.min(open, close) * (1 - Math.random() * 0.005);
        
        data.push({
            timestamp: timestamp.toISOString(),
            datetime: timestamp,
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: Math.floor(Math.random() * 100000) + 10000
        });
    }
    
    return data;
}

// Generate fallback technical indicators
export function generateFallbackTechnicalIndicators(symbol: string): TechnicalIndicators {
    console.log(`📊 Generating fallback technical indicators for ${symbol}`);
    
    const basePrices: Record<string, number> = {
        'AAPL': 175,
        'TSLA': 250,
        'NVDA': 450,
        'MSFT': 320,
        'GOOGL': 140,
        'AMZN': 130,
        'META': 280,
        'NFLX': 480,
        'AMD': 120,
        'INTC': 35,
        'RELIANCE': 2500,
        'TCS': 3800,
        'INFY': 1500,
        'HDFC': 1650,
        'ICICIBANK': 950
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    
    // Generate realistic technical indicators
    const rsi = 30 + Math.random() * 40; // RSI between 30-70 (neutral zone)
    const sma20 = basePrice * (0.95 + Math.random() * 0.1); // 20-day SMA
    const sma50 = basePrice * (0.9 + Math.random() * 0.2);  // 50-day SMA
    
    const macdValue = (Math.random() - 0.5) * 2; // MACD between -1 and 1
    const signalValue = macdValue * (0.8 + Math.random() * 0.4);
    
    return {
        rsi: Math.round(rsi * 100) / 100,
        sma20: Math.round(sma20 * 100) / 100,
        sma50: Math.round(sma50 * 100) / 100,
        macd: {
            line: Math.round(macdValue * 100) / 100,
            signal: Math.round(signalValue * 100) / 100,
            histogram: Math.round((macdValue - signalValue) * 100) / 100
        }
    };
}

// =====================
// CRYPTO FALLBACK DATA
// =====================

// Generate fallback crypto quote when API fails
export function generateFallbackCryptoQuote(symbol: string): CryptoQuote {
    console.log(`📊 Generating fallback quote for ${symbol}`);
    
    // Base data for popular cryptos
    const fallbackData: Record<string, Partial<CryptoQuote>> = {
        'BTC': { name: 'Bitcoin', price: 45000, rank: 1 },
        'ETH': { name: 'Ethereum', price: 2500, rank: 2 },
        'ADA': { name: 'Cardano', price: 0.5, rank: 8 },
        'SOL': { name: 'Solana', price: 100, rank: 5 },
        'DOGE': { name: 'Dogecoin', price: 0.08, rank: 10 },
        'MATIC': { name: 'Polygon', price: 1.2, rank: 12 },
        'LINK': { name: 'Chainlink', price: 15, rank: 15 },
        'DOT': { name: 'Polkadot', price: 7, rank: 11 },
        'AVAX': { name: 'Avalanche', price: 35, rank: 9 },
        'UNI': { name: 'Uniswap', price: 6, rank: 20 }
    };

    const fallback = fallbackData[symbol.toUpperCase()] || { 
        name: `${symbol} Token`, 
        price: 100, 
        rank: 50 
    };

    const basePrice = fallback.price!;
    const dailyChange = (Math.random() - 0.5) * 0.1; // ±5% daily change

    return {
        symbol: symbol.toUpperCase(),
        name: fallback.name!,
        price: basePrice,
        change: basePrice * dailyChange,
        changePercent: dailyChange * 100,
        volume: Math.floor(Math.random() * 1000000000), // Random volume
        marketCap: basePrice * Math.floor(Math.random() * 1000000000),
        high24h: basePrice * 1.05,
        low24h: basePrice * 0.95,
        totalSupply: Math.floor(Math.random() * 1000000000),
        circulatingSupply: Math.floor(Math.random() * 500000000),
        rank: fallback.rank
    };
}

// Generate fallback historical data when API fails
export function generateFallbackCryptoData(symbol: string, days: number): CryptoHistoricalData[] {
    console.log(`📊 Generating fallback data for ${symbol}`);
    
    // Base prices for popular cryptos (approximate values)
    const basePrices: Record<string, number> = {
        'BTC': 45000,
        'ETH': 2500,
        'ADA': 0.5,
        'SOL': 100,
        'DOGE': 0.08,
        'MATIC': 1.2,
        'LINK': 15,
        'DOT': 7,
        'AVAX': 35,
        'UNI': 6
    };

    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    const data: CryptoHistoricalData[] = [];
    
    let currentPrice = basePrice;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate realistic price movement (±5% daily volatility)
        const volatility = (Math.random() - 0.5) * 0.1; // ±5%
        currentPrice = currentPrice * (1 + volatility);
        
        const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
        const close = currentPrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.03);
        const low = Math.min(open, close) * (1 - Math.random() * 0.03);
        
        data.push({
            date: date.toISOString().split('T')[0],
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 1000000) // Random volume
        });
    }
    
    return data.reverse(); // Most recent first
} 