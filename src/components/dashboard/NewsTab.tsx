import React, { useState, useEffect } from 'react';
import { Newspaper, RotateCcw, ExternalLink, Clock, TrendingUp, Coins, AlertCircle, Gamepad2, Star, Zap } from 'lucide-react';
import { newsAPI, type NewsArticle, type NewsType } from '../../services/newsAPI';
import { useIsMobile } from '../../hooks/use-Mobile';

// Crypto Pixel Art Component
interface CryptoPixelArtProps {
  index: number;
  isMobile: boolean;
}

const CryptoPixelArt: React.FC<CryptoPixelArtProps> = ({ index, isMobile }) => {
  const height = isMobile ? 'h-32' : 'h-40';
  
  const cryptoDesigns = [
    // Bitcoin Symbol
    <div className={`${height} w-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-1 p-2">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={`${[16, 17, 24, 25, 32, 33, 40, 41].includes(i) ? 'bg-white' : 'bg-transparent'}`}></div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white font-bold text-4xl">₿</div>
      </div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">BITCOIN</div>
    </div>,
    
    // Ethereum Symbol
    <div className={`${height} w-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-6 grid-rows-6 h-full w-full gap-1 p-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className={`${[14, 15, 20, 21].includes(i) ? 'bg-white' : 'bg-transparent'}`}></div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white font-bold text-4xl">⧫</div>
      </div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">ETHEREUM</div>
    </div>,
    
    // Generic Crypto Chart
    <div className={`${height} w-full bg-gradient-to-br from-green-500 to-teal-600 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 flex items-end justify-around p-4">
        {[60, 80, 45, 90, 75, 85, 95].map((height, i) => (
          <div key={i} className="bg-white/80 w-4" style={{ height: `${height}%` }}></div>
        ))}
      </div>
      <div className="absolute top-2 left-2 text-white text-xs font-bold opacity-80">CRYPTO CHART</div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">+24.5%</div>
    </div>
  ];
  
  return cryptoDesigns[index % cryptoDesigns.length];
};

// Stock Chart Pixel Art Component
interface StockChartPixelArtProps {
  index: number;
  isMobile: boolean;
}

const StockChartPixelArt: React.FC<StockChartPixelArtProps> = ({ index, isMobile }) => {
  const height = isMobile ? 'h-32' : 'h-40';
  
  const stockDesigns = [
    // Bullish Candlestick Chart
    <div className={`${height} w-full bg-gradient-to-br from-green-600 to-green-800 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 flex items-end justify-around p-4">
        {[
          { body: 20, wick: 25, color: 'bg-green-300' },
          { body: 30, wick: 35, color: 'bg-green-400' },
          { body: 25, wick: 30, color: 'bg-red-400' },
          { body: 40, wick: 45, color: 'bg-green-300' },
          { body: 45, wick: 50, color: 'bg-green-400' },
          { body: 35, wick: 40, color: 'bg-green-300' },
        ].map((candle, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-px bg-white/60" style={{ height: `${candle.wick}%` }}></div>
            <div className={`w-3 ${candle.color} border border-white/40`} style={{ height: `${candle.body}%` }}></div>
          </div>
        ))}
      </div>
      <div className="absolute top-2 left-2 text-white text-xs font-bold opacity-80">BULLISH TREND</div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">📈 +12.3%</div>
    </div>,
    
    // Line Chart with Trend
    <div className={`${height} w-full bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 p-4">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-white">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points="10,80 25,60 40,70 55,40 70,50 85,20"
          />
          {[10, 25, 40, 55, 70, 85].map((x, i) => (
            <circle key={i} cx={x} cy={[80, 60, 70, 40, 50, 20][i]} r="2" fill="white" />
          ))}
        </svg>
      </div>
      <div className="absolute top-2 left-2 text-white text-xs font-bold opacity-80">TREND ANALYSIS</div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">📊 +8.7%</div>
    </div>,
    
    // Volume Bars
    <div className={`${height} w-full bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 flex items-end justify-around p-4">
        {[30, 60, 45, 80, 35, 90, 70, 55].map((height, i) => (
          <div 
            key={i} 
            className={`w-3 ${i % 2 === 0 ? 'bg-green-400' : 'bg-red-400'} opacity-80`} 
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
      <div className="absolute top-2 left-2 text-white text-xs font-bold opacity-80">VOLUME ANALYSIS</div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">📊 VOL: 2.3M</div>
    </div>,
    
    // Moving Averages
    <div className={`${height} w-full bg-gradient-to-br from-teal-600 to-teal-800 border-2 border-[#007FFF]/20 relative overflow-hidden`} style={{ borderRadius: '0px' }}>
      <div className="absolute inset-0 p-4">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {/* MA 20 */}
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            points="10,70 25,65 40,60 55,55 70,50 85,45"
          />
          {/* MA 50 */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            points="10,75 25,70 40,68 55,65 70,62 85,58"
          />
        </svg>
      </div>
      <div className="absolute top-2 left-2 text-white text-xs font-bold opacity-80">MOVING AVG</div>
      <div className="absolute bottom-2 right-2 text-white text-xs font-bold opacity-80">📈 MA Cross</div>
    </div>
  ];
  
  return stockDesigns[index % stockDesigns.length];
};

export default function NewsTab() {
  const isMobile = useIsMobile();
  const [newsType, setNewsType] = useState<NewsType>('crypto');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<number | undefined>();
  const [stockSymbol, setStockSymbol] = useState('AAPL');

  // Load initial news on component mount
  useEffect(() => {
    loadNews(false);
  }, [newsType, stockSymbol]);

  // Load news data
  const loadNews = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError('');
    
    try {
      let newsData: NewsArticle[];
      
      if (newsType === 'crypto') {
        newsData = await newsAPI.getCryptoNews(forceRefresh);
      } else {
        newsData = await newsAPI.getStockNews(stockSymbol, forceRefresh);
      }
      
      setArticles(newsData);
      setLastUpdated(newsAPI.getLastFetched(newsType));
      
      console.log(`✅ Loaded ${newsData.length} ${newsType} news articles`);
    } catch (err) {
      console.error('❌ Error loading news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    loadNews(true);
  };

  // Handle news type change
  const handleNewsTypeChange = (type: NewsType) => {
    if (type !== newsType) {
      setNewsType(type);
      // Don't force refresh when switching, use cached data
    }
  };

  // Handle stock symbol change
  const handleStockSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setStockSymbol(value);
  };

  // Format datetime
  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format last updated time
  const formatLastUpdated = (): string => {
    if (!lastUpdated) return '';
    const diffMs = Date.now() - lastUpdated;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };

  return (
    <div className={`h-full ${isMobile ? 'max-w-full' : 'max-w-7xl mx-auto'}`}>
      {/* Retro Gaming Header */}
      <div className={`bg-white/60 border-4 border-[#007FFF] mb-6 ${
        isMobile ? 'p-4' : 'p-6'
      }`} style={{ borderRadius: '0px' }}>
        
        {/* Main Title with Gaming Elements */}
        <div className={`flex items-center justify-between mb-4 ${
          isMobile ? 'flex-col space-y-3' : ''
        }`}>
          <div className={`flex items-center ${
            isMobile ? 'space-x-3' : 'space-x-4'
          }`}>
            <div className="relative">
              <Newspaper className={`text-[#007FFF] ${
                isMobile ? 'w-8 h-8' : 'w-10 h-10'
              }`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className={`font-bold text-[#001F3F] tracking-wider ${
                isMobile ? 'text-2xl' : 'text-3xl'
              }`}>
                📰 NEWS TERMINAL
              </h2>
              <p className={`text-[#001F3F] opacity-70 font-mono ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                REAL-TIME FINANCIAL INTEL • POWERED BY FINNHUB API • NO CAP! 💯
              </p>
            </div>
          </div>

          {/* Gaming Stats Panel */}
          <div className={`flex items-center ${
            isMobile ? 'space-x-2 mt-2' : 'space-x-3'
          }`}>
            <div className={`bg-green-100 border-2 border-green-500 text-center ${
              isMobile ? 'p-2' : 'p-3'
            }`} style={{ borderRadius: '0px' }}>
              <div className={`flex items-center justify-center ${
                isMobile ? 'space-x-1' : 'space-x-2'
              }`}>
                <Gamepad2 className={`text-green-600 ${
                  isMobile ? 'w-4 h-4' : 'w-5 h-5'
                }`} />
                <span className={`font-bold text-green-800 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>LIVE</span>
              </div>
            </div>
            <div className={`bg-blue-100 border-2 border-blue-500 text-center ${
              isMobile ? 'p-2' : 'p-3'
            }`} style={{ borderRadius: '0px' }}>
              <div className={`flex items-center justify-center ${
                isMobile ? 'space-x-1' : 'space-x-2'
              }`}>
                <Star className={`text-blue-600 ${
                  isMobile ? 'w-4 h-4' : 'w-5 h-5'
                }`} />
                <span className={`font-bold text-blue-800 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>{articles.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gaming-Style Control Panel */}
        <div className={`bg-gradient-to-r from-[#007FFF]/10 to-[#001F3F]/10 border-2 border-[#007FFF]/30 ${
          isMobile ? 'p-3' : 'p-4'
        }`} style={{ borderRadius: '0px' }}>
          
          {/* Control Header */}
          <div className={`flex items-center justify-between mb-3 ${
            isMobile ? 'flex-col space-y-2' : ''
          }`}>
            <div className={`flex items-center ${
              isMobile ? 'space-x-2' : 'space-x-3'
            }`}>
              <Zap className={`text-[#007FFF] ${
                isMobile ? 'w-5 h-5' : 'w-6 h-6'
              }`} />
              <span className={`font-bold text-[#001F3F] tracking-wider ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                CONTROL PANEL
              </span>
            </div>

            {/* Last Updated with Gaming Style */}
            {lastUpdated && (
              <div className={`flex items-center bg-white/80 border border-[#007FFF] ${
                isMobile ? 'px-2 py-1' : 'px-3 py-1'
              }`} style={{ borderRadius: '0px' }}>
                <Clock className={`text-[#001F3F] opacity-50 ${
                  isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'
                }`} />
                <span className={`text-[#001F3F] opacity-70 font-mono font-bold ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  LAST SYNC: {formatLastUpdated()}
                </span>
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className={`flex items-center justify-between ${
            isMobile ? 'flex-col space-y-3' : ''
          }`}>
            
            {/* News Type Selector - Gaming Style */}
            <div className={`flex ${
              isMobile ? 'space-x-2 w-full' : 'space-x-3'
            }`}>
              <button
                onClick={() => handleNewsTypeChange('crypto')}
                className={`border-4 font-bold transition-all transform hover:scale-105 ${
                  newsType === 'crypto' 
                    ? 'bg-orange-500 text-white border-orange-600 shadow-lg' 
                    : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
                } ${isMobile ? 'px-3 py-2 text-sm flex-1' : 'px-4 py-2'}`}
                style={{ borderRadius: '0px' }}
              >
                <Coins className={`inline ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                CRYPTO MODE
              </button>
              <button
                onClick={() => handleNewsTypeChange('stock')}
                className={`border-4 font-bold transition-all transform hover:scale-105 ${
                  newsType === 'stock' 
                    ? 'bg-green-500 text-white border-green-600 shadow-lg' 
                    : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                } ${isMobile ? 'px-3 py-2 text-sm flex-1' : 'px-4 py-2'}`}
                style={{ borderRadius: '0px' }}
              >
                <TrendingUp className={`inline ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                STOCK MODE
              </button>
            </div>

            {/* Action Controls */}
            <div className={`flex items-center ${
              isMobile ? 'space-x-2 w-full justify-between' : 'space-x-3'
            }`}>
              
              {/* Stock Symbol Input (when stocks selected) */}
              {newsType === 'stock' && (
                <div className={`flex items-center ${
                  isMobile ? 'space-x-1' : 'space-x-2'
                }`}>
                  <label className={`font-bold text-[#001F3F] ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>TARGET:</label>
                  <input
                    type="text"
                    value={stockSymbol}
                    onChange={handleStockSymbolChange}
                    placeholder="SYMBOL"
                    className={`border-3 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono font-bold bg-white ${
                      isMobile ? 'w-20 p-2 text-sm' : 'w-24 p-2'
                    }`}
                    style={{ borderRadius: '0px' }}
                    maxLength={5}
                  />
                </div>
              )}

              {/* Power Reload Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`bg-gradient-to-r from-[#007FFF] to-[#005FBF] hover:from-[#005FBF] hover:to-[#004080] text-white border-3 border-[#001F3F] font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isMobile ? 'px-3 py-2' : 'px-4 py-2'
                }`}
                style={{ borderRadius: '0px' }}
                title="Reload news feed"
              >
                <RotateCcw className={`${
                  isMobile ? 'w-4 h-4' : 'w-5 h-5'
                } ${isLoading ? 'animate-spin' : ''} mr-2 inline`} />
                {isMobile ? 'SYNC' : 'POWER SYNC'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message - Gaming Style */}
      {error && (
        <div className={`bg-red-100 border-4 border-red-500 mb-6 ${
          isMobile ? 'p-3' : 'p-4'
        }`} style={{ borderRadius: '0px' }}>
          <div className={`flex items-center justify-center ${
            isMobile ? 'space-x-2' : 'space-x-3'
          }`}>
            <AlertCircle className={`text-red-600 ${
              isMobile ? 'w-5 h-5' : 'w-6 h-6'
            }`} />
            <p className={`text-red-700 font-bold ${
              isMobile ? 'text-sm' : 'text-lg'
            }`}>ERROR: {error}</p>
          </div>
          <div className="text-center mt-2">
            <button
              onClick={() => setError('')}
              className={`bg-red-500 hover:bg-red-600 text-white font-bold border-2 border-red-600 ${
                isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
              }`}
              style={{ borderRadius: '0px' }}
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Loading State - Gaming Style */}
      {isLoading && (
        <div className={`text-center ${
          isMobile ? 'py-8' : 'py-12'
        }`}>
          <div className={`inline-flex items-center bg-white/80 border-4 border-[#007FFF] ${
            isMobile ? 'p-4' : 'p-6'
          }`} style={{ borderRadius: '0px' }}>
            <RotateCcw className={`text-[#007FFF] animate-spin ${
              isMobile ? 'w-6 h-6 mr-3' : 'w-8 h-8 mr-4'
            }`} />
            <div>
              <span className={`text-[#001F3F] font-bold block ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                SCANNING {newsType.toUpperCase()} FEED...
              </span>
              <span className={`text-[#001F3F] opacity-70 font-mono ${
                isMobile ? 'text-sm' : ''
              }`}>
                Gathering latest intel from the financial markets 🎯
              </span>
            </div>
          </div>
        </div>
      )}

      {/* News Articles Grid - Gaming Style */}
      {!isLoading && articles.length > 0 && (
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {articles.slice(0, 12).map((article, index) => (
            <div
              key={article.id}
              className={`bg-white/80 border-4 border-[#007FFF]/40 hover:border-[#007FFF] hover:shadow-lg transition-all transform hover:scale-102 ${
                isMobile ? 'p-4' : 'p-5'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {/* Article Header */}
              <div className={`flex items-start justify-between mb-3 ${
                isMobile ? 'flex-col space-y-2' : ''
              }`}>
                <div className={`flex items-center ${
                  isMobile ? 'space-x-2' : 'space-x-3'
                }`}>
                  <div className={`bg-gradient-to-r ${
                    newsType === 'crypto' 
                      ? 'from-orange-400 to-orange-600' 
                      : 'from-green-400 to-green-600'
                  } text-white font-bold px-2 py-1 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`} style={{ borderRadius: '0px' }}>
                    #{String(index + 1).padStart(2, '0')}
                  </div>
                  <div className={`flex items-center text-xs text-[#001F3F] opacity-60 ${
                    isMobile ? 'space-x-1' : 'space-x-2'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(article.datetime)}</span>
                  </div>
                </div>
              </div>

                             {/* Custom Pixelated Graphics */}
               <div className={`mb-3 ${
                 isMobile ? 'w-full' : 'w-full'
               }`}>
                 {newsType === 'crypto' ? (
                   <CryptoPixelArt index={index} isMobile={isMobile} />
                 ) : (
                   <StockChartPixelArt index={index} isMobile={isMobile} />
                 )}
               </div>

              {/* Article Content */}
              <div>
                <h4 className={`font-bold text-[#001F3F] leading-tight mb-2 ${
                  isMobile ? 'text-sm' : 'text-base'
                }`}>
                  {article.headline}
                </h4>
                
                <p className={`text-[#001F3F] opacity-80 leading-relaxed mb-3 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  {article.summary.length > 120 
                    ? `${article.summary.substring(0, 120)}...` 
                    : article.summary
                  }
                </p>
                
                {/* Article Footer */}
                <div className={`flex items-center justify-between ${
                  isMobile ? 'flex-col space-y-2' : ''
                }`}>
                  <div className={`flex items-center ${
                    isMobile ? 'space-x-2 w-full justify-center' : 'space-x-3'
                  }`}>
                    <span className={`bg-blue-100 text-blue-800 font-bold px-2 py-1 border-2 border-blue-300 ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`} style={{ borderRadius: '0px' }}>
                      {article.source}
                    </span>
                    {article.related && (
                      <span className={`bg-green-100 text-green-800 font-bold px-2 py-1 border-2 border-green-300 ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`} style={{ borderRadius: '0px' }}>
                        {article.related}
                      </span>
                    )}
                  </div>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-gradient-to-r from-[#007FFF] to-[#005FBF] hover:from-[#005FBF] hover:to-[#004080] text-white font-bold transition-all transform hover:scale-105 border-2 border-[#001F3F] inline-flex items-center ${
                      isMobile ? 'px-3 py-2 text-xs w-full justify-center' : 'px-4 py-2 text-sm'
                    }`}
                    style={{ borderRadius: '0px' }}
                  >
                    READ INTEL
                    <ExternalLink className={`ml-2 ${
                      isMobile ? 'w-3 h-3' : 'w-4 h-4'
                    }`} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Articles State - Gaming Style */}
      {!isLoading && articles.length === 0 && (
        <div className={`text-center ${
          isMobile ? 'py-8' : 'py-12'
        }`}>
          <div className={`inline-block bg-white/80 border-4 border-[#007FFF] ${
            isMobile ? 'p-6' : 'p-8'
          }`} style={{ borderRadius: '0px' }}>
            <Newspaper className={`mx-auto text-[#001F3F] opacity-30 mb-4 ${
              isMobile ? 'w-12 h-12' : 'w-16 h-16'
            }`} />
            <h3 className={`text-[#001F3F] font-bold mb-2 ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}>
              NO INTEL AVAILABLE
            </h3>
            <p className={`text-[#001F3F] opacity-70 mb-4 ${
              isMobile ? 'text-sm' : ''
            }`}>
              The {newsType} news feed is currently empty.
            </p>
            <button
              onClick={handleRefresh}
              className={`bg-gradient-to-r from-[#007FFF] to-[#005FBF] hover:from-[#005FBF] hover:to-[#004080] text-white font-bold border-3 border-[#001F3F] transition-all transform hover:scale-105 ${
                isMobile ? 'px-4 py-3 text-sm' : 'px-6 py-3'
              }`}
              style={{ borderRadius: '0px' }}
            >
              RETRY SCAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 