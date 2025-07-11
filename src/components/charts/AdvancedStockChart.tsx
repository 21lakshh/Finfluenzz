import  { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  Clock,
  Calendar,
  Loader,
  Zap
} from 'lucide-react';
import { stockAPI } from '../../services/stockAPI';
import { detectCandlestickPatterns } from '../../utils/candlestickPatterns';
import { processNewPatterns } from '../../utils/patternAlerts';
import { useIsMobile } from '../../hooks/use-Mobile';
import { useChartDataCache } from '../../hooks/useChartDataCache';
import CandlestickChart from './CandlestickChart';
import ProfessionalStockChart from './ProfessionalStockChart';
import type { 
  AdvancedChartProps, 
  ChartViewMode
} from '../../types/chartTypes';
import type { CandlestickData, DailyAdjustedData, AssetHistoricalData } from '../../services/stockAPI';
import type { PatternDetection } from '../../utils/candlestickPatterns';
import { formatISTTime } from '../../utils/timezoneUtils';

export default function AdvancedStockChart({
  symbol,
  initialViewMode = 'line',
  onViewModeChange,
  onPatternClick,
  className = '',
  isMobile: propIsMobile
}: AdvancedChartProps) {
  const isMobile = useIsMobile() || propIsMobile;
  
  // Chart state
  const [viewMode, setViewMode] = useState<ChartViewMode>(initialViewMode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Chart data state
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [lineData, setLineData] = useState<AssetHistoricalData[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<any>(null);
  
  // Cache hook
  const {
    getCachedData,
    cacheCandlestickData,
    cacheLineData,
    isLoading,
    setIsLoading,
    error,
    setError,
    startAutoCleanup
  } = useChartDataCache();

  // Convert DailyAdjustedData to AssetHistoricalData format for ProfessionalStockChart
  const convertDailyToHistorical = useCallback((data: DailyAdjustedData[]): AssetHistoricalData[] => {
    return data.map(day => ({
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.adjustedClose, // Use adjusted close
      volume: day.volume
    }));
  }, []);

  // Fetch chart data based on view mode
  const fetchChartData = useCallback(async (mode: ChartViewMode, forceRefresh = false) => {
    console.log(`🔄 Fetching ${mode} data for ${symbol}`);
    setError(null);
    
    // Try to get cached data first (unless force refreshing)
    if (!forceRefresh) {
      const cached = getCachedData(symbol, mode);
      if (cached) {
        if (cached.mode === 'candlestick') {
          setCandlestickData(cached.data);
          setPatterns(cached.patterns);
          return;
        } else if (cached.mode === 'line') {
          const historicalData = convertDailyToHistorical(cached.data);
          setLineData(historicalData);
          setSummaryMetrics(cached.summary);
          return;
        }
      }
    }
    
    setIsLoading(true);
    
    try {
      if (mode === 'candlestick') {
        console.log(`📊 Fetching candlestick data for ${symbol}`);
        
        let candlestickDataPoints: any[] = [];
        
        try {
          // Try to fetch intraday candlestick data first
          const intradayData = await stockAPI.getIntradayData(symbol);
          console.log(`✅ Got ${intradayData.length} intraday candlestick data points for ${symbol}`);
          candlestickDataPoints = intradayData;
        } catch (intradayError) {
          console.warn(`⚠️ Intraday data not available for ${symbol}, falling back to daily data`);
          
          try {
            // Fallback to daily data for candlestick visualization
            const dailyData = await stockAPI.getDailyAdjustedData(symbol, 50);
            console.log(`✅ Got ${dailyData.length} daily data points for ${symbol} (fallback)`);
            
            // Convert daily data to candlestick format
            candlestickDataPoints = dailyData.map(day => ({
              timestamp: day.date,
              datetime: new Date(day.date),
              open: day.open,
              high: day.high,
              low: day.low,
              close: day.close,
              volume: day.volume
            }));
          } catch (dailyError) {
            throw new Error(`Unable to fetch data: ${dailyError instanceof Error ? dailyError.message : 'Unknown error'}`);
          }
        }
        
        const detectedPatterns = detectCandlestickPatterns(candlestickDataPoints);
        console.log(`🔍 Detected ${detectedPatterns.length} patterns for ${symbol}`);
        
        // Process patterns for alerts (only for stocks)
        if (stockAPI.getAssetType(symbol) === 'stock') {
          processNewPatterns(detectedPatterns, symbol);
        }
        
        // Cache the data
        cacheCandlestickData(symbol, candlestickDataPoints, detectedPatterns);
        
        // Set state
        setCandlestickData(candlestickDataPoints);
        setPatterns(detectedPatterns);
        
      } else {
        console.log(`📈 Fetching daily data for ${symbol}`);
        // Fetch 50-day line chart data (consistent with technical indicators)
        const dailyData = await stockAPI.getDailyAdjustedData(symbol, 50);
        console.log(`✅ Got ${dailyData.length} daily data points for ${symbol}`);
        
        const summary = stockAPI.calculateSummaryMetrics(dailyData);
        console.log(`📊 Summary metrics for ${symbol}:`, summary);
        
        // Convert to historical format for ProfessionalStockChart
        const historicalData = convertDailyToHistorical(dailyData);
        
        // Cache the data
        cacheLineData(symbol, dailyData, summary);
        
        // Set state
        setLineData(historicalData);
        setSummaryMetrics(summary);
      }
    } catch (error) {
      console.error(`❌ Error fetching chart data for ${symbol}:`, error);
      setError(error instanceof Error ? error.message : 'Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, getCachedData, cacheCandlestickData, cacheLineData, convertDailyToHistorical, setIsLoading, setError]);

  // Handle view mode change
  const handleViewModeChange = useCallback((newMode: ChartViewMode) => {
    console.log(`🔄 Switching to ${newMode} mode for ${symbol}`);
    setViewMode(newMode);
    onViewModeChange?.(newMode);
    fetchChartData(newMode);
  }, [fetchChartData, onViewModeChange, symbol]);

  // Refresh chart data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchChartData(viewMode, true); // Force refresh
    setTimeout(() => setIsRefreshing(false), 500);
  }, [fetchChartData, viewMode]);

  // Initial data fetch and cleanup
  useEffect(() => {
    fetchChartData(viewMode);
    
    // Start auto-cleanup for expired cache
    const cleanup = startAutoCleanup();
    
    return cleanup;
  }, [symbol]); // Only re-fetch when symbol changes

  // Pattern click handler
  const handlePatternClick = useCallback((pattern: PatternDetection) => {
    console.log('Pattern clicked:', pattern);
    onPatternClick?.(pattern);
  }, [onPatternClick]);

  return (
    <div className={`bg-white border-4 border-[#007FFF] ${className}`} style={{ borderRadius: '0px' }}>
      {/* Chart Header with Toggle */}
      <div className={`border-b-4 border-[#007FFF] bg-white/60 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center justify-between ${isMobile ? 'flex-col space-y-2' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`text-[#007FFF] ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              <h3 className={`font-bold text-[#001F3F] tracking-wider ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {symbol} ADVANCED CHART
              </h3>
            </div>
            
            {(candlestickData.length > 0 || lineData.length > 0) && (
              <div className={`text-xs text-[#001F3F] opacity-70 ${isMobile ? 'hidden' : ''}`}>
                Last updated: {formatISTTime(new Date())} IST
              </div>
            )}
          </div>

          {/* Chart Controls */}
          <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2' : 'space-x-4'}`}>
            {/* View Mode Toggle */}
            <div className="flex border-2 border-[#007FFF]" style={{ borderRadius: '0px' }}>
              <button
                onClick={() => handleViewModeChange('candlestick')}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  viewMode === 'candlestick'
                    ? 'bg-[#007FFF] text-white'
                    : 'bg-white text-[#007FFF] hover:bg-[#007FFF] hover:text-white'
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-3 h-3" />
                  <span>REAL-TIME</span>
                </div>
              </button>
              <button
                onClick={() => handleViewModeChange('line')}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  viewMode === 'line'
                    ? 'bg-[#007FFF] text-white'
                    : 'bg-white text-[#007FFF] hover:bg-[#007FFF] hover:text-white'
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>50 DAYS</span>
                </div>
              </button>
            </div>

            {/* Pattern toggle for candlestick mode */}
            {viewMode === 'candlestick' && (
              <div className="flex items-center space-x-2">
                <div className="px-2 py-1 text-xs border-2 border-[#007FFF] bg-blue-50 text-[#001F3F] font-bold">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {patterns.length} PATTERNS
                </div>
              </div>
            )}

            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="p-1 border-2 border-[#007FFF] bg-white text-[#007FFF] hover:bg-[#007FFF] hover:text-white transition-colors disabled:opacity-50"
              style={{ borderRadius: '0px' }}
              title="Refresh Data"
            >
              <Clock className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Current Mode Info */}
        <div className="mt-2 flex items-center space-x-4 text-xs text-[#001F3F] opacity-70">
          <span className="font-bold">
            MODE: {viewMode === 'candlestick' ? 'REAL-TIME CANDLESTICKS' : '50-DAY TREND LINE'}
          </span>
          {viewMode === 'candlestick' && patterns.length > 0 && (
            <span>• {patterns.length} PATTERNS DETECTED</span>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className={`${isMobile ? 'p-2' : 'p-4'}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-[#007FFF] mx-auto mb-2" />
              <p className="text-[#001F3F] font-mono">
                Loading {viewMode === 'candlestick' ? 'real-time' : '50-day'} data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-mono">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-[#007FFF] text-white font-bold border-2 border-[#001F3F] hover:bg-[#001F3F] transition-colors"
                style={{ borderRadius: '0px' }}
              >
                RETRY
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Render appropriate chart based on mode */}
            {viewMode === 'candlestick' && candlestickData.length > 0 ? (
              <CandlestickChart
                data={candlestickData}
                patterns={patterns}
                symbol={symbol}
                height={isMobile ? 300 : 400}
                onPatternClick={handlePatternClick}
                isMobile={isMobile}
              />
            ) : viewMode === 'line' && lineData.length > 0 ? (
              <div>
                <ProfessionalStockChart 
                  data={lineData} 
                  symbol={symbol}
                  height={isMobile ? 250 : 350}
                  showVolume={!isMobile}
                />
                
                {/* Summary Metrics for Line Chart */}
                {summaryMetrics && (
                  <div className={`grid gap-2 mt-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                    <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                      <p className="text-xs text-[#001F3F] opacity-70 font-bold">HIGH</p>
                      <p className="font-bold text-[#001F3F]">₹{(summaryMetrics.high * 85.79).toFixed(0)}</p>
                    </div>
                    <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                      <p className="text-xs text-[#001F3F] opacity-70 font-bold">LOW</p>
                      <p className="font-bold text-[#001F3F]">₹{(summaryMetrics.low * 85.79).toFixed(0)}</p>
                    </div>
                    <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                      <p className="text-xs text-[#001F3F] opacity-70 font-bold">AVG VOLUME</p>
                      <p className="font-bold text-[#001F3F]">{(summaryMetrics.avgVolume / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                      <p className="text-xs text-[#001F3F] opacity-70 font-bold">RANGE</p>
                      <p className="font-bold text-[#001F3F]">{summaryMetrics.rangePercent.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-[#001F3F] opacity-70 font-mono">No chart data available</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 