/**
 * Timezone Utilities for Indian Standard Time (IST)
 * IST is UTC+05:30
 */

// IST offset from UTC in milliseconds (5 hours 30 minutes)
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

/**
 * Convert any date to IST
 */
export function toIST(date: Date): Date {
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utcTime + IST_OFFSET);
}

/**
 * Get current time in IST
 */
export function nowInIST(): Date {
  return toIST(new Date());
}

/**
 * Create a new Date in IST for a specific time
 */
export function createISTDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date {
  // Create date in UTC first, then adjust for IST
  const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
  return new Date(utcDate.getTime() - IST_OFFSET);
}

/**
 * Format date in IST for display
 */
export function formatISTDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  const istDate = toIST(date);
  return istDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options
  });
}

/**
 * Format time in IST for display (HH:MM format)
 */
export function formatISTTime(date: Date): string {
  const istDate = toIST(date);
  return istDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Get IST timestamp string in ISO format
 */
export function getISTTimestamp(date: Date): string {
  const istDate = toIST(date);
  return istDate.toISOString();
}

/**
 * Convert US market hours to IST
 * US Eastern Time to IST conversion
 */
export function getUSMarketHoursInIST() {
  const now = nowInIST();
  
  // US Market opens at 9:30 AM ET
  // During Standard Time: ET = UTC-5, so 9:30 AM ET = 2:30 PM UTC = 8:00 PM IST
  // During Daylight Time: ET = UTC-4, so 9:30 AM ET = 1:30 PM UTC = 7:00 PM IST
  
  // Check if it's daylight saving time (rough approximation)
  const month = now.getMonth();
  const isDST = month >= 2 && month <= 10; // March to November (rough)
  
  const marketOpenIST = isDST ? '19:00' : '20:00'; // 7:00 PM or 8:00 PM IST
  const marketCloseIST = isDST ? '01:30' : '02:30'; // 1:30 AM or 2:30 AM IST (next day)
  
  return {
    open: marketOpenIST,
    close: marketCloseIST,
    isDST,
    timezone: 'IST (UTC+05:30)'
  };
}

/**
 * Create demo market hours in IST (for demo data)
 */
export function createDemoMarketHoursIST(): Date {
  const now = nowInIST();
  const marketOpen = new Date(now);
  
  // Set to a typical Indian trading session time (9:15 AM IST)
  marketOpen.setHours(9, 15, 0, 0);
  
  return marketOpen;
}

/**
 * Check if current time is during Indian market hours
 */
export function isIndianMarketOpen(): boolean {
  const now = nowInIST();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + currentMinute / 60;
  
  // Indian stock market hours: 9:15 AM to 3:30 PM IST (Monday to Friday)
  const marketOpen = 9.25; // 9:15 AM
  const marketClose = 15.5; // 3:30 PM
  
  const dayOfWeek = now.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  
  return isWeekday && currentTime >= marketOpen && currentTime <= marketClose;
}

/**
 * Check if current time is during US market hours (in IST)
 */
export function isUSMarketOpen(): boolean {
  const now = nowInIST();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + currentMinute / 60;
  
  // US Market in IST: 7:00 PM - 1:30 AM (DST) or 8:00 PM - 2:30 AM (Standard)
  const month = now.getMonth();
  const isDST = month >= 2 && month <= 10; // March to November (rough)
  
  const marketOpen = isDST ? 19.0 : 20.0; // 7:00 PM or 8:00 PM
  const marketClose = isDST ? 25.5 : 26.5; // 1:30 AM or 2:30 AM (next day)
  
  const dayOfWeek = now.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  
  // Handle overnight sessions (market close is next day)
  const isInSession = currentTime >= marketOpen || currentTime <= (marketClose - 24);
  
  return isWeekday && isInSession;
}

/**
 * Get current market status
 */
export function getMarketStatus() {
  const now = nowInIST();
  const indianOpen = isIndianMarketOpen();
  const usOpen = isUSMarketOpen();
  
  return {
    currentTime: formatISTTime(now),
    indianMarket: {
      isOpen: indianOpen,
      status: indianOpen ? 'OPEN' : 'CLOSED',
      hours: '9:15 AM - 3:30 PM IST'
    },
    usMarket: {
      isOpen: usOpen,
      status: usOpen ? 'OPEN' : 'CLOSED',
      hours: getUSMarketHoursInIST()
    }
  };
}

/**
 * Get next Indian market open time
 */
export function getNextIndianMarketOpen(): Date {
  const now = nowInIST();
  const nextOpen = new Date(now);
  
  // Set to 9:15 AM
  nextOpen.setHours(9, 15, 0, 0);
  
  // If it's already past market open today, move to next weekday
  if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 15)) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // If it's weekend, move to Monday
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  return nextOpen;
}

/**
 * Convert date string to IST display format
 */
export function displayDateInIST(dateString: string): string {
  const date = new Date(dateString);
  return formatISTDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get timezone info for display
 */
export function getTimezoneInfo() {
  return {
    name: 'Indian Standard Time',
    abbreviation: 'IST',
    offset: '+05:30',
    utcOffset: IST_OFFSET / (60 * 60 * 1000) // in hours
  };
} 