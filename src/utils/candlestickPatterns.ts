import type { CandlestickData } from '../services/stockAPI';

export interface PatternDetection {
  index: number;
  timestamp: string;
  pattern: CandlestickPatternType;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
  confidence: number; // 0-100%
}

export type CandlestickPatternType = 
  | 'DOJI'
  | 'HAMMER'
  | 'SHOOTING_STAR'
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'BULLISH_HARAMI'
  | 'BEARISH_HARAMI'
  | 'THREE_WHITE_SOLDIERS'
  | 'THREE_BLACK_CROWS'
  | 'MORNING_STAR'
  | 'EVENING_STAR'
  | 'PIERCING_PATTERN'
  | 'DARK_CLOUD_COVER'
  | 'SPINNING_TOP'
  | 'MARUBOZU_BULLISH'
  | 'MARUBOZU_BEARISH';

interface PatternConfig {
  name: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
  explanation: string;
}

export const PATTERN_CONFIGS: Record<CandlestickPatternType, PatternConfig> = {
  DOJI: {
    name: 'Doji',
    signal: 'NEUTRAL',
    description: 'Indecision in market - open and close are nearly equal',
    explanation: 'Shows market uncertainty. Often signals potential reversal when found at key levels.'
  },
  HAMMER: {
    name: 'Hammer',
    signal: 'BULLISH',
    description: 'Bullish reversal pattern with long lower shadow',
    explanation: 'Bears pushed price down but bulls took control. Strong reversal signal at support levels.'
  },
  SHOOTING_STAR: {
    name: 'Shooting Star',
    signal: 'BEARISH',
    description: 'Bearish reversal pattern with long upper shadow',
    explanation: 'Bulls pushed price up but bears took control. Strong reversal signal at resistance levels.'
  },
  BULLISH_ENGULFING: {
    name: 'Bullish Engulfing',
    signal: 'BULLISH',
    description: 'Large green candle completely engulfs previous red candle',
    explanation: 'Strong bullish reversal signal. Buyers overwhelmed sellers and took full control.'
  },
  BEARISH_ENGULFING: {
    name: 'Bearish Engulfing',
    signal: 'BEARISH',
    description: 'Large red candle completely engulfs previous green candle',
    explanation: 'Strong bearish reversal signal. Sellers overwhelmed buyers and took full control.'
  },
  BULLISH_HARAMI: {
    name: 'Bullish Harami',
    signal: 'BULLISH',
    description: 'Small green candle contained within previous large red candle',
    explanation: 'Potential bullish reversal. Selling pressure is weakening, buyers starting to step in.'
  },
  BEARISH_HARAMI: {
    name: 'Bearish Harami',
    signal: 'BEARISH',
    description: 'Small red candle contained within previous large green candle',
    explanation: 'Potential bearish reversal. Buying pressure is weakening, sellers starting to step in.'
  },
  THREE_WHITE_SOLDIERS: {
    name: 'Three White Soldiers',
    signal: 'BULLISH',
    description: 'Three consecutive green candles with higher closes',
    explanation: 'Very strong bullish continuation pattern. Bulls are in complete control.'
  },
  THREE_BLACK_CROWS: {
    name: 'Three Black Crows',
    signal: 'BEARISH',
    description: 'Three consecutive red candles with lower closes',
    explanation: 'Very strong bearish continuation pattern. Bears are in complete control.'
  },
  MORNING_STAR: {
    name: 'Morning Star',
    signal: 'BULLISH',
    description: 'Three-candle bullish reversal pattern',
    explanation: 'Strong bullish reversal. Large red candle, small doji/spinning top, then large green candle.'
  },
  EVENING_STAR: {
    name: 'Evening Star',
    signal: 'BEARISH',
    description: 'Three-candle bearish reversal pattern',
    explanation: 'Strong bearish reversal. Large green candle, small doji/spinning top, then large red candle.'
  },
  PIERCING_PATTERN: {
    name: 'Piercing Pattern',
    signal: 'BULLISH',
    description: 'Green candle opens below and closes above midpoint of previous red candle',
    explanation: 'Bullish reversal signal. Buyers stepped in strongly and pushed price above midpoint.'
  },
  DARK_CLOUD_COVER: {
    name: 'Dark Cloud Cover',
    signal: 'BEARISH',
    description: 'Red candle opens above and closes below midpoint of previous green candle',
    explanation: 'Bearish reversal signal. Sellers stepped in strongly and pushed price below midpoint.'
  },
  SPINNING_TOP: {
    name: 'Spinning Top',
    signal: 'NEUTRAL',
    description: 'Small body with long upper and lower shadows',
    explanation: 'Market indecision. Neither bulls nor bears could maintain control.'
  },
  MARUBOZU_BULLISH: {
    name: 'Bullish Marubozu',
    signal: 'BULLISH',
    description: 'Large green candle with no shadows - strong bullish sentiment',
    explanation: 'Very strong bullish sentiment. Buyers controlled the entire session from open to close.'
  },
  MARUBOZU_BEARISH: {
    name: 'Bearish Marubozu',
    signal: 'BEARISH',
    description: 'Large red candle with no shadows - strong bearish sentiment',
    explanation: 'Very strong bearish sentiment. Sellers controlled the entire session from open to close.'
  }
};

