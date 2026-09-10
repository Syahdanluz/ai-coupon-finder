/**
 * Advanced Coupon Parsing Module
 * Uses multiple strategies to extract coupon codes from various sources
 */

export class CouponExtractor {
  constructor() {
    // Common coupon code patterns
    this.patterns = {
      // Alphanumeric codes (most common)
      basic: /\b([A-Z0-9]{4,20})\b/g,
      // Codes with hyphens or underscores
      withSeparators: /\b([A-Z0-9]{2,}[-_][A-Z0-9]{2,})\b/g,
      // Percentage discounts
      percentOff: /(\d{1,3})%\s*(?:off|discount|reduction)/gi,
      // Currency amounts
      currencyOff: /(?:save|off|discount)\s*(?:\$|Rp|₹|€|£)(\d+)/gi,
      // Flat amount or multiplier deals
      flatDeals: /(?:buy\s+\d+\s+get\s+\d+|save\s+\d+)/gi,
      // Free shipping mentions
      freeShipping: /free\s+(?:shipping|delivery|postage)/gi,
      // Dates
      dates: /(\d{1,2}[-\/\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[-\/\s]\d{2,4})/gi,
      // Time constraints
      timeConstraints: /(?:until|expires?|valid\s+(?:until|through)|ends?)\s+([^,\.]+)/gi
    };
  }

  extractCoupons(htmlContent) {
    const coupons = [];
    
    // Extract from common coupon code containers
    const codeElements = this.findCodeElements(htmlContent);
    codeElements.forEach(element => {
      const coupon = this.parseCouponElement(element);
      if (coupon) coupons.push(coupon);
    });
    
    // Extract from text patterns
    const textCoupons = this.extractFromText(htmlContent);
    coupons.push(...textCoupons);
    
    // Remove duplicates
    return this.deduplicateCoupons(coupons);
  }

  findCodeElements(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const selectors = [
      '[class*="coupon"]',
      '[id*="coupon"]',
      '[class*="promo"]',
      '[id*="promo"]',
      '[class*="code"]',
      '[class*="discount"]',
      'code',
      '.badge',
      '.tag'
    ];
    
    let elements = [];
    selectors.forEach(selector => {
      try {
        elements = elements.concat(Array.from(doc.querySelectorAll(selector)));
      } catch (e) {
        // Invalid selector, skip
      }
    });
    
    return elements;
  }

  parseCouponElement(element) {
    const text = element.textContent || '';
    const html = element.innerHTML || '';
    
    // Extract code
    let code = text.match(/\b([A-Z0-9]{4,20})\b/)?.[0] || '';
    if (!code) return null;
    
    // Get parent context for additional info
    const context = element.parentElement?.textContent || '';
    
    return {
      code: code.toUpperCase(),
      description: this.extractDescription(context),
      discount: this.extractDiscount(context),
      conditions: this.extractConditions(context),
      expiryDate: this.extractExpiry(context)
    };
  }

  extractFromText(text) {
    const coupons = [];
    
    // Find sections that talk about coupons/promos
    const sections = text.split(/(?:coupon|promo|discount|offer)/gi);
    
    sections.forEach((section, index) => {
      // Look for codes in this section
      const codes = section.match(this.patterns.basic);
      if (codes) {
        codes.forEach(code => {
          // Only take codes that look valid (not common words)
          if (!this.isCommonWord(code) && code.length >= 4) {
            coupons.push({
              code: code.toUpperCase(),
              description: this.extractDescription(section),
              discount: this.extractDiscount(section),
              conditions: this.extractConditions(section),
              expiryDate: this.extractExpiry(section)
            });
          }
        });
      }
    });
    
    return coupons;
  }

  extractDescription(text) {
    // Get first sentence or first 150 characters
    const sentence = text.split(/[.!?]/)[0];
    return sentence.substring(0, 150).trim();
  }

  extractDiscount(text) {
    // Percentage
    const percentMatch = text.match(/(\d{1,3})%\s*(?:off|discount)/i);
    if (percentMatch) return `${percentMatch[1]}% OFF`;
    
    // Currency amount
    const currencyMatch = text.match(/(?:save|off|discount)\s*(?:\$|Rp|₹|€|£)(\d+)/i);
    if (currencyMatch) return `Save ${currencyMatch[1]}`;
    
    // Free shipping
    if (/free\s+(?:shipping|delivery)/i.test(text)) return 'FREE SHIPPING';
    
    // Buy X Get Y deals
    const buyGetMatch = text.match(/(buy\s+\d+\s+get\s+\d+)/i);
    if (buyGetMatch) return buyGetMatch[1].toUpperCase();
    
    return 'Special Offer';
  }

  extractConditions(text) {
    const conditions = [];
    
    // Minimum purchase
    const minMatch = text.match(/min(?:imum)?\s*(?:purchase|spend|order)?:?\s*(?:\$|Rp|₹|€|£)?(\d+)/i);
    if (minMatch) conditions.push(`Min. purchase ${minMatch[1]}`);
    
    // New users
    if (/(?:new\s+(?:customer|user|member)|first\s+order)/i.test(text)) {
      conditions.push('New users only');
    }
    
    // Selected items
    if (/(?:selected|specific|certain|participating)/i.test(text)) {
      conditions.push('Selected items only');
    }
    
    // Limited time
    if (/(?:limited\s+time|while\s+stock|ends?|expires?)/i.test(text)) {
      conditions.push('Limited time');
    }
    
    // Payment method specific
    const paymentMethods = ['credit card', 'debit card', 'e-wallet', 'bank transfer', 'paypal'];
    paymentMethods.forEach(method => {
      if (new RegExp(method, 'i').test(text)) {
        conditions.push(`${method} only`);
      }
    });
    
    return [...new Set(conditions)];
  }

  extractExpiry(text) {
    // Look for common date formats
    const datePatterns = [
      /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
      /(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return '';
  }

  isCommonWord(word) {
    const commonWords = ['THE', 'AND', 'FOR', 'WITH', 'FROM', 'ONLY', 'MORE', 'THAN', 'CODE'];
    return commonWords.includes(word);
  }

  deduplicateCoupons(coupons) {
    const seen = new Map();
    
    return coupons.filter(coupon => {
      const key = coupon.code.toUpperCase();
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, true);
      return true;
    });
  }
}

export default CouponExtractor;
