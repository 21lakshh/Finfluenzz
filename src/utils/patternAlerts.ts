import type { PatternDetection } from './candlestickPatterns';
import type { PatternAlert } from '../types/chartTypes';

// Alert severity mapping based on pattern confidence and signal strength
export function calculateAlertSeverity(pattern: PatternDetection): 'LOW' | 'MEDIUM' | 'HIGH' {
  const { confidence, strength, signal } = pattern;
  
  // Strong patterns with high confidence get HIGH severity
  if (strength === 'STRONG' && confidence >= 80) {
    return 'HIGH';
  }
  
  // Moderate patterns with good confidence get MEDIUM severity
  if ((strength === 'MODERATE' && confidence >= 70) || 
      (strength === 'STRONG' && confidence >= 60)) {
    return 'MEDIUM';
  }
  
  // Everything else gets LOW severity
  return 'LOW';
}

// Generate alert messages for patterns
export function generateAlertMessage(pattern: PatternDetection, symbol: string): string {
  const { pattern: patternType, signal, confidence, strength } = pattern;
  
  const signalEmoji = signal === 'BULLISH' ? '🚀' : signal === 'BEARISH' ? '📉' : '⚠️';
  const strengthText = strength === 'STRONG' ? 'STRONG' : strength === 'MODERATE' ? 'MODERATE' : 'WEAK';
  
  const patternNames: Record<string, string> = {
    'BULLISH_ENGULFING': 'Bullish Engulfing',
    'BEARISH_ENGULFING': 'Bearish Engulfing',
    'HAMMER': 'Hammer',
    'SHOOTING_STAR': 'Shooting Star',
    'DOJI': 'Doji',
    'THREE_WHITE_SOLDIERS': 'Three White Soldiers',
    'THREE_BLACK_CROWS': 'Three Black Crows',
    'MORNING_STAR': 'Morning Star',
    'EVENING_STAR': 'Evening Star',
    'BULLISH_HARAMI': 'Bullish Harami',
    'BEARISH_HARAMI': 'Bearish Harami',
    'PIERCING_PATTERN': 'Piercing Pattern',
    'DARK_CLOUD_COVER': 'Dark Cloud Cover',
    'SPINNING_TOP': 'Spinning Top',
    'MARUBOZU_BULLISH': 'Bullish Marubozu',
    'MARUBOZU_BEARISH': 'Bearish Marubozu'
  };
  
  const patternName = patternNames[patternType] || patternType;
  
  return `${signalEmoji} ${strengthText} ${signal} SIGNAL: ${patternName} detected on ${symbol} (${confidence}% confidence)`;
}

// Filter patterns that should trigger alerts
export function getAlertWorthyPatterns(patterns: PatternDetection[]): PatternDetection[] {
  return patterns.filter(pattern => {
    // Only alert on patterns with decent confidence
    if (pattern.confidence < 60) return false;
    
    // Always alert on strong patterns
    if (pattern.strength === 'STRONG') return true;
    
    // Alert on moderate patterns with high confidence
    if (pattern.strength === 'MODERATE' && pattern.confidence >= 75) return true;
    
    // Alert on specific high-value patterns regardless of strength
    const highValuePatterns = [
      'BULLISH_ENGULFING',
      'BEARISH_ENGULFING',
      'THREE_WHITE_SOLDIERS',
      'THREE_BLACK_CROWS',
      'MORNING_STAR',
      'EVENING_STAR'
    ];
    
    if (highValuePatterns.includes(pattern.pattern) && pattern.confidence >= 70) {
      return true;
    }
    
    return false;
  });
}

// Create pattern alerts from detected patterns
export function createPatternAlerts(
  patterns: PatternDetection[], 
  symbol: string
): PatternAlert[] {
  const alertWorthyPatterns = getAlertWorthyPatterns(patterns);
  
  return alertWorthyPatterns.map(pattern => ({
    id: `${symbol}-${pattern.pattern}-${pattern.timestamp}-${Date.now()}`,
    symbol,
    pattern,
    timestamp: new Date(),
    isRead: false,
    severity: calculateAlertSeverity(pattern)
  }));
}

