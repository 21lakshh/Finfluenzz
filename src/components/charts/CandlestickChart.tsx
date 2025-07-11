import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData as LWCandlestickData, Time } from 'lightweight-charts';
import type { CandlestickData } from '../../services/stockAPI';
import type { PatternDetection } from '../../utils/candlestickPatterns';
import { PATTERN_CONFIGS, getPatternColor } from '../../utils/candlestickPatterns';
import { formatISTTime, getTimezoneInfo } from '../../utils/timezoneUtils';

interface CandlestickChartProps {
  data: CandlestickData[];
  patterns: PatternDetection[];
  symbol: string;
  height?: number;
  width?: number;
  onPatternClick?: (pattern: PatternDetection) => void;
  isMobile?: boolean;
}

export default function CandlestickChart({
  data,
  patterns,
  symbol,
  height = 400,
  width,
  onPatternClick,
  isMobile = false
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PatternDetection | null>(null);

  // Convert our data format to lightweight-charts format (USD to INR)
  const convertToLightweightData = (candleData: CandlestickData[]): LWCandlestickData[] => {
    return candleData.map(candle => ({
      time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as Time,
      open: candle.open * 85.79,
      high: candle.high * 85.79,
      low: candle.low * 85.79,
      close: candle.close * 85.79
    })).sort((a, b) => (a.time as number) - (b.time as number));
  };

  // Convert volume data
  const convertVolumeData = (candleData: CandlestickData[]) => {
    return candleData.map(candle => ({
      time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    })).sort((a, b) => (a.time as number) - (b.time as number));
  };

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create the chart
    const chart = createChart(chartContainerRef.current, {
      width: width || chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#001F3F'
      },
      grid: {
        vertLines: { color: 'rgba(0, 127, 255, 0.2)' },
        horzLines: { color: 'rgba(0, 127, 255, 0.2)' }
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#007FFF',
          width: 1,
          style: 2
        },
        horzLine: {
          color: '#007FFF',
          width: 1,
          style: 2
        }
      },
      rightPriceScale: {
        borderColor: '#007FFF',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#007FFF',
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartRef.current = chart;

    // Add candlestick series with proper API
    let candlestickSeries: any = null;
    let volumeSeries: any = null;
    
    try {
      candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e'
      });

      candlestickSeriesRef.current = candlestickSeries;

      // Add volume series with proper API  
      volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceScaleId: 'volume'
      });

      volumeSeriesRef.current = volumeSeries;
    } catch (error) {
      console.error('Error creating chart series:', error);
      return;
    }

    // Set the data
    const lightweightData = convertToLightweightData(data);
    const volumeData = convertVolumeData(data);
    
    if (candlestickSeries && lightweightData.length > 0) {
      candlestickSeries.setData(lightweightData);
    }
    
    if (volumeSeries && volumeData.length > 0) {
      volumeSeries.setData(volumeData);
    }

    // Add pattern markers
    if (patterns.length > 0 && candlestickSeries) {
      const markers = patterns.map(pattern => {
        const time = Math.floor(new Date(pattern.timestamp).getTime() / 1000) as Time;
        
        return {
          time,
          position: pattern.signal === 'BULLISH' ? 'belowBar' : 'aboveBar',
          color: getPatternColor(pattern.signal, pattern.strength),
          shape: pattern.signal === 'BULLISH' ? 'arrowUp' : 'arrowDown',
          text: PATTERN_CONFIGS[pattern.pattern].name.substring(0, 8), // Shorter text for markers
          size: pattern.strength === 'STRONG' ? 2 : pattern.strength === 'MODERATE' ? 1 : 0.8
        };
      });

      try {
        candlestickSeries.setMarkers(markers);
      } catch (error) {
        console.warn('Could not set pattern markers:', error);
      }
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: width || chartContainerRef.current.clientWidth,
          height: height
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [data, patterns, height, width]);

  return (
    <div className="bg-white border-4 border-[#007FFF]" style={{ borderRadius: '0px' }}>
      {/* Chart Header */}
      <div className={`border-b-4 border-[#007FFF] bg-white/60 ${isMobile ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-[#001F3F] tracking-wider ${isMobile ? 'text-sm' : 'text-lg'}`}>
              📊 {symbol} CANDLESTICK CHART
            </h3>
            <div className={`text-xs text-[#001F3F] opacity-70 ${isMobile ? 'text-xs' : ''}`}>
              🇮🇳 Times in IST • Prices in ₹ INR
            </div>
          </div>
          <div className={`text-xs text-[#001F3F] opacity-70 ${isMobile ? 'hidden' : ''}`}>
            {patterns.length} patterns detected
          </div>
        </div>
        
        {/* Pattern indicators */}
        {patterns.length > 0 && (
          <div className="mt-2 flex items-center space-x-2 text-xs flex-wrap">
            <span className="text-[#001F3F] opacity-70">Latest patterns:</span>
            {patterns.slice(0, isMobile ? 2 : 4).map((pattern, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedPattern(pattern);
                  onPatternClick?.(pattern);
                }}
                className="px-2 py-1 text-white font-bold hover:opacity-80 transition-opacity text-xs"
                style={{ 
                  backgroundColor: getPatternColor(pattern.signal, pattern.strength),
                  borderRadius: '0px' 
                }}
              >
                {PATTERN_CONFIGS[pattern.pattern].name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className={`${isMobile ? 'p-2' : 'p-4'}`}>
        <div 
          ref={chartContainerRef} 
          style={{ 
            width: '100%', 
            height: `${height}px`,
            background: '#ffffff'
          }} 
        />
        
        {/* Chart Legend */}
        <div className={`mt-2 flex items-center justify-between text-xs text-[#001F3F] opacity-70 ${isMobile ? 'flex-col space-y-1' : ''}`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#22c55e]"></div>
              <span>Bullish Candles</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#ef4444]"></div>
              <span>Bearish Candles</span>
            </div>
          </div>
          <div>
            Mouse wheel: zoom • Drag: pan • Double-click: fit content
          </div>
        </div>

        {/* Pattern Summary Cards */}
        {patterns.length > 0 && (
          <div className={`mt-4 grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <div className={`bg-green-50 border-2 border-green-500 text-center ${isMobile ? 'p-1' : 'p-2'}`} style={{ borderRadius: '0px' }}>
              <p className="text-xs text-green-700 font-bold">BULLISH</p>
              <p className={`font-bold text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {patterns.filter(p => p.signal === 'BULLISH').length}
              </p>
            </div>
            <div className={`bg-red-50 border-2 border-red-500 text-center ${isMobile ? 'p-1' : 'p-2'}`} style={{ borderRadius: '0px' }}>
              <p className="text-xs text-red-700 font-bold">BEARISH</p>
              <p className={`font-bold text-red-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {patterns.filter(p => p.signal === 'BEARISH').length}
              </p>
            </div>
            <div className={`bg-yellow-50 border-2 border-yellow-500 text-center ${isMobile ? 'p-1' : 'p-2'}`} style={{ borderRadius: '0px' }}>
              <p className="text-xs text-yellow-700 font-bold">STRONG</p>
              <p className={`font-bold text-yellow-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {patterns.filter(p => p.strength === 'STRONG').length}
              </p>
            </div>
            <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${isMobile ? 'p-1' : 'p-2'}`} style={{ borderRadius: '0px' }}>
              <p className="text-xs text-[#001F3F] opacity-70 font-bold">TOTAL</p>
              <p className={`font-bold text-[#001F3F] ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {patterns.length}
              </p>
            </div>
          </div>
        )}

        {/* Selected Pattern Details */}
        {selectedPattern && (
          <div className="mt-4 p-3 border-2 border-[#007FFF] bg-blue-50" style={{ borderRadius: '0px' }}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-[#001F3F]">
                {PATTERN_CONFIGS[selectedPattern.pattern].name}
              </h5>
              <button
                onClick={() => setSelectedPattern(null)}
                className="text-[#001F3F] opacity-70 hover:opacity-100 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#001F3F] mb-2">
              {PATTERN_CONFIGS[selectedPattern.pattern].description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-[#001F3F] opacity-70">
              <span>Signal: <strong className={selectedPattern.signal === 'BULLISH' ? 'text-green-600' : 'text-red-600'}>{selectedPattern.signal}</strong></span>
              <span>Strength: <strong>{selectedPattern.strength}</strong></span>
              <span>Confidence: <strong>{selectedPattern.confidence}%</strong></span>
              <span>Time: <strong>{formatISTTime(new Date(selectedPattern.timestamp))} IST</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 