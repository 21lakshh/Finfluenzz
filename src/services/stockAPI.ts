import axios from 'axios';
import { isCryptoSymbol } from '../utils/symbolUtils';
import { cryptoAPI } from './cryptoAPI';
import { calculateTechnicalIndicators } from '../utils/technicalIndicators';

/**
 * Stock API Service - Clean and focused on stock operations only
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
  private finnhubKey: string;

  constructor() {
    this.alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
    this.finnhubKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    
    if (!this.alphaVantageKey && !this.finnhubKey) {
      console.error('❌ No stock API keys found! Please add VITE_ALPHA_VANTAGE_API_KEY or VITE_FINNHUB_API_KEY to your .env file');
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

  // Get stock quote with fallback providers
  async getStockQuote(symbol: string): Promise<StockQuote> {
    console.log(`🔍 Fetching stock quote for ${symbol}`);
    
    // Try Alpha Vantage first if available
    if (this.alphaVantageKey) {
      try {
        return await this.getAlphaVantageQuote(symbol);
      } catch (error) {
        console.warn(`⚠️ Alpha Vantage failed for ${symbol}, trying Finnhub...`);
      }
    }
    
    // Fallback to Finnhub
    if (this.finnhubKey) {
      return await this.getFinnhubQuote(symbol);
    }
    
    throw new Error('No valid API keys found for stock data');
  }

  // Get historical stock data with fallback providers
  async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    console.log(`🔍 Fetching historical data for ${symbol} - ${days} days`);
    
    // Try Alpha Vantage first if available
    if (this.alphaVantageKey) {
      try {
        return await this.getAlphaVantageHistorical(symbol, days);
      } catch (error) {
        console.warn(`⚠️ Alpha Vantage historical failed for ${symbol}, trying Finnhub...`);
      }
    }
    
    // Fallback to Finnhub
    if (this.finnhubKey) {
      return await this.getFinnhubHistorical(symbol, days);
    }
    
    throw new Error('No valid API keys found for historical stock data');
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

  // Alpha Vantage Quote
  private async getAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
        { timeout: 8000 }
      );

      const quote = response.data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        // Check for error message
        if (response.data['Error Message']) {
          throw new Error(`Alpha Vantage error: ${response.data['Error Message']}`);
        }
        if (response.data['Note']) {
          throw new Error(`Alpha Vantage rate limit: ${response.data['Note']}`);
        }
        throw new Error(`No data returned for symbol ${symbol}. Check if symbol exists.`);
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high52Week: parseFloat(quote['03. high']),
        low52Week: parseFloat(quote['04. low'])
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Alpha Vantage rate limit exceeded');
        }
      }
      throw error;
    }
  }

  // Alpha Vantage Historical Data
  private async getAlphaVantageHistorical(symbol: string, days: number): Promise<StockHistoricalData[]> {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.alphaVantageKey}&outputsize=compact`,
        { timeout: 10000 }
      );

      const timeSeries = response.data['Time Series (Daily)'];
      
      if (!timeSeries) {
        if (response.data['Error Message']) {
          throw new Error(`Alpha Vantage error: ${response.data['Error Message']}`);
        }
        if (response.data['Note']) {
          throw new Error(`Alpha Vantage rate limit: ${response.data['Note']}`);
        }
        throw new Error(`No historical data found for ${symbol}`);
      }

      return Object.entries(timeSeries)
        .slice(0, days)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'])
        }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Alpha Vantage rate limit exceeded');
        }
      }
      throw error;
    }
  }

  // Finnhub Quote
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
        symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: 0, // Finnhub quote doesn't include volume
        high52Week: data.h,
        low52Week: data.l
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Finnhub rate limit exceeded');
        }
      }
      throw error;
    }
  }

  // Finnhub Historical Data  
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
        volume: data.v[index]
      })).reverse(); // Most recent first

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Finnhub rate limit exceeded');  
        }
      }
      throw error;
    }
  }
}

export const stockAPI = new StockAPIService(); 