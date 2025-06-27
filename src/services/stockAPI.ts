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
  }

  // Get real-time stock quote
  async getStockQuote(symbol: string): Promise<StockQuote> {
    try {
      // Try Alpha Vantage first
      if (this.alphaVantageKey) {
        return await this.getAlphaVantageQuote(symbol);
      }
      
      // Fallback to Finnhub
      if (this.finnhubKey) {
        return await this.getFinnhubQuote(symbol);
      }

      // If no API keys, return mock data
      return this.getMockStockQuote(symbol);
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      return this.getMockStockQuote(symbol);
    }
  }

  // Get historical data for charts
  async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    try {
      if (this.alphaVantageKey) {
        return await this.getAlphaVantageHistorical(symbol, days);
      }
      
      if (this.finnhubKey) {
        return await this.getFinnhubHistorical(symbol, days);
      }

      return this.getMockHistoricalData(symbol, days);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return this.getMockHistoricalData(symbol, days);
    }
  }

  // Get technical indicators
  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    try {
      if (this.alphaVantageKey) {
        return await this.getAlphaVantageTechnicals(symbol);
      }
      
      return this.getMockTechnicalIndicators();
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      return this.getMockTechnicalIndicators();
    }
  }

  // Alpha Vantage implementations
  private async getAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
    );

    const data = response.data['Global Quote'];
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

    const timeSeries = response.data['Time Series (Daily)'];
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

  private async getAlphaVantageTechnicals(symbol: string): Promise<TechnicalIndicators> {
    // This would require multiple API calls to Alpha Vantage technical indicators
    // For now, return mock data
    return this.getMockTechnicalIndicators();
  }

  // Finnhub implementations
  private async getFinnhubQuote(symbol: string): Promise<StockQuote> {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubKey}`
    );

    const data = response.data;
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
      throw new Error('Invalid response from Finnhub');
    }

    return data.t.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index]
    }));
  }

  // Mock data for testing
  private getMockStockQuote(symbol: string): StockQuote {
    const mockPrices: Record<string, number> = {
      'AAPL': 175.43,
      'GOOGL': 142.56,
      'MSFT': 378.85,
      'TSLA': 248.50,
      'NVDA': 455.67,
      'AMZN': 151.94
    };

    const basePrice = mockPrices[symbol] || 100;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: basePrice + change,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 10000000),
      high52Week: basePrice * 1.3,
      low52Week: basePrice * 0.7
    };
  }

  private getMockHistoricalData(symbol: string, days: number): StockHistoricalData[] {
    const data: StockHistoricalData[] = [];
    let basePrice = 100;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * basePrice * volatility;
      basePrice += change;
      
      const dayRange = basePrice * 0.05;
      const open = basePrice + (Math.random() - 0.5) * dayRange;
      const close = basePrice + (Math.random() - 0.5) * dayRange;
      const high = Math.max(open, close) + Math.random() * dayRange * 0.5;
      const low = Math.min(open, close) - Math.random() * dayRange * 0.5;

      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 10000000)
      });
    }
    
    return data;
  }

  private getMockTechnicalIndicators(): TechnicalIndicators {
    return {
      rsi: 45 + Math.random() * 40, // RSI between 45-85
      sma20: 100 + Math.random() * 50,
      sma50: 95 + Math.random() * 60,
      macd: {
        line: Math.random() * 4 - 2,
        signal: Math.random() * 4 - 2,
        histogram: Math.random() * 2 - 1
      }
    };
  }
}

export const stockAPI = new StockAPIService(); 