export class CandlestickPatternDetector {
  private data: CandlestickData[];
  private patterns: PatternDetection[] = [];

  constructor(data: CandlestickData[]) {
    this.data = data;
  }

  // Main method to detect all patterns
  detectAllPatterns(): PatternDetection[] {
    this.patterns = [];
    
    if (this.data.length < 3) {
      return this.patterns;
    }

    for (let i = 2; i < this.data.length; i++) {
      // Single candle patterns
      this.detectDoji(i);
      this.detectHammer(i);
      this.detectShootingStar(i);
      this.detectSpinningTop(i);
      this.detectMarubozu(i);

      // Two candle patterns
      if (i >= 1) {
        this.detectEngulfing(i);
        this.detectHarami(i);
        this.detectPiercingPattern(i);
        this.detectDarkCloudCover(i);
      }

      // Three candle patterns
      if (i >= 2) {
        this.detectThreeSoldiersCrows(i);
        this.detectMorningStar(i);
        this.detectEveningStar(i);
      }
    }

    // Sort by timestamp (most recent first)
    return this.patterns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Helper methods for calculations
  private getCandleBody(candle: CandlestickData): number {
    return Math.abs(candle.close - candle.open);
  }

  private getCandleRange(candle: CandlestickData): number {
    return candle.high - candle.low;
  }

  private getUpperShadow(candle: CandlestickData): number {
    return candle.high - Math.max(candle.open, candle.close);
  }

  private getLowerShadow(candle: CandlestickData): number {
    return Math.min(candle.open, candle.close) - candle.low;
  }

  private isBullish(candle: CandlestickData): boolean {
    return candle.close > candle.open;
  }

  private isBearish(candle: CandlestickData): boolean {
    return candle.close < candle.open;
  }

  private calculateStrength(confidence: number): 'WEAK' | 'MODERATE' | 'STRONG' {
    if (confidence >= 80) return 'STRONG';
    if (confidence >= 60) return 'MODERATE';
    return 'WEAK';
  }

  private addPattern(index: number, pattern: CandlestickPatternType, confidence: number): void {
    const config = PATTERN_CONFIGS[pattern];
    this.patterns.push({
      index,
      timestamp: this.data[index].timestamp,
      pattern,
      strength: this.calculateStrength(confidence),
      signal: config.signal,
      description: config.description,
      confidence
    });
  }

  // Pattern Detection Methods

  private detectDoji(index: number): void {
    const candle = this.data[index];
    const body = this.getCandleBody(candle);
    const range = this.getCandleRange(candle);
    
    if (range === 0) return;
    
    const bodyRatio = body / range;
    
    if (bodyRatio <= 0.1) {
      const confidence = Math.max(50, 100 - (bodyRatio * 500));
      this.addPattern(index, 'DOJI', confidence);
    }
  }

  private detectHammer(index: number): void {
    const candle = this.data[index];
    const body = this.getCandleBody(candle);
    const lowerShadow = this.getLowerShadow(candle);
    const upperShadow = this.getUpperShadow(candle);
    const range = this.getCandleRange(candle);
    
    if (range === 0) return;
    
    // Hammer: small body, long lower shadow, minimal upper shadow
    if (lowerShadow >= body * 2 && upperShadow <= body * 0.5 && body / range >= 0.1) {
      const confidence = Math.min(90, 60 + (lowerShadow / body) * 10);
      this.addPattern(index, 'HAMMER', confidence);
    }
  }

  private detectShootingStar(index: number): void {
    const candle = this.data[index];
    const body = this.getCandleBody(candle);
    const upperShadow = this.getUpperShadow(candle);
    const lowerShadow = this.getLowerShadow(candle);
    const range = this.getCandleRange(candle);
    
    if (range === 0) return;
    
    // Shooting star: small body, long upper shadow, minimal lower shadow
    if (upperShadow >= body * 2 && lowerShadow <= body * 0.5 && body / range >= 0.1) {
      const confidence = Math.min(90, 60 + (upperShadow / body) * 10);
      this.addPattern(index, 'SHOOTING_STAR', confidence);
    }
  }

  private detectEngulfing(index: number): void {
    if (index < 1) return;
    
    const current = this.data[index];
    const previous = this.data[index - 1];
    
    const currentBody = this.getCandleBody(current);
    const previousBody = this.getCandleBody(previous);
    
    // Bullish engulfing
    if (this.isBearish(previous) && this.isBullish(current) &&
        current.open <= previous.close && current.close >= previous.open &&
        currentBody > previousBody) {
      const confidence = Math.min(95, 70 + (currentBody / previousBody - 1) * 50);
      this.addPattern(index, 'BULLISH_ENGULFING', confidence);
    }
    
    // Bearish engulfing
    if (this.isBullish(previous) && this.isBearish(current) &&
        current.open >= previous.close && current.close <= previous.open &&
        currentBody > previousBody) {
      const confidence = Math.min(95, 70 + (currentBody / previousBody - 1) * 50);
      this.addPattern(index, 'BEARISH_ENGULFING', confidence);
    }
  }

  private detectHarami(index: number): void {
    if (index < 1) return;
    
    const current = this.data[index];
    const previous = this.data[index - 1];
    
    const currentBody = this.getCandleBody(current);
    const previousBody = this.getCandleBody(previous);
    
    // Check if current candle is contained within previous candle's body
    const isContained = current.open <= Math.max(previous.open, previous.close) &&
                       current.close >= Math.min(previous.open, previous.close) &&
                       currentBody < previousBody;
    
    if (isContained) {
      // Bullish harami
      if (this.isBearish(previous) && this.isBullish(current)) {
        const confidence = Math.min(85, 60 + (1 - currentBody / previousBody) * 50);
        this.addPattern(index, 'BULLISH_HARAMI', confidence);
      }
      
      // Bearish harami
      if (this.isBullish(previous) && this.isBearish(current)) {
        const confidence = Math.min(85, 60 + (1 - currentBody / previousBody) * 50);
        this.addPattern(index, 'BEARISH_HARAMI', confidence);
      }
    }
  }

  private detectThreeSoldiersCrows(index: number): void {
    if (index < 2) return;
    
    const candle1 = this.data[index - 2];
    const candle2 = this.data[index - 1];
    const candle3 = this.data[index];
    
    // Three white soldiers
    if (this.isBullish(candle1) && this.isBullish(candle2) && this.isBullish(candle3) &&
        candle2.close > candle1.close && candle3.close > candle2.close &&
        candle2.open > candle1.open && candle3.open > candle2.open) {
      this.addPattern(index, 'THREE_WHITE_SOLDIERS', 85);
    }
    
    // Three black crows
    if (this.isBearish(candle1) && this.isBearish(candle2) && this.isBearish(candle3) &&
        candle2.close < candle1.close && candle3.close < candle2.close &&
        candle2.open < candle1.open && candle3.open < candle2.open) {
      this.addPattern(index, 'THREE_BLACK_CROWS', 85);
    }
  }

  private detectMorningStar(index: number): void {
    if (index < 2) return;
    
    const candle1 = this.data[index - 2]; // Large bearish
    const candle2 = this.data[index - 1]; // Small indecision
    const candle3 = this.data[index];     // Large bullish
    
    const body1 = this.getCandleBody(candle1);
    const body2 = this.getCandleBody(candle2);
    const body3 = this.getCandleBody(candle3);
    
    if (this.isBearish(candle1) && this.isBullish(candle3) &&
        body1 > body2 && body3 > body2 &&
        candle3.close > (candle1.open + candle1.close) / 2) {
      this.addPattern(index, 'MORNING_STAR', 80);
    }
  }

  private detectEveningStar(index: number): void {
    if (index < 2) return;
    
    const candle1 = this.data[index - 2]; // Large bullish
    const candle2 = this.data[index - 1]; // Small indecision
    const candle3 = this.data[index];     // Large bearish
    
    const body1 = this.getCandleBody(candle1);
    const body2 = this.getCandleBody(candle2);
    const body3 = this.getCandleBody(candle3);
    
    if (this.isBullish(candle1) && this.isBearish(candle3) &&
        body1 > body2 && body3 > body2 &&
        candle3.close < (candle1.open + candle1.close) / 2) {
      this.addPattern(index, 'EVENING_STAR', 80);
    }
  }

  private detectPiercingPattern(index: number): void {
    if (index < 1) return;
    
    const previous = this.data[index - 1];
    const current = this.data[index];
    
    if (this.isBearish(previous) && this.isBullish(current) &&
        current.open < previous.close &&
        current.close > (previous.open + previous.close) / 2 &&
        current.close < previous.open) {
      this.addPattern(index, 'PIERCING_PATTERN', 75);
    }
  }

  private detectDarkCloudCover(index: number): void {
    if (index < 1) return;
    
    const previous = this.data[index - 1];
    const current = this.data[index];
    
    if (this.isBullish(previous) && this.isBearish(current) &&
        current.open > previous.close &&
        current.close < (previous.open + previous.close) / 2 &&
        current.close > previous.open) {
      this.addPattern(index, 'DARK_CLOUD_COVER', 75);
    }
  }

  private detectSpinningTop(index: number): void {
    const candle = this.data[index];
    const body = this.getCandleBody(candle);
    const upperShadow = this.getUpperShadow(candle);
    const lowerShadow = this.getLowerShadow(candle);
    const range = this.getCandleRange(candle);
    
    if (range === 0) return;
    
    // Small body with significant shadows on both sides
    if (body / range <= 0.3 && upperShadow >= body && lowerShadow >= body) {
      const confidence = Math.min(80, 50 + (1 - body / range) * 60);
      this.addPattern(index, 'SPINNING_TOP', confidence);
    }
  }

  private detectMarubozu(index: number): void {
    const candle = this.data[index];
    const body = this.getCandleBody(candle);
    const upperShadow = this.getUpperShadow(candle);
    const lowerShadow = this.getLowerShadow(candle);
    const range = this.getCandleRange(candle);
    
    if (range === 0) return;
    
    // Very small shadows (less than 1% of range) and significant body
    if (upperShadow / range <= 0.01 && lowerShadow / range <= 0.01 && body / range >= 0.95) {
      if (this.isBullish(candle)) {
        this.addPattern(index, 'MARUBOZU_BULLISH', 90);
      } else {
        this.addPattern(index, 'MARUBOZU_BEARISH', 90);
      }
    }
  }
}

// Utility function to detect patterns from candlestick data
export function detectCandlestickPatterns(data: CandlestickData[]): PatternDetection[] {
  const detector = new CandlestickPatternDetector(data);
  return detector.detectAllPatterns();
}

// Get pattern strength color for UI
export function getPatternColor(signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL', strength: 'WEAK' | 'MODERATE' | 'STRONG'): string {
  if (signal === 'BULLISH') {
    switch (strength) {
      case 'STRONG': return '#22c55e'; // Green-500
      case 'MODERATE': return '#65a30d'; // Lime-600
      case 'WEAK': return '#84cc16'; // Lime-400
    }
  } else if (signal === 'BEARISH') {
    switch (strength) {
      case 'STRONG': return '#ef4444'; // Red-500
      case 'MODERATE': return '#dc2626'; // Red-600
      case 'WEAK': return '#f87171'; // Red-400
    }
  }
  return '#6b7280'; // Gray-500 for neutral
} 