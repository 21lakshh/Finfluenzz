/**
 * Currency Conversion Utilities
 * Centralized USD to INR conversion rate management
 */

// Current USD to INR exchange rate (as of latest update)
export const USD_TO_INR_RATE = 85.79;

/**
 * Convert USD amount to INR
 */
export function usdToInr(usdAmount: number): number {
  return usdAmount * USD_TO_INR_RATE;
}

/**
 * Convert INR amount to USD
 */
export function inrToUsd(inrAmount: number): number {
  return inrAmount / USD_TO_INR_RATE;
}

/**
 * Format USD amount as INR currency
 */
export function formatAsINR(usdAmount: number, decimals: number = 0): string {
  const inrAmount = usdToInr(usdAmount);
  return `₹${inrAmount.toFixed(decimals)}`;
}

/**
 * Format large INR amounts with appropriate suffix (K, L, Cr)
 */
export function formatINRLarge(usdAmount: number): string {
  const inrAmount = usdToInr(usdAmount);
  
  if (inrAmount >= 10000000) { // 1 Crore or more
    return `₹${(inrAmount / 10000000).toFixed(1)}Cr`;
  } else if (inrAmount >= 100000) { // 1 Lakh or more
    return `₹${(inrAmount / 100000).toFixed(1)}L`;
  } else if (inrAmount >= 1000) { // 1 Thousand or more
    return `₹${(inrAmount / 1000).toFixed(1)}K`;
  } else {
    return `₹${inrAmount.toFixed(0)}`;
  }
}

/**
 * Get current exchange rate info
 */
export function getExchangeRateInfo() {
  return {
    rate: USD_TO_INR_RATE,
    symbol: '₹',
    currency: 'INR',
    lastUpdated: 'Real-time approximate rate'
  };
} 