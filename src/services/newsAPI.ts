import axios from 'axios';

/**
 * News API Service - Using Finnhub.io API for real-time financial news
 * Supports both stock and crypto news with caching mechanism
 */

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  image?: string;
  datetime: number; // Unix timestamp
  source: string;
  category?: string;
  related?: string; // For stock-specific news
}

export interface NewsCache {
  cryptoNews: NewsArticle[];
  stockNews: NewsArticle[];
  lastFetchedCrypto?: number;
  lastFetchedStock?: number;
}

export type NewsType = 'crypto' | 'stock';

class NewsAPIService {
  private finnhubKey: string;
  private cache: NewsCache = {
    cryptoNews: [],
    stockNews: []
  };
  
  // Cache expiry time (5 minutes)
  private readonly CACHE_EXPIRY = 5 * 60 * 1000;

  constructor() {
    // Use Finnhub API key from environment variables
    this.finnhubKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    
    if (!this.finnhubKey) {
      console.error('❌ Finnhub API key not found! Please add VITE_FINNHUB_API_KEY to your .env file');
      console.log('💡 You can get a free API key from: https://finnhub.io/register');
    } else {
      console.log('✅ Finnhub News API initialized successfully');
    }
  }

  // Check if cached data is still valid
  private isCacheValid(lastFetched?: number): boolean {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < this.CACHE_EXPIRY;
  }

  // Get crypto news from Finnhub
  async getCryptoNews(forceRefresh: boolean = false): Promise<NewsArticle[]> {
    console.log('🔍 Fetching crypto news from Finnhub');
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid(this.cache.lastFetchedCrypto)) {
      console.log('📰 Using cached crypto news');
      return this.cache.cryptoNews;
    }

    if (!this.finnhubKey) {
      console.warn('⚠️ No Finnhub API key, using mock crypto news');
      return this.getMockCryptoNews();
    }

