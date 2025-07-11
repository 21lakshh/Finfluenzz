import { useState, useCallback, useRef } from 'react';
import type { CandlestickData, DailyAdjustedData, ChartSummaryMetrics } from '../services/stockAPI';
import type { PatternDetection } from '../utils/candlestickPatterns';
import type { ChartViewMode } from '../types/chartTypes';

interface CachedChartData {
  symbol: string;
  candlestickData?: {
    data: CandlestickData[];
    patterns: PatternDetection[];
    lastFetched: Date;
  };
  lineData?: {
    data: DailyAdjustedData[];
    summary: ChartSummaryMetrics;
    lastFetched: Date;
  };
}

interface ChartDataCache {
  [symbol: string]: CachedChartData;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useChartDataCache() {
  const cacheRef = useRef<ChartDataCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cached data is still valid
  const isDataFresh = useCallback((lastFetched: Date): boolean => {
    return Date.now() - lastFetched.getTime() < CACHE_DURATION;
  }, []);

  // Get cached data for a symbol and mode
  const getCachedData = useCallback((symbol: string, mode: ChartViewMode) => {
    const cached = cacheRef.current[symbol];
    if (!cached) return null;

    if (mode === 'candlestick' && cached.candlestickData) {
      if (isDataFresh(cached.candlestickData.lastFetched)) {
        console.log(`✅ Using cached candlestick data for ${symbol}`);
        return {
          mode: 'candlestick' as const,
          data: cached.candlestickData.data,
          patterns: cached.candlestickData.patterns
        };
      }
    } else if (mode === 'line' && cached.lineData) {
      if (isDataFresh(cached.lineData.lastFetched)) {
        console.log(`✅ Using cached line data for ${symbol}`);
        return {
          mode: 'line' as const,
          data: cached.lineData.data,
          summary: cached.lineData.summary
        };
      }
    }

    return null;
  }, [isDataFresh]);

  // Cache candlestick data
  const cacheCandlestickData = useCallback((
    symbol: string, 
    data: CandlestickData[], 
    patterns: PatternDetection[]
  ) => {
    if (!cacheRef.current[symbol]) {
      cacheRef.current[symbol] = { symbol };
    }
    
    cacheRef.current[symbol].candlestickData = {
      data,
      patterns,
      lastFetched: new Date()
    };
    
    console.log(`💾 Cached candlestick data for ${symbol} (${data.length} candles, ${patterns.length} patterns)`);
  }, []);

  // Cache line chart data
  const cacheLineData = useCallback((
    symbol: string, 
    data: DailyAdjustedData[], 
    summary: ChartSummaryMetrics
  ) => {
    if (!cacheRef.current[symbol]) {
      cacheRef.current[symbol] = { symbol };
    }
    
    cacheRef.current[symbol].lineData = {
      data,
      summary,
      lastFetched: new Date()
    };
    
    console.log(`💾 Cached line data for ${symbol} (${data.length} days)`);
  }, []);

  // Clear cache for a specific symbol
  const clearCache = useCallback((symbol?: string) => {
    if (symbol) {
      delete cacheRef.current[symbol];
      console.log(`🗑️ Cleared cache for ${symbol}`);
    } else {
      cacheRef.current = {};
      console.log(`🗑️ Cleared all chart cache`);
    }
  }, []);

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    let clearedCount = 0;

    Object.keys(cacheRef.current).forEach(symbol => {
      const cached = cacheRef.current[symbol];
      let shouldDelete = true;

      // Check if any data is still fresh
      if (cached.candlestickData && isDataFresh(cached.candlestickData.lastFetched)) {
        shouldDelete = false;
      }
      if (cached.lineData && isDataFresh(cached.lineData.lastFetched)) {
        shouldDelete = false;
      }

      if (shouldDelete) {
        delete cacheRef.current[symbol];
        clearedCount++;
      }
    });

    if (clearedCount > 0) {
      console.log(`🗑️ Cleared ${clearedCount} expired cache entries`);
    }
  }, [isDataFresh]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const symbols = Object.keys(cacheRef.current);
    let candlestickEntries = 0;
    let lineEntries = 0;
    let totalDataPoints = 0;

    symbols.forEach(symbol => {
      const cached = cacheRef.current[symbol];
      if (cached.candlestickData) {
        candlestickEntries++;
        totalDataPoints += cached.candlestickData.data.length;
      }
      if (cached.lineData) {
        lineEntries++;
        totalDataPoints += cached.lineData.data.length;
      }
    });

    return {
      symbols: symbols.length,
      candlestickEntries,
      lineEntries,
      totalDataPoints
    };
  }, []);

  // Auto-cleanup expired entries periodically
  const startAutoCleanup = useCallback(() => {
    const interval = setInterval(clearExpiredCache, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [clearExpiredCache]);

  return {
    getCachedData,
    cacheCandlestickData,
    cacheLineData,
    clearCache,
    clearExpiredCache,
    getCacheStats,
    startAutoCleanup,
    isLoading,
    setIsLoading,
    error,
    setError
  };
} 