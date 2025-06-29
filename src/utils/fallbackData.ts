import type { CryptoQuote, CryptoHistoricalData } from '../services/stockAPI';

/**
 * Fallback Data Utility
 * Functions for generating realistic mock data when APIs fail
 */

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