import  { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData as LWCandlestickData, Time } from 'lightweight-charts';
import type { CandlestickData } from '../../services/stockAPI';
import type { PatternDetection } from '../../utils/candlestickPatterns';
import { PATTERN_CONFIGS, getPatternColor } from '../../utils/candlestickPatterns';
import { formatISTTime } from '../../utils/timezoneUtils';

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
  const [showPatterns, setShowPatterns] = useState<boolean>(true); // New state for pattern visibility

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

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: width || chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#001F3F',
      },
      grid: {
        vertLines: { color: '#e1e5e9' },
        horzLines: { color: '#e1e5e9' },
      },
      rightPriceScale: {
        borderColor: '#007FFF',
        textColor: '#001F3F',
      },
      timeScale: {
        borderColor: '#007FFF',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#007FFF',
          width: 1,
          style: 2,
          labelBackgroundColor: '#007FFF',
        },
        horzLine: {
          color: '#007FFF',
          width: 1,
          style: 2,
          labelBackgroundColor: '#007FFF',
        },
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Store references
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Convert and set data
    const lightweightData = convertToLightweightData(data);
    const volumeData = convertVolumeData(data);
    
    if (candlestickSeries && lightweightData.length > 0) {
      candlestickSeries.setData(lightweightData);
    }
    
    if (volumeSeries && volumeData.length > 0) {
      volumeSeries.setData(volumeData);
    }

    // Add pattern markers only if showPatterns is true
    if (patterns.length > 0 && candlestickSeries && showPatterns) {
      const markers = patterns.map(pattern => {
        const time = Math.floor(new Date(pattern.timestamp).getTime() / 1000) as Time;
        
        return {
          time,
          position: pattern.signal === 'BULLISH' ? 'belowBar' as const : 'aboveBar' as const,
          color: getPatternColor(pattern.signal, pattern.strength),
          shape: pattern.signal === 'BULLISH' ? 'arrowUp' as const : 'arrowDown' as const,
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
  }, [data, patterns, height, width, showPatterns]); // Added showPatterns dependency

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
          <div className="flex items-center space-x-3">
            {/* Pattern Toggle Control */}
            <div className="flex items-center space-x-2">
              <label className={`text-xs text-[#001F3F] opacity-70 font-medium ${isMobile ? 'hidden' : ''}`}>
                Patterns:
              </label>
              <button
                onClick={() => setShowPatterns(!showPatterns)}
                className={`px-2 py-1 text-xs font-bold border-2 transition-all duration-200 ${
                  showPatterns 
                    ? 'bg-[#007FFF] text-white border-[#007FFF]' 
                    : 'bg-white text-[#007FFF] border-[#007FFF] hover:bg-[#007FFF] hover:text-white'
                }`}
                style={{ borderRadius: '0px' }}
                title={`${showPatterns ? 'Hide' : 'Show'} pattern symbols`}
              >
                {showPatterns ? '🔍 ON' : '🔍 OFF'}
              </button>
            </div>
            <div className={`text-xs text-[#001F3F] opacity-70 ${isMobile ? 'text-xs' : ''}`}>
              {patterns.length} patterns detected
            </div>
          </div>
        </div>
        
        {/* Pattern indicators - only show if patterns are enabled */}
        {patterns.length > 0 && showPatterns && (
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
        
        {/* Pattern disabled message */}
        {patterns.length > 0 && !showPatterns && (
          <div className="mt-2 flex items-center space-x-2 text-xs">
            <span className="text-[#001F3F] opacity-50">📊 Pattern symbols hidden - {patterns.length} patterns detected but not displayed</span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="relative"
        style={{ height: `${height}px` }}
      />

      {/* Pattern Summary & Details - only show if patterns are enabled */}
      {showPatterns && (
        <>
          {/* Pattern Statistics */}
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
            <div className={`mt-4 bg-blue-50 border-2 border-[#007FFF] ${isMobile ? 'p-2' : 'p-3'}`} style={{ borderRadius: '0px' }}>
              <div className="flex items-center justify-between">
                <h4 className={`font-bold text-[#001F3F] ${isMobile ? 'text-sm' : 'text-base'}`}>
                  🔍 {PATTERN_CONFIGS[selectedPattern.pattern].name}
                </h4>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="text-[#001F3F] opacity-70 hover:opacity-100 text-xs"
                >
                  ✕ Close
                </button>
              </div>
              <div className={`mt-2 space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p className="text-[#001F3F]">
                  <strong>Signal:</strong> <span className={`font-bold ${
                    selectedPattern.signal === 'BULLISH' ? 'text-green-600' : 
                    selectedPattern.signal === 'BEARISH' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {selectedPattern.signal}
                  </span>
                </p>
                <p className="text-[#001F3F]">
                  <strong>Strength:</strong> <span className="font-bold">{selectedPattern.strength}</span>
                </p>
                <p className="text-[#001F3F]">
                  <strong>Confidence:</strong> <span className="font-bold">{selectedPattern.confidence}%</span>
                </p>
                <p className="text-[#001F3F]">
                  <strong>Time:</strong> <span className="font-bold">{formatISTTime(new Date(selectedPattern.timestamp))}</span>
                </p>
                <p className="text-[#001F3F] opacity-80">
                  <strong>Description:</strong> {selectedPattern.description}
                </p>
                <p className="text-[#001F3F] opacity-80">
                  <strong>Analysis:</strong> {PATTERN_CONFIGS[selectedPattern.pattern].explanation}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pattern Reference Table - always show but note if patterns are hidden */}
      <div className={`mt-4 bg-gray-50 border-2 border-gray-300 ${isMobile ? 'p-2' : 'p-3'}`} style={{ borderRadius: '0px' }}>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-bold text-[#001F3F] ${isMobile ? 'text-sm' : 'text-base'}`}>
            📚 Candlestick Pattern Reference
          </h4>
          {!showPatterns && (
            <span className="text-xs text-[#001F3F] opacity-50">(Symbols currently hidden)</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left text-[#001F3F] font-bold py-1">Pattern Name</th>
                <th className="text-left text-[#001F3F] font-bold py-1">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-[#001F3F] opacity-80">
              <tr className="border-b border-gray-200"><td className="py-1 font-medium">Doji</td><td className="py-1">Market indecision, possible reversal</td></tr>
              <tr className="border-b border-gray-200"><td className="py-1 font-medium">Spinning Top</td><td className="py-1">Weak momentum, possible reversal or consolidation</td></tr>
              <tr className="border-b border-gray-200"><td className="py-1 font-medium">Bearish Harami</td><td className="py-1">Bearish reversal signal</td></tr>
              <tr className="border-b border-gray-200"><td className="py-1 font-medium">Evening Star</td><td className="py-1">Strong bearish reversal</td></tr>
              <tr className="border-b border-gray-200"><td className="py-1 font-medium">Morning Star</td><td className="py-1">Strong bullish reversal</td></tr>
              <tr className="border-b border-gray-200"><td className="py-1 font-medium">Hammer</td><td className="py-1">Bullish reversal after downtrend</td></tr>
              <tr><td className="py-1 font-medium">Bullish Engulfing</td><td className="py-1">Strong bullish signal</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 