    try {
      const response = await axios.get(`https://finnhub.io/api/v1/news`, {
        params: {
          category: 'crypto',
          token: this.finnhubKey
        },
        timeout: 10000
      });

      const articles: NewsArticle[] = response.data.map((article: any, index: number) => ({
        id: `crypto-${article.id || index}`,
        headline: article.headline,
        summary: article.summary || article.headline,
        url: article.url,
        image: article.image,
        datetime: article.datetime * 1000, // Convert to milliseconds
        source: article.source,
        category: 'crypto',
        related: article.related
      }));

      // Update cache
      this.cache.cryptoNews = articles;
      this.cache.lastFetchedCrypto = Date.now();

      console.log(`✅ Fetched ${articles.length} crypto news articles`);
      return articles;

    } catch (error) {
      console.error('❌ Error fetching crypto news:', error);
      
      // Return cached data if available, otherwise mock data
      if (this.cache.cryptoNews.length > 0) {
        console.warn('⚠️ Using cached crypto news due to API error');
        return this.cache.cryptoNews;
      }
      
      console.warn('⚠️ Using mock crypto news due to API error');
      return this.getMockCryptoNews();
    }
  }

  // Get stock news from Finnhub (company-specific)
  async getStockNews(symbol: string = 'AAPL', forceRefresh: boolean = false): Promise<NewsArticle[]> {
    console.log(`🔍 Fetching stock news for ${symbol} from Finnhub`);
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid(this.cache.lastFetchedStock)) {
      console.log('📰 Using cached stock news');
      return this.cache.stockNews;
    }

    if (!this.finnhubKey) {
      console.warn('⚠️ No Finnhub API key, using mock stock news');
      return this.getMockStockNews(symbol);
    }

    try {
      // Get date range for past 7 days
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);

      const response = await axios.get(`https://finnhub.io/api/v1/company-news`, {
        params: {
          symbol: symbol.toUpperCase(),
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0],
          token: this.finnhubKey
        },
        timeout: 10000
      });

      const articles: NewsArticle[] = response.data.map((article: any, index: number) => ({
        id: `stock-${article.id || index}`,
        headline: article.headline,
        summary: article.summary || article.headline,
        url: article.url,
        image: article.image,
        datetime: article.datetime * 1000, // Convert to milliseconds
        source: article.source,
        category: 'stock',
        related: symbol.toUpperCase()
      }));

      // Update cache
      this.cache.stockNews = articles;
      this.cache.lastFetchedStock = Date.now();

      console.log(`✅ Fetched ${articles.length} stock news articles for ${symbol}`);
      return articles;

    } catch (error) {
      console.error(`❌ Error fetching stock news for ${symbol}:`, error);
      
      // Return cached data if available, otherwise mock data
      if (this.cache.stockNews.length > 0) {
        console.warn('⚠️ Using cached stock news due to API error');
        return this.cache.stockNews;
      }
      
      console.warn(`⚠️ Using mock stock news for ${symbol} due to API error`);
      return this.getMockStockNews(symbol);
    }
  }

  // Get cached news data
  getCachedNews(type: NewsType): NewsArticle[] {
    return type === 'crypto' ? this.cache.cryptoNews : this.cache.stockNews;
  }

  // Get last fetched timestamp
  getLastFetched(type: NewsType): number | undefined {
    return type === 'crypto' ? this.cache.lastFetchedCrypto : this.cache.lastFetchedStock;
  }

  // Clear cache
  clearCache(type?: NewsType): void {
    if (type === 'crypto' || !type) {
      this.cache.cryptoNews = [];
      this.cache.lastFetchedCrypto = undefined;
    }
    if (type === 'stock' || !type) {
      this.cache.stockNews = [];
      this.cache.lastFetchedStock = undefined;
    }
    console.log(`🗑️ Cleared ${type || 'all'} news cache`);
  }

  // Mock crypto news for fallback
  private getMockCryptoNews(): NewsArticle[] {
    return [
      {
        id: 'mock-crypto-1',
        headline: '🚀 Bitcoin Hits New Monthly High Amid Institutional Interest',
        summary: 'Bitcoin surged to new monthly highs as major institutions continue to show interest in cryptocurrency investments, with several Fortune 500 companies announcing strategic Bitcoin purchases.',
        url: 'https://example.com/crypto-news-1',
        image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300',
        datetime: Date.now() - 3600000, // 1 hour ago
        source: 'CryptoDaily',
        category: 'crypto'
      },
      {
        id: 'mock-crypto-2',
        headline: '⚡ Ethereum 2.0 Staking Reaches All-Time High',
        summary: 'Ethereum 2.0 staking has reached unprecedented levels with over 15 million ETH now staked, representing nearly 13% of total supply and indicating strong network confidence.',
        url: 'https://example.com/crypto-news-2',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300',
        datetime: Date.now() - 7200000, // 2 hours ago
        source: 'EthereumNews',
        category: 'crypto'
      },
      {
        id: 'mock-crypto-3',
        headline: '🔥 DeFi Protocol Launches Revolutionary Yield Farming',
        summary: 'A new DeFi protocol has launched with innovative yield farming mechanisms, offering sustainable returns while maintaining security and decentralization principles.',
        url: 'https://example.com/crypto-news-3',
        image: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=300',
        datetime: Date.now() - 10800000, // 3 hours ago
        source: 'DeFiPulse',
        category: 'crypto'
      }
    ];
  }

  // Mock stock news for fallback
  private getMockStockNews(symbol: string): NewsArticle[] {
    return [
      {
        id: 'mock-stock-1',
        headline: `📈 ${symbol} Reports Strong Q4 Earnings Beat Expectations`,
        summary: `${symbol} delivered impressive Q4 results, beating analyst expectations on both revenue and earnings per share, driven by strong demand and operational efficiency improvements.`,
        url: 'https://example.com/stock-news-1',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300',
        datetime: Date.now() - 1800000, // 30 minutes ago
        source: 'Financial Times',
        category: 'stock',
        related: symbol
      },
      {
        id: 'mock-stock-2',
        headline: `🎯 Analysts Upgrade ${symbol} Price Target Following Innovation Announcement`,
        summary: `Major investment firms have upgraded their price targets for ${symbol} following the company's announcement of breakthrough innovations and strategic partnerships.`,
        url: 'https://example.com/stock-news-2',
        image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300',
        datetime: Date.now() - 5400000, // 1.5 hours ago
        source: 'MarketWatch',
        category: 'stock',
        related: symbol
      },
      {
        id: 'mock-stock-3',
        headline: `🌟 ${symbol} Announces Strategic Acquisition to Expand Market Reach`,
        summary: `${symbol} has announced a strategic acquisition that will significantly expand its market presence and capabilities, positioning the company for accelerated growth.`,
        url: 'https://example.com/stock-news-3',
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=300',
        datetime: Date.now() - 9000000, // 2.5 hours ago
        source: 'Bloomberg',
        category: 'stock',
        related: symbol
      }
    ];
  }

  // Get API status and usage info
  async getAPIStatus(): Promise<{ isAvailable: boolean; hasKey: boolean; cacheStatus: any }> {
    return {
      isAvailable: !!this.finnhubKey,
      hasKey: !!this.finnhubKey,
      cacheStatus: {
        cryptoNews: this.cache.cryptoNews.length,
        stockNews: this.cache.stockNews.length,
        lastFetchedCrypto: this.cache.lastFetchedCrypto ? new Date(this.cache.lastFetchedCrypto).toISOString() : null,
        lastFetchedStock: this.cache.lastFetchedStock ? new Date(this.cache.lastFetchedStock).toISOString() : null
      }
    };
  }
}

// Export singleton instance
export const newsAPI = new NewsAPIService(); 