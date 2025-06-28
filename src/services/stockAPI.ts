import axios from 'axios';

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

export interface StockHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

class StockAPIService {
  private alphaVantageKey: string;
  private finnhubKey: string;

  constructor() {
    this.alphaVantageKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
    this.finnhubKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    
    // Validate API keys on initialization
    if (!this.alphaVantageKey && !this.finnhubKey) {
      console.error('❌ No stock API keys found! Please add VITE_ALPHA_VANTAGE_API_KEY or VITE_FINNHUB_API_KEY to your .env file');
    }
  }

  // Get real-time stock quote
  async getStockQuote(symbol: string): Promise<StockQuote> {
    if (!this.alphaVantageKey && !this.finnhubKey) {
      throw new Error('No stock API keys configured. Please add VITE_ALPHA_VANTAGE_API_KEY or VITE_FINNHUB_API_KEY to your .env file');
    }

    try {
      // Try Alpha Vantage first
      if (this.alphaVantageKey) {
        return await this.getAlphaVantageQuote(symbol);
      }
      
      // Fallback to Finnhub
      if (this.finnhubKey) {
        return await this.getFinnhubQuote(symbol);
      }

      throw new Error('No valid API keys available');
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw new Error(`Failed to fetch stock quote for ${symbol}. Please check your API keys and try again.`);
    }
  }

  // Get historical data for charts
  async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    if (!this.alphaVantageKey && !this.finnhubKey) {
      throw new Error('No stock API keys configured. Please add VITE_ALPHA_VANTAGE_API_KEY or VITE_FINNHUB_API_KEY to your .env file');
    }

    try {
      if (this.alphaVantageKey) {
        return await this.getAlphaVantageHistorical(symbol, days);
      }
      
      if (this.finnhubKey) {
        return await this.getFinnhubHistorical(symbol, days);
      }

      throw new Error('No valid API keys available');
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw new Error(`Failed to fetch historical data for ${symbol}. Please check your API keys and try again.`);
    }
  }

  // Get technical indicators
  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    if (!this.alphaVantageKey && !this.finnhubKey) {
      throw new Error('No stock API keys configured. Please add VITE_ALPHA_VANTAGE_API_KEY or VITE_FINNHUB_API_KEY to your .env file');
    }

    try {
      // Primary method: Calculate indicators from historical data (more reliable)
      return await this.calculateTechnicalIndicatorsFromHistoricalData(symbol);
    } catch (error) {
      console.error('Error calculating technical indicators:', error);
      throw new Error(`Failed to calculate technical indicators for ${symbol}. Please check your API keys and try again.`);
    }
  }

  // Alpha Vantage implementations
  private async getAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
    );

    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage API Error: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error('Alpha Vantage API rate limit exceeded. Please wait or upgrade your plan.');
    }

    const data = response.data['Global Quote'];
    if (!data) {
      throw new Error(`No data found for symbol ${symbol}`);
    }

    return {
      symbol: data['01. symbol'],
      price: parseFloat(data['05. price']),
      change: parseFloat(data['09. change']),
      changePercent: parseFloat(data['10. change percent'].replace('%', '')),
      volume: parseInt(data['06. volume']),
      high52Week: parseFloat(data['03. high']),
      low52Week: parseFloat(data['04. low'])
    };
  }

  private async getAlphaVantageHistorical(symbol: string, days: number): Promise<StockHistoricalData[]> {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.alphaVantageKey}`
    );

    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage API Error: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error('Alpha Vantage API rate limit exceeded. Please wait or upgrade your plan.');
    }

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error(`No historical data found for symbol ${symbol}`);
    }

    const dates = Object.keys(timeSeries).slice(0, days);
    
    return dates.map(date => ({
      date,
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    }));
  }

  // Finnhub implementations
  private async getFinnhubQuote(symbol: string): Promise<StockQuote> {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubKey}`
    );

    const data = response.data;
    if (!data || data.c === 0) {
      throw new Error(`No quote data found for symbol ${symbol}`);
    }

    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      high52Week: data.h,
      low52Week: data.l
    };
  }

  private async getFinnhubHistorical(symbol: string, days: number): Promise<StockHistoricalData[]> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);
    
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${this.finnhubKey}`
    );

    const data = response.data;
    if (data.s !== 'ok') {
      throw new Error(`Finnhub API Error: ${data.s}`);
    }

    if (!data.t || data.t.length === 0) {
      throw new Error(`No historical data found for symbol ${symbol}`);
    }

    return data.t.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index]
    })).reverse(); // Reverse to get most recent first
  }

  // Calculate technical indicators from historical data (reliable method)
  private async calculateTechnicalIndicatorsFromHistoricalData(symbol: string): Promise<TechnicalIndicators> {
    // Use existing historical data if we already have it, otherwise fetch new data
    let historicalData: StockHistoricalData[];
    
    try {
      historicalData = await this.getHistoricalData(symbol, 60); // Get 60 days for better calculations
    } catch (error) {
      console.error('Error fetching historical data for technical indicators:', error);
      throw new Error('Unable to fetch historical data needed for technical indicators');
    }
    
    if (historicalData.length < 20) {
      throw new Error(`Insufficient historical data for technical indicators calculation. Got ${historicalData.length} days, need at least 20.`);
    }

    const prices = historicalData.map(d => d.close);
    
    // Calculate technical indicators
    const rsi = this.calculateRSI(prices, Math.min(14, prices.length - 1));
    const sma20 = this.calculateSMA(prices, Math.min(20, prices.length));
    const sma50 = this.calculateSMA(prices, Math.min(50, prices.length));
    const macd = this.calculateMACD(prices);

    console.log(`✅ Calculated technical indicators for ${symbol}: RSI=${rsi.toFixed(1)}, SMA20=${sma20.toFixed(2)}, SMA50=${sma50.toFixed(2)}`);

    return {
      rsi,
      sma20,
      sma50,
      macd
    };
  }

  private calculateRSI(prices: number[], period: number): number {
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

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;
    
    const recentPrices = prices.slice(0, period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  private calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    if (prices.length < 26) {
      // Return neutral MACD for insufficient data
      return { line: 0, signal: 0, histogram: 0 };
    }
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    // Calculate signal line as EMA(9) of MACD line
    // For simplicity, using a basic approximation
    const signalLine = macdLine * 0.8; // Simplified signal line calculation
    const histogram = macdLine - signalLine;

    return {
      line: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[period - 1]; // Start with SMA
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
}

export const stockAPI = new StockAPIService(); 