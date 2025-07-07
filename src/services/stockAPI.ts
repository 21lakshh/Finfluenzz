import axios from 'axios';
import { isCryptoSymbol } from '../utils/symbolUtils';
import { cryptoAPI } from './cryptoAPI';
import { calculateTechnicalIndicators } from '../utils/technicalIndicators';

/**
 * Stock API Service - Using Finnhub API for real-time stock data
 * Crypto operations are handled by cryptoAPI service
 */

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  totalSupply?: number;
  circulatingSupply?: number;
  rank?: number;
}

export interface StockHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CryptoHistoricalData = StockHistoricalData;

export interface TechnicalIndicators {
  rsi: number;
  sma20: number;
  sma50: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
}

// Combined interfaces for unified handling
export type AssetQuote = StockQuote | CryptoQuote;
export type AssetHistoricalData = StockHistoricalData | CryptoHistoricalData;
export type AssetType = 'stock' | 'crypto';

class StockAPIService {
  private finnhubKey: string;

  constructor() {
    // Use Finnhub API key from environment variables
    this.finnhubKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    
    if (!this.finnhubKey) {
      console.error('❌ Finnhub API key not found! Please add VITE_FINNHUB_API_KEY to your .env file');
    } else {
      console.log('✅ Finnhub API initialized successfully');
    }
  }

  // Get asset type using utility function
  public getAssetType(symbol: string): AssetType {
    return isCryptoSymbol(symbol) ? 'crypto' : 'stock';
  }

  // Unified method to get any asset quote
  async getAssetQuote(symbol: string): Promise<AssetQuote> {
    const assetType = this.getAssetType(symbol);
    
    if (assetType === 'crypto') {
      return await cryptoAPI.getCryptoQuote(symbol);
    } else {
      return await this.getStockQuote(symbol);
    }
  }

  // Unified method to get historical data
  async getAssetHistoricalData(symbol: string, days: number = 30): Promise<AssetHistoricalData[]> {
    const assetType = this.getAssetType(symbol);
    
    if (assetType === 'crypto') {
      return await cryptoAPI.getCryptoHistoricalData(symbol, days);
    } else {
      return await this.getHistoricalData(symbol, days);
    }
  }

  // Unified method to get technical indicators
  async getAssetTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    const assetType = this.getAssetType(symbol);
    
