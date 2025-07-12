import axios from 'axios';
import { isCryptoSymbol } from '../utils/symbolUtils';
import { cryptoAPI } from './cryptoAPI';
import { calculateTechnicalIndicators } from '../utils/technicalIndicators';
import { nowInIST, createDemoMarketHoursIST, getISTTimestamp, getMarketStatus, isUSMarketOpen, isIndianMarketOpen } from '../utils/timezoneUtils';
import { 
  generateFallbackStockQuote, 
  generateFallbackStockData, 
  generateFallbackDailyAdjustedData, 
  generateFallbackIntradayData, 
  generateFallbackTechnicalIndicators 
} from '../utils/fallbackData';

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

export interface CandlestickData {
  timestamp: string;
  datetime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DailyAdjustedData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
  dividendAmount: number;
  splitCoefficient: number;
}

export interface ChartSummaryMetrics {
  high: number;
  low: number;
  avgVolume: number;
  rangePercent: number;
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
  private useDemoData: boolean;

  constructor() {
    // Use Alpha Vantage API key from environment variables
    this.alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
    this.useDemoData = false; // Using real Alpha Vantage API data
    
    if (this.alphaVantageKey) {
      console.log('🚀 LIVE MODE ACTIVATED - Using real Alpha Vantage API data');
      console.log('🇮🇳 Timezone: Indian Standard Time (IST, UTC+05:30)');
      console.log('📊 Real-time candlestick charts and 50-day historical data enabled');
      console.log(`🔑 API Key configured: ${this.alphaVantageKey.substring(0, 8)}...`);
    } else {
      console.warn('⚠️ Alpha Vantage API key not found in environment variables');
      console.log('📋 Expected environment variable: VITE_ALPHA_VANTAGE_API_KEY');
      this.useDemoData = true; // Fallback to demo mode
      console.log('🎯 Falling back to demo mode');
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
  async getAssetHistoricalData(symbol: string, days: number = 50): Promise<AssetHistoricalData[]> {
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
  // DEMO DATA METHODS
  // =================

  // Generate realistic demo stock quote
  private generateDemoQuote(symbol: string): StockQuote {
    const basePrice = symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 250 : symbol === 'NVDA' ? 450 : 100;
    const variation = (Math.random() - 0.5) * 10;
    const price = basePrice + variation;
    const change = (Math.random() - 0.5) * 5;
    const changePercent = (change / price) * 100;

    return {
      symbol: symbol.toUpperCase(),
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      high52Week: Math.round((price * 1.3) * 100) / 100,
      low52Week: Math.round((price * 0.7) * 100) / 100
    };
  }

  // Generate realistic demo historical data
  private generateDemoHistoricalData(symbol: string, days: number = 50): StockHistoricalData[] {
    const data: StockHistoricalData[] = [];
    const basePrice = symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 250 : symbol === 'NVDA' ? 450 : 100;
    let currentPrice = basePrice;

    for (let i = days - 1; i >= 0; i--) {
      const date = nowInIST();
      date.setDate(date.getDate() - i);
      
      const dailyVariation = (Math.random() - 0.5) * 0.1;
      currentPrice = currentPrice * (1 + dailyVariation);
      
      const high = currentPrice * (1 + Math.random() * 0.03);
      const low = currentPrice * (1 - Math.random() * 0.03);
      const open = low + (high - low) * Math.random();
      const close = low + (high - low) * Math.random();
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 30000000) + 5000000
      });
    }

    return data.reverse(); // Most recent first
  }

