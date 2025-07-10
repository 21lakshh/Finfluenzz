import axios from 'axios';
import { isCryptoSymbol } from '../utils/symbolUtils';
import { cryptoAPI } from './cryptoAPI';
import { calculateTechnicalIndicators } from '../utils/technicalIndicators';

/**
 * Stock API Service - Using Alpha Vantage API for real-time stock data
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
  private alphaVantageKey: string;

  constructor() {
    // Use Alpha Vantage API key from environment variables
    this.alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
    
    if (!this.alphaVantageKey) {
      console.error('❌ Alpha Vantage API key not found! Please add VITE_ALPHA_VANTAGE_API_KEY to your .env file');
    } else {
      console.log('✅ Alpha Vantage API initialized successfully');
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

  // Get stock quote using Alpha Vantage
  async getStockQuote(symbol: string): Promise<StockQuote> {
    console.log(`🔍 Fetching stock quote for ${symbol} via Alpha Vantage`);
    
    if (!this.alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      return await this.getAlphaVantageQuote(symbol);
    } catch (error) {
      console.error(`❌ Error fetching stock quote for ${symbol}:`, error);
      throw error;
    }
  }

  // Get historical stock data using Alpha Vantage
  async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    console.log(`🔍 Fetching historical data for ${symbol} - ${days} days via Alpha Vantage`);
    
    if (!this.alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      return await this.getAlphaVantageHistorical(symbol, days);
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

  // =========================
  // ALPHA VANTAGE API METHODS
  // =========================

  // Get real-time quote from Alpha Vantage
  private async getAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
        { timeout: 10000 }
      );

      const data = response.data;
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      const quote = data['Global Quote'];
      
      if (!quote || !quote['05. price']) {
        throw new Error(`No quote data found for symbol ${symbol} on Alpha Vantage`);
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      const volume = parseInt(quote['06. volume']) || 0;
      const high = parseFloat(quote['03. high']);
      const low = parseFloat(quote['04. low']);

      return {
        symbol: symbol.toUpperCase(),
        price,
        change,
        changePercent,
        volume,
        high52Week: high, // Alpha Vantage Global Quote doesn't provide 52-week data
        low52Week: low
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Alpha Vantage rate limit exceeded');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Alpha Vantage API key');
        }
        if (error.response?.status === 403) {
          throw new Error('Alpha Vantage API access denied - check your API key');
        }
      }
      console.error(`❌ Alpha Vantage quote error for ${symbol}:`, error);
      throw error;
    }
  }

  // Get historical data from Alpha Vantage
  private async getAlphaVantageHistorical(symbol: string, days: number): Promise<StockHistoricalData[]> {
    try {
      // Use TIME_SERIES_DAILY for historical data
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
        { timeout: 15000 }
      );

      const data = response.data;
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      const timeSeries = data['Time Series (Daily)'];
      
      if (!timeSeries) {
        throw new Error(`No historical data found for ${symbol} on Alpha Vantage`);
      }

      // Convert the time series data to our format
      const historicalData: StockHistoricalData[] = [];
      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).slice(0, days);

      for (const date of dates) {
        const dayData = timeSeries[date];
        historicalData.push({
          date,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          volume: parseInt(dayData['5. volume']) || 0
        });
      }

      return historicalData; // Already sorted with most recent first

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Alpha Vantage rate limit exceeded');  
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Alpha Vantage API key');
        }
        if (error.response?.status === 403) {
          throw new Error('Alpha Vantage API access denied - check your API key');
        }
      }
      console.error(`❌ Alpha Vantage historical data error for ${symbol}:`, error);
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
      
      // Process stock quotes individually (Alpha Vantage doesn't support batch quotes)
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

  // Get company profile from Alpha Vantage
  async getCompanyProfile(symbol: string): Promise<any> {
    if (!this.alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
        { timeout: 10000 }
      );

      const data = response.data;
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error fetching company profile for ${symbol}:`, error);
      throw error;
    }
  }

  // Get market news from Alpha Vantage
  async getMarketNews(category: string = 'general'): Promise<any[]> {
    if (!this.alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      // Alpha Vantage News & Sentiment API
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${category}&apikey=${this.alphaVantageKey}`,
        { timeout: 10000 }
      );

      const data = response.data;
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      return data.feed || [];
    } catch (error) {
      console.error(`❌ Error fetching market news:`, error);
      throw error;
    }
  }

  // Get stock symbols/search
  async searchSymbols(query: string): Promise<any> {
    if (!this.alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.alphaVantageKey}`,
        { timeout: 10000 }
      );

      const data = response.data;
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Error searching symbols for ${query}:`, error);
      throw error;
    }
  }

  // Check API usage for Alpha Vantage (they don't provide usage endpoint, so this is informational)
  async getAPIUsage(): Promise<any> {
    return {
      message: 'Alpha Vantage API Usage Information',
      freeLimit: '25 requests per day',
      premiumLimits: '75-1200 requests per minute (depending on plan)',
      recommendation: 'Monitor rate limit headers and implement caching for better performance'
    };
  }
}

// Export singleton instance
export const stockAPI = new StockAPIService(); 