    if (assetType === 'crypto') {
      return await cryptoAPI.getCryptoTechnicalIndicators(symbol);
    } else {
      return await this.getTechnicalIndicators(symbol);
    }
  }

  // =================
  // STOCK API METHODS  
  // =================

  // Get stock quote using Finnhub
  async getStockQuote(symbol: string): Promise<StockQuote> {
    console.log(`🔍 Fetching stock quote for ${symbol} via Finnhub`);
    
    if (!this.finnhubKey) {
      throw new Error('Finnhub API key not configured');
    }

    try {
      return await this.getFinnhubQuote(symbol);
    } catch (error) {
      console.error(`❌ Error fetching stock quote for ${symbol}:`, error);
      throw error;
    }
  }

  // Get historical stock data using Finnhub
  async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    console.log(`🔍 Fetching historical data for ${symbol} - ${days} days via Finnhub`);
    
    if (!this.finnhubKey) {
      throw new Error('Finnhub API key not configured');
      }

    try {
      return await this.getFinnhubHistorical(symbol, days);
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  // Get technical indicators for stocks
  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    try {
      console.log(`📊 Calculating technical indicators for ${symbol}`);
      const historicalData = await this.getHistoricalData(symbol, 60);
      
      // Use the utility function to calculate indicators
      return calculateTechnicalIndicators(historicalData);
    } catch (error) {
      console.error(`❌ Error calculating technical indicators for ${symbol}:`, error);
      throw error;
    }
  }

  // ======================
  // FINNHUB API METHODS
  // ======================

  // Get real-time quote from Finnhub
  private async getFinnhubQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubKey}`,
        { timeout: 8000 }
      );

      const data = response.data;
      
      if (!data.c || data.c === 0) {
        throw new Error(`No data found for symbol ${symbol} on Finnhub`);
      }

      return {
        symbol: symbol.toUpperCase(),
        price: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
        volume: 0, // Finnhub quote doesn't include volume in this endpoint
        high52Week: data.h || undefined,
        low52Week: data.l || undefined
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Finnhub rate limit exceeded');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Finnhub API key');
        }
      }
      console.error(`❌ Finnhub quote error for ${symbol}:`, error);
      throw error;
    }
  }

  // Get historical data from Finnhub
  private async getFinnhubHistorical(symbol: string, days: number): Promise<StockHistoricalData[]> {
    try {
      const toDate = Math.floor(Date.now() / 1000);
      const fromDate = toDate - (days * 24 * 60 * 60);

      const response = await axios.get(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromDate}&to=${toDate}&token=${this.finnhubKey}`,
        { timeout: 10000 }
      );

      const data = response.data;
      
      if (data.s === 'no_data' || !data.c) {
        throw new Error(`No historical data found for ${symbol} on Finnhub`);
      }

      return data.c.map((close: number, index: number) => ({
        date: new Date(data.t[index] * 1000).toISOString().split('T')[0],
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close,
        volume: data.v[index] || 0
      })).reverse(); // Most recent first

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Finnhub rate limit exceeded');  
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Finnhub API key');
        }
      }
      console.error(`❌ Finnhub historical data error for ${symbol}:`, error);
      throw error;
    }
  }

  // ===================
  // UTILITY METHODS
  // ===================

  // Get multiple quotes at once (batch processing)
  async getBatchQuotes(symbols: string[]): Promise<AssetQuote[]> {
    console.log(`🔍 Fetching batch quotes for ${symbols.length} symbols`);
    
    try {
      const stockSymbols = symbols.filter(symbol => this.getAssetType(symbol) === 'stock');
      const cryptoSymbols = symbols.filter(symbol => this.getAssetType(symbol) === 'crypto');
      
      const promises = [];
      
      // Process stock quotes individually (Finnhub doesn't support batch quotes)
      for (const symbol of stockSymbols) {
        promises.push(this.getAssetQuote(symbol));
      }
      
      // Process crypto quotes individually
      for (const symbol of cryptoSymbols) {
        promises.push(this.getAssetQuote(symbol));
      }
      
      const results = await Promise.allSettled(promises);
      const quotes: AssetQuote[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          quotes.push(result.value);
        } else {
          console.warn(`Failed to fetch quote for ${symbols[index]}:`, result.reason);
        }
      });
      
      return quotes;
    } catch (error) {
      console.error(`❌ Error fetching batch quotes:`, error);
      throw error;
    }
  }

  // Get company profile from Finnhub
  async getCompanyProfile(symbol: string): Promise<any> {
    if (!this.finnhubKey) {
      throw new Error('Finnhub API key not configured');
    }

    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${this.finnhubKey}`,
        { timeout: 5000 }
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching company profile for ${symbol}:`, error);
      throw error;
    }
  }

  // Get market news from Finnhub
  async getMarketNews(category: string = 'general'): Promise<any[]> {
    if (!this.finnhubKey) {
      throw new Error('Finnhub API key not configured');
    }

    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/news?category=${category}&token=${this.finnhubKey}`,
        { timeout: 8000 }
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching market news:`, error);
      throw error;
    }
  }

  // Get stock symbols/search
  async searchSymbols(query: string): Promise<any> {
    if (!this.finnhubKey) {
      throw new Error('Finnhub API key not configured');
    }

    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/search?q=${query}&token=${this.finnhubKey}`,
        { timeout: 5000 }
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Error searching symbols for ${query}:`, error);
      throw error;
    }
  }

  // Check API usage (Finnhub doesn't have usage endpoint, so this is a placeholder)
  async getAPIUsage(): Promise<any> {
    return {
      message: 'Finnhub does not provide API usage endpoint',
      recommendation: 'Monitor rate limits through response headers'
    };
  }
}

// Export singleton instance
export const stockAPI = new StockAPIService(); 