import axios from 'axios';
import type { CryptoQuote, CryptoHistoricalData, TechnicalIndicators } from './stockAPI';
import { getCoinGeckoId } from '../utils/symbolUtils';
import { generateFallbackCryptoQuote, generateFallbackCryptoData } from '../utils/fallbackData';
import { calculateTechnicalIndicators, generateFallbackTechnicalIndicators } from '../utils/technicalIndicators';

/**
 * Crypto API Service
 * Handles all cryptocurrency data fetching using CoinGecko API
 */

export class CryptoAPIService {
    // Get crypto quote using CoinGecko API (free) with retry logic
    async getCryptoQuote(symbol: string): Promise<CryptoQuote> {
        const coinId = getCoinGeckoId(symbol);
        const maxRetries = 2;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔍 Fetching crypto quote for ${symbol} (${coinId}) - Attempt ${attempt}`);
                
                const response = await axios.get(
                    `/api/coingecko/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
                    {
                        timeout: 8000, // 8 second timeout
                        headers: {
                            'Accept': 'application/json'
                        }
                    }
                );

                const data = response.data;
                const marketData = data.market_data;

                if (!marketData) {
                    console.warn(`⚠️ No market data found for ${symbol}, trying fallback`);
                    if (attempt === maxRetries) {
                        return generateFallbackCryptoQuote(symbol);
                    }
                    continue;
                }

                console.log(`✅ Successfully fetched quote for ${symbol}: $${marketData.current_price?.usd}`);

                return {
                    symbol: symbol.toUpperCase(),
                    name: data.name,
                    price: marketData.current_price?.usd || 0,
                    change: marketData.price_change_24h || 0,
                    changePercent: marketData.price_change_percentage_24h || 0,
                    volume: marketData.total_volume?.usd || 0,
                    marketCap: marketData.market_cap?.usd,
                    high24h: marketData.high_24h?.usd,
                    low24h: marketData.low_24h?.usd,
                    totalSupply: marketData.total_supply,
                    circulatingSupply: marketData.circulating_supply,
                    rank: data.market_cap_rank
                };

            } catch (error) {
                console.error(`❌ Error fetching crypto quote (attempt ${attempt}):`, error);
                
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 429) {
                        console.warn(`⚠️ Rate limit hit for ${symbol}, waiting before retry...`);
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                            continue;
                        }
                    }
                    if (error.response?.status === 404) {
                        throw new Error(`Crypto ${symbol} not found. Please check the symbol and try a popular one like BTC, ETH, ADA.`);
                    }
                }
                
                // If this is the last attempt, use fallback data
                if (attempt === maxRetries) {
                    console.warn(`⚠️ Using fallback quote for ${symbol} after ${maxRetries} attempts`);
                    return generateFallbackCryptoQuote(symbol);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Fallback if all attempts fail
        return generateFallbackCryptoQuote(symbol);
    }

    // Get crypto historical data using market chart endpoint (more reliable)
    async getCryptoHistoricalData(symbol: string, days: number = 50): Promise<CryptoHistoricalData[]> {
        try {
            const coinId = getCoinGeckoId(symbol);
            console.log(`🔍 Fetching crypto data for ${symbol} (${coinId}) - ${days} days`);
            
            // Use market_chart endpoint which is more reliable for free tier
            const response = await axios.get(
                `/api/coingecko/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
                {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            const { prices } = response.data;
            
            if (!prices || !Array.isArray(prices) || prices.length === 0) {
                console.warn(`⚠️ No price data found for ${symbol}, using fallback data`);
                return generateFallbackCryptoData(symbol, days);
            }

            console.log(`✅ Retrieved ${prices.length} price points for ${symbol}`);

            // Convert price data to OHLC format
            // Since we only have prices, we'll approximate OHLC using price data
            return prices.map((pricePoint: [number, number], index: number) => {
                const [timestamp, price] = pricePoint;
                const date = new Date(timestamp).toISOString().split('T')[0];
                
                // For daily data, we approximate OHLC from the price point
                // In a real scenario, you'd want actual OHLC data, but this works for charts
                const open = index > 0 ? prices[index - 1][1] : price;
                const high = price * 1.02; // Approximate 2% daily volatility
                const low = price * 0.98;
                const close = price;
                
                return {
                    date,
                    open,
                    high,
                    low,
                    close,
                    volume: 0 // Volume not available in this endpoint
                };
            }).reverse(); // Most recent first

        } catch (error) {
            console.error('❌ Error fetching crypto historical data:', error);
            
            // Check for specific error types
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    console.warn('⚠️ Rate limit hit, using fallback data');
                    return generateFallbackCryptoData(symbol, days);
                }
                if (error.response?.status === 404) {
                    throw new Error(`Crypto ${symbol} not found. Please check the symbol.`);
                }
                if (error.code === 'ECONNABORTED') {
                    console.warn('⚠️ Request timeout, using fallback data');
                    return generateFallbackCryptoData(symbol, days);
                }
            }
            
            // Try fallback data before failing completely
            console.warn(`⚠️ Using fallback data for ${symbol} due to API error`);
            return generateFallbackCryptoData(symbol, days);
        }
    }

    // Calculate technical indicators for crypto
    async getCryptoTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
        try {
            console.log(`📊 Calculating technical indicators for ${symbol}`);
            const historicalData = await this.getCryptoHistoricalData(symbol, 60);
            
            if (historicalData.length < 14) {
                console.warn(`⚠️ Limited data for ${symbol}, using shorter periods for indicators`);
            }
            
            return calculateTechnicalIndicators(historicalData);
        } catch (error) {
            console.error(`❌ Error calculating crypto technical indicators for ${symbol}:`, error);
            
            // Generate fallback technical indicators
            console.warn(`⚠️ Using fallback technical indicators for ${symbol}`);
            return generateFallbackTechnicalIndicators(symbol);
        }
    }
}

export const cryptoAPI = new CryptoAPIService(); 