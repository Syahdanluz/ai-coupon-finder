/**
 * Validators Module
 * Validates and sanitizes coupon data and URLs
 */

export function validateCoupon(coupon) {
  // Must have a code
  if (!coupon.code || typeof coupon.code !== 'string' || coupon.code.length < 2) {
    return false;
  }
  
  // Code should not be too long (max 50 chars)
  if (coupon.code.length > 50) {
    return false;
  }
  
  // Should have some description
  if (!coupon.description || coupon.description.length < 5) {
    return false;
  }
  
  return true;
}

export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    // Parse to validate
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch (error) {
    // If not a valid URL, return empty
    return '';
  }
}

export function sanitizeCode(code) {
  if (!code || typeof code !== 'string') {
    return '';
  }
  
  // Remove special characters except common ones
  return code
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .substring(0, 50)
    .toUpperCase();
}

export function isValidDomain(domain) {
  const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainPattern.test(domain);
}