// Format alert for display
export function formatAlertForDisplay(alert: PatternAlert): {
  title: string;
  message: string;
  color: string;
  icon: string;
} {
  const { pattern, symbol, severity } = alert;
  const signal = pattern.signal;
  
  const colors = {
    HIGH: signal === 'BULLISH' ? '#16a34a' : '#dc2626', // green-600 or red-600
    MEDIUM: signal === 'BULLISH' ? '#65a30d' : '#ea580c', // lime-600 or orange-600  
    LOW: '#6b7280' // gray-500
  };
  
  const icons = {
    BULLISH: '🚀',
    BEARISH: '📉',
    NEUTRAL: '⚠️'
  };
  
  return {
    title: `${symbol} Pattern Alert`,
    message: generateAlertMessage(pattern, symbol),
    color: colors[severity],
    icon: icons[signal]
  };
}

// Browser notification for pattern alerts (optional)
export function showBrowserNotification(alert: PatternAlert): void {
  if (!('Notification' in window)) {
    console.log('Browser notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    const { title, message, icon } = formatAlertForDisplay(alert);
    
    new Notification(title, {
      body: message,
      icon: '/favicon.ico', // You can customize this
      badge: '/favicon.ico',
      tag: alert.id, // Prevents duplicate notifications
      requireInteraction: alert.severity === 'HIGH',
      silent: alert.severity === 'LOW'
    });
  }
}

// Request notification permission
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.reject('Browser notifications not supported');
  }
  
  return Notification.requestPermission();
}

// Pattern alert system class for managing alerts
export class PatternAlertSystem {
  private alerts: PatternAlert[] = [];
  private subscribers: ((alerts: PatternAlert[]) => void)[] = [];
  
  // Add new alerts
  addAlerts(newAlerts: PatternAlert[]): void {
    this.alerts = [...this.alerts, ...newAlerts];
    this.notifySubscribers();
    
    // Show browser notifications for high severity alerts
    newAlerts
      .filter(alert => alert.severity === 'HIGH')
      .forEach(alert => showBrowserNotification(alert));
  }
  
  // Mark alert as read
  markAsRead(alertId: string): void {
    this.alerts = this.alerts.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    );
    this.notifySubscribers();
  }
  
  // Remove alert
  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notifySubscribers();
  }
  
  // Get all alerts
  getAlerts(): PatternAlert[] {
    return [...this.alerts];
  }
  
  // Get unread alerts
  getUnreadAlerts(): PatternAlert[] {
    return this.alerts.filter(alert => !alert.isRead);
  }
  
  // Get alerts by severity
  getAlertsBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH'): PatternAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }
  
  // Clear old alerts (older than specified hours)
  clearOldAlerts(hoursOld: number = 24): void {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    this.notifySubscribers();
  }
  
  // Subscribe to alert changes
  subscribe(callback: (alerts: PatternAlert[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  // Notify all subscribers
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.getAlerts()));
  }
}

// Singleton instance
export const patternAlertSystem = new PatternAlertSystem();

// Utility function to process new patterns and generate alerts
export function processNewPatterns(
  patterns: PatternDetection[], 
  symbol: string
): PatternAlert[] {
  const alerts = createPatternAlerts(patterns, symbol);
  
  if (alerts.length > 0) {
    patternAlertSystem.addAlerts(alerts);
    console.log(`🔔 Generated ${alerts.length} pattern alerts for ${symbol}:`, alerts);
  }
  
  return alerts;
}

// Get alert summary for UI display
export function getAlertSummary(): {
  total: number;
  unread: number;
  high: number;
  medium: number;
  low: number;
} {
  const alerts = patternAlertSystem.getAlerts();
  const unread = patternAlertSystem.getUnreadAlerts();
  
  return {
    total: alerts.length,
    unread: unread.length,
    high: alerts.filter(a => a.severity === 'HIGH').length,
    medium: alerts.filter(a => a.severity === 'MEDIUM').length,
    low: alerts.filter(a => a.severity === 'LOW').length
  };
} 