  // Generate realistic demo intraday candlestick data
  private generateDemoIntradayData(symbol: string): CandlestickData[] {
    const data: CandlestickData[] = [];
    const basePrice = symbol === 'AAPL' ? 175 : symbol === 'TSLA' ? 250 : symbol === 'NVDA' ? 450 : 100;
    let currentPrice = basePrice;
    
    // Generate last 100 minutes of data (Indian market hours: 9:15 AM IST)

    const marketOpen = createDemoMarketHoursIST();
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(marketOpen.getTime() + i * 60000); // Each minute
      
      const minuteVariation = (Math.random() - 0.5) * 0.005; // Smaller variation for minutes
      currentPrice = currentPrice * (1 + minuteVariation);
      
      const high = currentPrice * (1 + Math.random() * 0.002);
      const low = currentPrice * (1 - Math.random() * 0.002);
      const open = low + (high - low) * Math.random();
      const close = low + (high - low) * Math.random();
      
      data.push({
        timestamp: getISTTimestamp(timestamp),
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

  // Generate demo daily adjusted data
  private generateDemoDailyAdjustedData(symbol: string, days: number = 50): DailyAdjustedData[] {
    const historicalData = this.generateDemoHistoricalData(symbol, days);
    
    return historicalData.map(day => ({
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      adjustedClose: day.close, // Same as close for demo
      volume: day.volume,
      dividendAmount: Math.random() < 0.1 ? Math.round(Math.random() * 2 * 100) / 100 : 0, // 10% chance of dividend
      splitCoefficient: 1 // No splits in demo data
    }));
  }

  // =================
  // STOCK API METHODS  
  // =================

  // Get stock quote using Alpha Vantage
  async getStockQuote(symbol: string): Promise<StockQuote> {
    console.log(`🔍 Fetching stock quote for ${symbol} via ${this.useDemoData ? 'Demo Data' : 'Alpha Vantage'}`);
    
    if (this.useDemoData) {
      console.log(`📊 Using demo data for ${symbol} quote`);
      return this.generateDemoQuote(symbol);
    }

    if (!this.alphaVantageKey) {
      console.warn(`⚠️ Alpha Vantage API key not configured, using fallback data for ${symbol}`);
      return generateFallbackStockQuote(symbol);
    }

    try {
      return await this.getAlphaVantageQuote(symbol);
    } catch (error) {
      console.error(`❌ Error fetching stock quote for ${symbol}:`, error);
      console.warn(`🔄 Using fallback data for ${symbol} due to API error`);
      return generateFallbackStockQuote(symbol);
    }
  }

  // Get historical stock data using Alpha Vantage
  async getHistoricalData(symbol: string, days: number = 50): Promise<StockHistoricalData[]> {
    const marketStatus = getMarketStatus();
    console.log(`🔍 Fetching historical data for ${symbol} - ${days} days via ${this.useDemoData ? 'Demo Data' : 'Alpha Vantage'}`);
    console.log(`📊 Current Time: ${marketStatus.currentTime} IST | US Market: ${marketStatus.usMarket.status} | Indian Market: ${marketStatus.indianMarket.status}`);
    
    if (this.useDemoData) {
      console.log(`📊 Using demo data for ${symbol} historical data`);
      return this.generateDemoHistoricalData(symbol, days);
    }

    if (!this.alphaVantageKey) {
      console.warn(`⚠️ Alpha Vantage API key not configured, using fallback data for ${symbol}`);
      return generateFallbackStockData(symbol, days);
    }

    try {
      return await this.getAlphaVantageHistorical(symbol, days);
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol}:`, error);
      console.warn(`🔄 Using fallback data for ${symbol} due to API error`);
      return generateFallbackStockData(symbol, days);
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
      console.warn(`🔄 Using fallback technical indicators for ${symbol} due to API error`);
      return generateFallbackTechnicalIndicators(symbol);
    }
  }

  // Get intraday candlestick data (1-minute intervals for current day)
  async getIntradayData(symbol: string): Promise<CandlestickData[]> {
    const marketStatus = getMarketStatus();
    console.log(`🕐 Fetching intraday data for ${symbol} via ${this.useDemoData ? 'Demo Data' : 'Alpha Vantage'}`);
    console.log(`📈 Market Status - US: ${marketStatus.usMarket.status}, Indian: ${marketStatus.indianMarket.status} (Current: ${marketStatus.currentTime} IST)`);
    
    if (this.useDemoData) {
      console.log(`📊 Using demo data for ${symbol} intraday data`);
      return this.generateDemoIntradayData(symbol);
    }

    if (!this.alphaVantageKey) {
      console.warn(`⚠️ Alpha Vantage API key not configured, using fallback data for ${symbol}`);
      return generateFallbackIntradayData(symbol);
    }

    // Warn if markets are closed
    if (!isUSMarketOpen() && !isIndianMarketOpen()) {
      console.log(`⚠️ Both US and Indian markets are CLOSED. Data may be from previous trading session.`);
    }

    try {
      return await this.getAlphaVantageIntraday(symbol);
    } catch (error) {
      console.error(`❌ Error fetching intraday data for ${symbol}:`, error);
      console.warn(`🔄 Using fallback data for ${symbol} due to API error`);
      return generateFallbackIntradayData(symbol);
    }
  }

  // Get daily adjusted data with dividends and splits
  async getDailyAdjustedData(symbol: string, days: number = 50): Promise<DailyAdjustedData[]> {
    const marketStatus = getMarketStatus();
    console.log(`📈 Fetching daily adjusted data for ${symbol} - ${days} days via ${this.useDemoData ? 'Demo Data' : 'Alpha Vantage'}`);
    console.log(`⏰ Time Check: ${marketStatus.currentTime} IST | Market Status - US: ${marketStatus.usMarket.status}, India: ${marketStatus.indianMarket.status}`);
    
    if (!isUSMarketOpen()) {
      console.log(`💡 Data Timing Info: US market is CLOSED, showing data from last trading session. Alpha Vantage free tier has 15-min delay.`);
    }
    
    if (this.useDemoData) {
      console.log(`📊 Using demo data for ${symbol} daily adjusted data`);
      return this.generateDemoDailyAdjustedData(symbol, days);
    }

    if (!this.alphaVantageKey) {
      console.warn(`⚠️ Alpha Vantage API key not configured, using fallback data for ${symbol}`);
      return generateFallbackDailyAdjustedData(symbol, days);
    }

    try {
      return await this.getAlphaVantageDailyAdjusted(symbol, days);
    } catch (error) {
      console.error(`❌ Error fetching daily adjusted data for ${symbol}:`, error);
      console.warn(`🔄 Using fallback data for ${symbol} due to API error`);
      return generateFallbackDailyAdjustedData(symbol, days);
    }
  }

  // Calculate summary metrics from daily data
  calculateSummaryMetrics(data: DailyAdjustedData[]): ChartSummaryMetrics {
    if (data.length === 0) {
      return { high: 0, low: 0, avgVolume: 0, rangePercent: 0 };
    }

    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    const rangePercent = low > 0 ? ((high - low) / low) * 100 : 0;

    return {
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      avgVolume: Math.round(avgVolume),
      rangePercent: Math.round(rangePercent * 100) / 100
    };
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

  // Get intraday data from Alpha Vantage (1-minute intervals)
  private async getAlphaVantageIntraday(symbol: string): Promise<CandlestickData[]> {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${this.alphaVantageKey}`,
        { timeout: 15000 }
      );

      const data = response.data;
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      const timeSeries = data['Time Series (1min)'];
      
      if (!timeSeries) {
        throw new Error(`No intraday data found for ${symbol} on Alpha Vantage`);
      }

      // Convert to candlestick format
      const candlestickData: CandlestickData[] = [];
      const timestamps = Object.keys(timeSeries).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      for (const timestamp of timestamps) {
        const candle = timeSeries[timestamp];
        candlestickData.push({
          timestamp,
          datetime: new Date(timestamp),
          open: parseFloat(candle['1. open']),
          high: parseFloat(candle['2. high']),
          low: parseFloat(candle['3. low']),
          close: parseFloat(candle['4. close']),
          volume: parseInt(candle['5. volume']) || 0
        });
      }

      return candlestickData;

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
      console.error(`❌ Alpha Vantage intraday data error for ${symbol}:`, error);
      throw error;
    }
  }

  // Get daily adjusted data from Alpha Vantage
  private async getAlphaVantageDailyAdjusted(symbol: string, days: number): Promise<DailyAdjustedData[]> {
    try {
      console.log(`🔍 Attempting TIME_SERIES_DAILY_ADJUSTED for ${symbol}`);
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
        { timeout: 15000 }
      );

      const data = response.data;
      console.log(`📝 Alpha Vantage response keys for ${symbol}:`, Object.keys(data));
      
      if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('Alpha Vantage rate limit exceeded');
      }

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
      }

