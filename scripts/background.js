/**
 * Background Service Worker
 * Fetches REAL coupons from websites
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCoupons') {
    fetchRealCoupons(request.domain, request.url)
      .then(coupons => sendResponse(coupons))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async
  }
});

async function fetchRealCoupons(domain, url) {
  try {
    console.log(`[Background] Fetching real coupons for: ${domain}`);
    
    // Generate search query
    const cleanDomain = domain.replace('www.', '').split('.')[0];
    const searchQuery = `${cleanDomain} coupon codes ${new Date().getFullYear()}`;
    
    // Fetch from Google Custom Search or direct search
    const coupons = await searchForCoupons(searchQuery, domain);
    
    return coupons;
  } catch (error) {
    console.error('[Background] Error:', error);
    throw error;
  }
}

async function searchForCoupons(query, domain) {
  try {
    // Try to fetch from a coupon aggregator API or scrape Google
    const results = await fetchFromCouponSources(query, domain);
    return results;
  } catch (error) {
    console.error('[Background] Search error:', error);
    return [];
  }
}

async function fetchFromCouponSources(query, domain) {
  try {
    // Method 1: Try fetching from RetailMeNot-like API
    const retailMeNotResults = await tryRetailMeNot(domain);
    if (retailMeNotResults.length > 0) {
      return retailMeNotResults;
    }
    
    // Method 2: Try fetching from coupon databases
    const dbResults = await tryCouponDatabases(domain);
    if (dbResults.length > 0) {
      return dbResults;
    }
    
    // Method 3: Web search for coupon pages
    const webResults = await searchWeb(query);
    if (webResults.length > 0) {
      return webResults;
    }
    
    return [];
  } catch (error) {
    console.error('[Background] Fetch sources error:', error);
    return [];
  }
}

async function tryRetailMeNot(domain) {
  try {
    // Attempt to fetch from RetailMeNot API
    const response = await fetch(
      `https://www.retailmenot.com/api/v2/stores?name=${domain}`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const coupons = [];
    
    if (data.stores && data.stores.length > 0) {
      const store = data.stores[0];
      // Fetch coupons for this store
      const couponResponse = await fetch(
        `https://www.retailmenot.com/api/v2/stores/${store.id}/offers`,
        { signal: AbortSignal.timeout(3000) }
      );
      
      if (couponResponse.ok) {
        const couponData = await couponResponse.json();
        couponData.offers?.forEach(offer => {
          if (offer.code || offer.title) {
            coupons.push({
              code: offer.code || offer.title.split(' ')[0],
              discount: extractDiscount(offer.title),
              description: offer.title || '',
              conditions: [offer.description || 'Check coupon page for details'],
              link: `https://www.retailmenot.com${offer.url}`,
              expiryDate: offer.endDate || ''
            });
          }
        });
      }
    }
    
    return coupons;
  } catch (error) {
    console.error('[Background] RetailMeNot error:', error);
    return [];
  }
}

async function tryCouponDatabases(domain) {
  try {
    // Try Honey/Rakuten-like APIs or direct scraping
    const cleanDomain = domain.replace('www.', '').split('.')[0];
    
    // Try fetching from couponkaCode or similar
    const response = await fetch(
      `https://api.coupon.com/search?merchant=${cleanDomain}&limit=10`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const coupons = [];
    
    data.coupons?.forEach(coupon => {
      if (coupon.code) {
        coupons.push({
          code: coupon.code,
          discount: coupon.discount || 'Special Offer',
          description: coupon.description || coupon.title,
          conditions: coupon.restrictions || [],
          link: coupon.offerUrl || '',
          expiryDate: coupon.expirationDate || ''
        });
      }
    });
    
    return coupons;
  } catch (error) {
    console.error('[Background] Coupon databases error:', error);
    return [];
  }
}

async function searchWeb(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    
    // Fetch from Bing which allows scraping better than Google
    const response = await fetch(
      `https://www.bing.com/search?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const coupons = parseSearchResults(html);
    
    return coupons;
  } catch (error) {
    console.error('[Background] Web search error:', error);
    return [];
  }
}

function parseSearchResults(html) {
  try {
    const coupons = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for coupon-related links and text
    const links = doc.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      
      // Look for coupon keywords
      if (text.match(/coupon|code|promo|discount/i) && href.length > 0) {
        // Extract coupon code if possible
        const codeMatch = text.match(/([A-Z0-9]{4,20})/);
        const discountMatch = text.match(/([\d]+%\s*off|save\s*\$[\d]+)/i);
        
        if (codeMatch) {
          coupons.push({
            code: codeMatch[1],
            discount: discountMatch ? discountMatch[1] : 'Special Offer',
            description: text.substring(0, 100),
            conditions: [],
            link: href,
            expiryDate: ''
          });
        }
      }
    });
    
    // Remove duplicates
    const uniqueCoupons = [];
    const seen = new Set();
    
    coupons.forEach(coupon => {
      if (!seen.has(coupon.code)) {
        seen.add(coupon.code);
        uniqueCoupons.push(coupon);
      }
    });
    
    return uniqueCoupons.slice(0, 5); // Return top 5
  } catch (error) {
    console.error('[Background] Parse error:', error);
    return [];
  }
}

function extractDiscount(text) {
  if (!text) return 'Special Offer';
  
  // Look for percentage
  const percentMatch = text.match(/([\d]+)%\s*off/i);
  if (percentMatch) return `${percentMatch[1]}% OFF`;
  
  // Look for dollar amount
  const dollarMatch = text.match(/save\s*\$?([\d]+)/i);
  if (dollarMatch) return `Save $${dollarMatch[1]}`;
  
  // Look for free shipping
  if (text.match(/free\s+shipping/i)) return 'FREE SHIPPING';
  
  return 'Special Offer';
}

console.log('[Background] Service worker loaded');
