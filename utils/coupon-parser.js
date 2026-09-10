/**
 * Coupon Parser Module
 * Extracts and structures coupon information from AI results
 */

export function parseWebsiteForCoupons(aiResults, domain) {
  const coupons = [];
  
  aiResults.forEach(result => {
    const extracted = extractCouponData(result);
    if (extracted) {
      coupons.push(extracted);
    }
  });
  
  return coupons;
}

function extractCouponData(result) {
  const text = (result.title + ' ' + result.snippet + ' ' + (result.url || '')).toLowerCase();
  
  // Try to find coupon code patterns
  const codePattern = /([A-Z0-9]{4,15})/g;
  const codes = text.match(codePattern) || [];
  
  if (codes.length === 0) return null;
  
  const coupon = {
    code: codes[0],
    description: extractDescription(result),
    discount: extractDiscount(result),
    conditions: extractConditions(result),
    link: result.url || '',
    expiryDate: extractExpiryDate(result)
  };
  
  return coupon;
}

function extractDescription(result) {
  const title = result.title || '';
  const snippet = result.snippet || '';
  
  // Combine and truncate
  const combined = `${title} ${snippet}`.substring(0, 150);
  return combined.trim();
}

function extractDiscount(result) {
  const text = (result.title + ' ' + result.snippet).toLowerCase();
  
  // Look for percentage discounts
  const percentMatch = text.match(/(\d+)%\s*(?:off|discount)/i);
  if (percentMatch) return `${percentMatch[1]}% OFF`;
  
  // Look for fixed amount discounts
  const amountMatch = text.match(/(?:save|off)\s*(?:\$|Rp|₹)?(\d+)/i);
  if (amountMatch) return `Save ${amountMatch[1]}`;
  
  // Look for free shipping
  if (text.includes('free shipping') || text.includes('free delivery')) {
    return 'FREE SHIPPING';
  }
  
  return 'Special Offer';
}

function extractConditions(result) {
  const text = (result.title + ' ' + result.snippet).toLowerCase();
  const conditions = [];
  
  // Minimum purchase
  const minMatch = text.match(/min(?:imum)?\s*(?:purchase|spend|order)?:?\s*(?:\$|Rp|₹)?(\d+)/i);
  if (minMatch) conditions.push(`Min. purchase ${minMatch[1]}`);
  
  // New users only
  if (text.includes('new user') || text.includes('first order')) {
    conditions.push('New users only');
  }
  
  // Specific products
  if (text.includes('selected items') || text.includes('specific')) {
    conditions.push('Selected items only');
  }
  
  // Time limited
  if (text.includes('limited time') || text.includes('while stock') || text.includes('limited') || text.includes('ends')) {
    conditions.push('Limited time');
  }
  
  // Category specific
  const categories = ['electronics', 'fashion', 'home', 'beauty', 'food', 'books'];
  categories.forEach(cat => {
    if (text.includes(cat)) conditions.push(`${cat} category`);
  });
  
  return [...new Set(conditions)]; // Remove duplicates
}

function extractExpiryDate(result) {
  const text = result.title + ' ' + result.snippet;
  
  // Look for date patterns
  const datePatterns = [
    /(?:expires?|valid until|ends?|until)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /(?:expires?|valid until|ends?|until)\s+(\w+\s+\d{1,2})/i,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return '';
}