      // Try different possible keys for the time series data
      let timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        console.log(`⚠️ TIME_SERIES_DAILY_ADJUSTED not found for ${symbol}, trying fallback to regular daily data`);
        return await this.getAlphaVantageHistoricalAsAdjusted(symbol, days);
      }

      // Convert to daily adjusted format
      const adjustedData: DailyAdjustedData[] = [];
      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).slice(0, days);

      for (const date of dates) {
        const dayData = timeSeries[date];
        adjustedData.push({
          date,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          adjustedClose: parseFloat(dayData['5. adjusted close']) || parseFloat(dayData['4. close']),
          volume: parseInt(dayData['6. volume']) || 0,
          dividendAmount: parseFloat(dayData['7. dividend amount']) || 0,
          splitCoefficient: parseFloat(dayData['8. split coefficient']) || 1
        });
      }

      console.log(`✅ Successfully fetched ${adjustedData.length} adjusted data points for ${symbol}`);
      return adjustedData;

    } catch (error) {
      console.error(`❌ Alpha Vantage daily adjusted data error for ${symbol}:`, error);
      console.log(`🔄 Falling back to regular daily data for ${symbol}`);
      
      // Fallback to regular daily data
      try {
        return await this.getAlphaVantageHistoricalAsAdjusted(symbol, days);
      } catch (fallbackError) {
        console.error(`❌ Fallback also failed for ${symbol}:`, fallbackError);
        throw new Error(`Both adjusted and regular daily data failed for ${symbol}`);
      }
    }
  }

  // Convert regular historical data to adjusted format (fallback method)
  private async getAlphaVantageHistoricalAsAdjusted(symbol: string, days: number): Promise<DailyAdjustedData[]> {
    console.log(`🔄 Using regular daily data as fallback for ${symbol}`);
    const historicalData = await this.getAlphaVantageHistorical(symbol, days);
    
    // Convert to adjusted format (using close as adjusted close since we don't have real adjusted data)
    return historicalData.map(day => ({
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      adjustedClose: day.close, // Use regular close as adjusted close
      volume: day.volume,
      dividendAmount: 0, // No dividend data available
      splitCoefficient: 1 // No split data available
    }));
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