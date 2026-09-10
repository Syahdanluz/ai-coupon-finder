/**
 * Background Service Worker
 * Focuses on fetching coupons directly from Cuponation.co.id store pages
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCoupons') {
    fetchCuponationCoupons(request.domain)
      .then(coupons => {
        console.log(`[Background] Sending ${coupons.length} coupons`);
        sendResponse(coupons);
      })
      .catch(error => {
        console.error('[Background] Error:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function fetchCuponationCoupons(domain) {
  try {
    console.log(`[Background] Fetching coupons from Cuponation for: ${domain}`);
    
    // Extract store name from domain
    const storeName = getStoreName(domain);
    console.log(`[Background] Store name: ${storeName}`);
    
    if (!storeName) {
      throw new Error('Could not identify store');
    }
    
    // Try multiple Cuponation URL patterns
    const urls = [
      `https://www.cuponation.co.id/${storeName}-kupon`,
      `https://www.cuponation.co.id/${storeName}-kode-promo`,
      `https://www.cuponation.co.id/${storeName}`,
      `https://www.cuponation.co.id/search?q=${storeName}`
    ];
    
    let coupons = [];
    
    for (const url of urls) {
      try {
        console.log(`[Background] Trying URL: ${url}`);
        const fetchedCoupons = await fetchAndParseCuponation(url);
        if (fetchedCoupons && fetchedCoupons.length > 0) {
          coupons = fetchedCoupons;
          console.log(`[Background] Found ${coupons.length} coupons from ${url}`);
          break;
        }
      } catch (err) {
        console.error(`[Background] Error fetching ${url}:`, err);
        continue;
      }
    }
    
    if (coupons.length === 0) {
      console.warn(`[Background] No coupons found for ${storeName}`);
    }
    
    return coupons;
  } catch (error) {
    console.error('[Background] Fatal error:', error);
    throw error;
  }
}

async function fetchAndParseCuponation(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Referer': 'https://www.cuponation.co.id/'
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const coupons = parseCuponationHTML(html);
    
    return coupons;
  } catch (error) {
    console.error('[Background] Fetch/parse error:', error);
    return [];
  }
}

function parseCuponationHTML(html) {
  try {
    const coupons = [];
    
    // Use regex to find coupon sections
    // Cuponation typically uses specific HTML patterns
    
    // Pattern 1: Look for coupon code boxes
    const codePattern = /(?:kode|code)[\s:]*([A-Z0-9]{3,20})/gi;
    const codeMatches = html.matchAll(codePattern);
    
    for (const match of codeMatches) {
      const code = match[1];
      if (!code || code.length < 3) continue;
      
      // Find context around the code
      const startIdx = Math.max(0, match.index - 200);
      const endIdx = Math.min(html.length, match.index + 300);
      const context = html.substring(startIdx, endIdx);
      
      // Extract discount info
      const discount = extractDiscountFromContext(context);
      const description = extractDescriptionFromContext(context);
      
      coupons.push({
        code: code.toUpperCase(),
        discount: discount,
        description: description || 'Visit Cuponation for details',
        conditions: [],
        link: match.index > -1 ? html.substring(0, match.index).split('<a href="').pop()?.split('"')[0] || 'https://www.cuponation.co.id' : 'https://www.cuponation.co.id',
        expiryDate: '',
        source: 'Cuponation.co.id'
      });
    }
    
    // Pattern 2: Look for coupon cards/sections
    const cardPattern = /<div[^>]*class="[^"]*(?:coupon|offer|promo)[^"]*"[^>]*>([\s\S]{0,500}?)<\/div>/gi;
    const cardMatches = html.matchAll(cardPattern);
    
    for (const match of cardMatches) {
      const cardContent = match[1];
      
      // Look for code in this card
      const codeInCard = cardContent.match(/\b([A-Z0-9]{4,20})\b/);
      if (!codeInCard) continue;
      
      const code = codeInCard[1];
      if (coupons.some(c => c.code === code)) continue;
      
      const discount = extractDiscountFromContext(cardContent);
      const description = stripHTML(cardContent).substring(0, 150);
      
      coupons.push({
        code: code,
        discount: discount || 'Special Offer',
        description: description,
        conditions: [],
        link: 'https://www.cuponation.co.id',
        expiryDate: '',
        source: 'Cuponation.co.id'
      });
    }
    
    // Pattern 3: Direct text parsing
    const lines = html.split('\n');
    let currentDiscount = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for discount info
      if (line.match(/(\d+%|diskon|potongan|gratis)/i)) {
        currentDiscount = line.trim();
      }
      
      // Look for coupon code
      const codeMatch = line.match(/\b([A-Z0-9]{4,20})\b/);
      if (codeMatch && !coupons.some(c => c.code === codeMatch[1])) {
        const code = codeMatch[1];
        
        coupons.push({
          code: code,
          discount: currentDiscount || 'Special Offer',
          description: stripHTML(line).substring(0, 150),
          conditions: [],
          link: 'https://www.cuponation.co.id',
          expiryDate: '',
          source: 'Cuponation.co.id'
        });
      }
    }
    
    // Remove duplicates and invalid entries
    const uniqueCoupons = [];
    const seen = new Set();
    
    coupons.forEach(coupon => {
      if (coupon.code && coupon.code.length >= 3 && !seen.has(coupon.code)) {
        seen.add(coupon.code);
        // Filter out obvious non-coupons
        if (!isInvalidCode(coupon.code)) {
          uniqueCoupons.push(coupon);
        }
      }
    });
    
    console.log(`[Background] Parsed ${uniqueCoupons.length} unique coupons`);
    return uniqueCoupons.slice(0, 10); // Return top 10
  } catch (error) {
    console.error('[Background] Parse error:', error);
    return [];
  }
}

function getStoreName(domain) {
  try {
    // Extract store name from domain
    // www.traveloka.com -> traveloka
    // traveloka.co.id -> traveloka
    
    let cleanDomain = domain.replace('www.', '').toLowerCase();
    
    // Remove TLD and country code
    const parts = cleanDomain.split('.');
    const storeName = parts[0];
    
    if (!storeName || storeName.length < 2) {
      return null;
    }
    
    return storeName;
  } catch (error) {
    console.error('[Background] getStoreName error:', error);
    return null;
  }
}

function extractDiscountFromContext(context) {
  if (!context) return 'Special Offer';
  
  // Look for percentage
  const percentMatch = context.match(/(\d{1,3})%/);
  if (percentMatch) return `${percentMatch[1]}% OFF`;
  
  // Look for rupiah amount
  const rupiahMatch = context.match(/Rp[\s]?([\d.,]+)/i);
  if (rupiahMatch) return `Save Rp ${rupiahMatch[1]}`;
  
  // Look for "gratis" (free)
  if (context.match(/gratis|free/i)) {
    if (context.match(/ongkir|shipping/i)) {
      return 'FREE SHIPPING';
    }
    return 'FREE';
  }
  
  // Look for "diskon" (discount)
  const discountMatch = context.match(/diskon[\s:]*([^<\n]*)/i);
  if (discountMatch) return discountMatch[1].trim().substring(0, 30);
  
  return 'Special Offer';
}

function extractDescriptionFromContext(context) {
  if (!context) return '';
  
  // Remove HTML tags
  const text = stripHTML(context);
  
  // Get first meaningful sentence
  const sentences = text.split(/[.!?]/);
  const description = sentences.find(s => s.trim().length > 10);
  
  return description ? description.trim().substring(0, 150) : text.substring(0, 150);
}

function stripHTML(html) {
  try {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    return html;
  }
}

function isInvalidCode(code) {
  // Filter out common invalid patterns
  const invalid = ['DOCTYPE', 'HTML', 'BODY', 'CLASS', 'STYLE', 'SCRIPT', 'DIV', 'SPAN', 'CHARSET', 'META', 'HREF', 'HTTP'];
  return invalid.includes(code.toUpperCase());
}

console.log('[Background] Service worker loaded - Cuponation.co.id focused');
