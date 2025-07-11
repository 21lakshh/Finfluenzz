import type { 
  CandlestickData, 
  DailyAdjustedData, 
  ChartSummaryMetrics 
} from '../services/stockAPI';
import type { PatternDetection } from '../utils/candlestickPatterns';

// Chart View Types
export type ChartViewMode = 'candlestick' | 'line';
export type ChartTimeframe = 'intraday' | 'daily' | '50days';

// Chart Theme Configuration
export interface ChartTheme {
  background: string;
  gridColor: string;
  textColor: string;
  bullishColor: string;
  bearishColor: string;
  lineColor: string;
  volumeColor: string;
  patternColors: {
    bullish: string;
    bearish: string;
    neutral: string;
  };
}

// Default retro gaming theme matching the app
export const DEFAULT_CHART_THEME: ChartTheme = {
  background: '#ffffff',
  gridColor: '#007FFF',
  textColor: '#001F3F',
  bullishColor: '#22c55e',
  bearishColor: '#ef4444',
  lineColor: '#007FFF',
  volumeColor: '#001F3F',
  patternColors: {
    bullish: '#22c55e',
    bearish: '#ef4444',
    neutral: '#6b7280'
  }
};

// Chart Data Interfaces
export interface CandlestickChartData {
  mode: 'candlestick';
  timeframe: 'intraday';
  data: CandlestickData[];
  patterns: PatternDetection[];
  symbol: string;
  lastUpdated: Date;
}

export interface LineChartData {
  mode: 'line';
  timeframe: '50days';
  data: DailyAdjustedData[];
  summary: ChartSummaryMetrics;
  symbol: string;
  lastUpdated: Date;
}

export type ChartData = CandlestickChartData | LineChartData;

// Chart Configuration
export interface ChartConfig {
  height: number;
  width?: number;
  showVolume: boolean;
  showPatterns: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  showTooltips: boolean;
  theme: ChartTheme;
  responsive: boolean;
}

// Default chart configuration
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  height: 400,
  showVolume: true,
  showPatterns: true,
  showGrid: true,
  showCrosshair: true,
  showTooltips: true,
  theme: DEFAULT_CHART_THEME,
  responsive: true
};

// Chart State Management
export interface ChartState {
  viewMode: ChartViewMode;
  timeframe: ChartTimeframe;
  isLoading: boolean;
  error: string | null;
  data: ChartData | null;
  config: ChartConfig;
}

// Chart Actions for State Management
export type ChartAction = 
  | { type: 'SET_VIEW_MODE'; payload: ChartViewMode }
  | { type: 'SET_TIMEFRAME'; payload: ChartTimeframe }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: ChartData }
  | { type: 'UPDATE_CONFIG'; payload: Partial<ChartConfig> }
  | { type: 'RESET' };

// Chart Data Processing Interfaces
export interface ProcessedCandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  patterns?: PatternDetection[];
}

export interface ProcessedLineData {
  time: number;
  value: number;
  date: string;
}

export interface ProcessedVolumeData {
  time: number;
  value: number;
  color: string;
}

// Chart Event Interfaces
export interface ChartClickEvent {
  timestamp: number;
  price: number;
  candle?: ProcessedCandlestickData;
  patterns?: PatternDetection[];
}

export interface PatternTooltipData {
  pattern: PatternDetection;
  position: {
    x: number;
    y: number;
  };
}

// Chart Export/Download Interfaces
export interface ChartExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  quality: number;
  width: number;
  height: number;
  includePatterns: boolean;
  includeVolume: boolean;
}

// Chart Performance Metrics
export interface ChartPerformanceMetrics {
  renderTime: number;
  dataPoints: number;
  patternsDetected: number;
  memoryUsage?: number;
}

// API Response Interfaces for Chart Data
export interface ChartDataResponse {
  success: boolean;
  data?: ChartData;
  error?: string;
  performance?: ChartPerformanceMetrics;
}

// Chart Component Props Interface
export interface AdvancedChartProps {
  symbol: string;
  initialViewMode?: ChartViewMode;
  config?: Partial<ChartConfig>;
  onViewModeChange?: (mode: ChartViewMode) => void;
  onPatternClick?: (pattern: PatternDetection) => void;
  onChartClick?: (event: ChartClickEvent) => void;
  className?: string;
  isMobile?: boolean;
}

// Pattern Alert Interface
export interface PatternAlert {
  id: string;
  symbol: string;
  pattern: PatternDetection;
  timestamp: Date;
  isRead: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Chart Summary Interface (for display below charts)
export interface ChartSummary {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  high: number;
  low: number;
  avgVolume?: number;
  rangePercent?: number;
  patternsCount: number;
  lastUpdate: Date;
}

// Real-time Update Interface
export interface RealTimeUpdate {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
  newCandle?: CandlestickData;
  newPatterns?: PatternDetection[];
}

// Chart Loading States
export interface ChartLoadingState {
  isLoadingData: boolean;
  isProcessingPatterns: boolean;
  isRendering: boolean;
  progress: number; // 0-100
  message: string;
}

// Error Types for Chart System
export type ChartErrorType = 
  | 'API_ERROR'
  | 'DATA_PROCESSING_ERROR'
  | 'PATTERN_DETECTION_ERROR'
  | 'RENDERING_ERROR'
  | 'NETWORK_ERROR'
  | 'INVALID_SYMBOL'
  | 'RATE_LIMIT_ERROR';

export interface ChartError {
  type: ChartErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

// Chart Animation Configuration
export interface ChartAnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delayBetweenPoints: number;
}

// Mobile-specific Configuration
export interface MobileChartConfig {
  touchEnabled: boolean;
  pinchZoomEnabled: boolean;
  swipeNavigationEnabled: boolean;
  reducedAnimations: boolean;
  simplifiedTooltips: boolean;
}

// Utility type for chart data validation
export interface ChartDataValidator {
  isValidCandlestickData: (data: any) => data is CandlestickData[];
  isValidLineData: (data: any) => data is DailyAdjustedData[];
  validateSymbol: (symbol: string) => boolean;
  validateTimeframe: (timeframe: string) => timeframe is ChartTimeframe;
} 