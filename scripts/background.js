/**
 * Background Service Worker
 * Fetches REAL coupons from multiple sources including Cuponation.co.id
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
    
    // Fetch from multiple sources
    const coupons = await searchForCoupons(searchQuery, cleanDomain, domain);
    
    return coupons;
  } catch (error) {
    console.error('[Background] Error:', error);
    return [];
  }
}

async function searchForCoupons(query, cleanDomain, fullDomain) {
  try {
    // Try all sources in parallel for speed
    const sources = await Promise.all([
      tryCuponationID(cleanDomain),
      tryRetailMeNot(fullDomain),
      tryCouponDatabases(cleanDomain),
      searchWeb(query)
    ]);
    
    // Combine and deduplicate results
    let allCoupons = sources.flat();
    
    // Remove duplicates
    const uniqueCoupons = [];
    const seen = new Set();
    
    allCoupons.forEach(coupon => {
      if (!seen.has(coupon.code)) {
        seen.add(coupon.code);
        uniqueCoupons.push(coupon);
      }
    });
    
    return uniqueCoupons.slice(0, 10); // Return top 10
  } catch (error) {
    console.error('[Background] Search error:', error);
    return [];
  }
}

async function tryCuponationID(domain) {
  try {
    console.log(`[Background] Fetching from Cuponation.co.id for: ${domain}`);
    
    // Cuponation.co.id search - try multiple approaches
    const coupons = [];
    
    // Approach 1: Direct fetch from Cuponation store page
    try {
      const storeResponse = await fetch(
        `https://www.cuponation.co.id/search?q=${domain}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(4000)
        }
      );
      
      if (storeResponse.ok) {
        const html = await storeResponse.text();
        const cuponationCoupons = parseCuponationPage(html, domain);
        coupons.push(...cuponationCoupons);
        console.log(`[Background] Found ${cuponationCoupons.length} coupons from Cuponation`);
      }
    } catch (err) {
      console.error('[Background] Cuponation fetch error:', err);
    }
    
    // Approach 2: Try Cuponation store directory
    try {
      const directoryResponse = await fetch(
        `https://www.cuponation.co.id/stores`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(3000)
        }
      );
      
      if (directoryResponse.ok) {
        const html = await directoryResponse.text();
        // Look for store matching domain
        if (html.includes(domain)) {
          const storeCoupons = parseStoreDirectory(html, domain);
          coupons.push(...storeCoupons);
          console.log(`[Background] Found ${storeCoupons.length} from store directory`);
        }
      }
    } catch (err) {
      console.error('[Background] Cuponation directory error:', err);
    }
    
    return coupons;
  } catch (error) {
    console.error('[Background] Cuponation error:', error);
    return [];
  }
}

function parseCuponationPage(html, domain) {
  try {
    const coupons = [];
    const parser = new DOMParser();
    
    try {
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for coupon elements on Cuponation pages
      const couponElements = doc.querySelectorAll('[class*="coupon"], [class*="offer"], [class*="code"]');
      
      couponElements.forEach(element => {
        const text = element.textContent || '';
        const link = element.querySelector('a')?.getAttribute('href') || '';
        
        // Extract coupon code (usually all caps, 4-20 chars)
        const codeMatch = text.match(/([A-Z0-9]{4,20})/);
        if (codeMatch) {
          const code = codeMatch[1];
          const discount = extractDiscount(text);
          const description = text.substring(0, 150).trim();
          
          coupons.push({
            code: code,
            discount: discount,
            description: description,
            conditions: extractConditions(text),
            link: link || `https://www.cuponation.co.id/search?q=${domain}`,
            expiryDate: '',
            source: 'Cuponation.co.id'
          });
        }
      });
    } catch (parseErr) {
      console.error('[Background] DOM parse error:', parseErr);
    }
    
    // Also try regex-based parsing for robustness
    const codeRegex = /\b([A-Z0-9]{4,20})\b/g;
    const matches = html.match(codeRegex) || [];
    
    matches.forEach(code => {
      if (!coupons.some(c => c.code === code)) {
        const contextMatch = html.match(new RegExp(`.{0,100}${code}.{0,100}`, 'i'));
        const context = contextMatch ? contextMatch[0] : code;
        
        coupons.push({
          code: code,
          discount: extractDiscount(context),
          description: context.substring(0, 150),
          conditions: extractConditions(context),
          link: `https://www.cuponation.co.id/search?q=${code}`,
          expiryDate: '',
          source: 'Cuponation.co.id'
        });
      }
    });
    
    return coupons.slice(0, 5);
  } catch (error) {
    console.error('[Background] Cuponation parse error:', error);
    return [];
  }
}

function parseStoreDirectory(html, domain) {
  try {
    const coupons = [];
    const parser = new DOMParser();
    
    try {
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find store link
      const storeLinks = doc.querySelectorAll('a');
      let storeUrl = null;
      
      storeLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent || '';
        
        if (text.toLowerCase().includes(domain) || href.includes(domain)) {
          storeUrl = href;
        }
      });
      
      if (storeUrl) {
        return [{
          code: 'VISIT_STORE',
          discount: 'Check Store',
          description: `Visit ${domain} on Cuponation for latest offers`,
          conditions: ['Visit Cuponation for more'],
          link: storeUrl,
          expiryDate: '',
          source: 'Cuponation.co.id'
        }];
      }
    } catch (parseErr) {
      console.error('[Background] Store parse error:', parseErr);
    }
    
    return coupons;
  } catch (error) {
    console.error('[Background] Store directory parse error:', error);
    return [];
  }
}

async function tryRetailMeNot(domain) {
  try {
    const response = await fetch(
      `https://www.retailmenot.com/api/v2/stores?name=${domain}`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const coupons = [];
    
    if (data.stores && data.stores.length > 0) {
      const store = data.stores[0];
      const couponResponse = await fetch(
        `https://www.retailmenot.com/api/v2/stores/${store.id}/offers`,
        { signal: AbortSignal.timeout(3000) }
      );
      
      if (couponResponse.ok) {
        const couponData = await couponResponse.json();
        couponData.offers?.slice(0, 5).forEach(offer => {
          if (offer.code || offer.title) {
            coupons.push({
              code: offer.code || offer.title.split(' ')[0],
              discount: extractDiscount(offer.title),
              description: offer.title || '',
              conditions: [offer.description || 'Check coupon page for details'],
              link: `https://www.retailmenot.com${offer.url}`,
              expiryDate: offer.endDate || '',
              source: 'RetailMeNot'
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
    // Try multiple coupon API endpoints
    const endpoints = [
      `https://api.coupon.com/search?merchant=${domain}&limit=5`,
      `https://api.slickdeals.net/api/deals?store=${domain}&sort=popularity`,
      `https://www.dealspotr.com/api/stores/${domain}/deals`
    ];
    
    const coupons = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          signal: AbortSignal.timeout(2000)
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Parse based on endpoint type
        if (data.coupons) {
          data.coupons.forEach(coupon => {
            if (coupon.code) {
              coupons.push({
                code: coupon.code,
                discount: coupon.discount || 'Special Offer',
                description: coupon.description || coupon.title,
                conditions: coupon.restrictions || [],
                link: coupon.offerUrl || '',
                expiryDate: coupon.expirationDate || '',
                source: 'Coupon Database'
              });
            }
          });
        }
      } catch (err) {
        console.error(`[Background] Endpoint ${endpoint} error:`, err);
      }
    }
    
    return coupons;
  } catch (error) {
    console.error('[Background] Coupon databases error:', error);
    return [];
  }
}

async function searchWeb(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    
    // Search on Bing which is more lenient for web scraping
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
    
    // Regex-based parsing (more reliable than DOM for fetched content)
    const codeRegex = /\b([A-Z0-9]{4,20})\b/g;
    const codes = html.match(codeRegex) || [];
    
    // Get unique codes
    const uniqueCodes = [...new Set(codes)];
    
    uniqueCodes.slice(0, 5).forEach(code => {
      // Find context around the code
      const contextMatch = html.match(new RegExp(`.{0,100}${code}.{0,100}`, 'i'));
      const context = contextMatch ? contextMatch[0] : code;
      
      coupons.push({
        code: code,
        discount: extractDiscount(context),
        description: context.substring(0, 150).trim(),
        conditions: extractConditions(context),
        link: `https://www.bing.com/search?q=${code}`,
        expiryDate: '',
        source: 'Web Search'
      });
    });
    
    return coupons;
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
  
  // Look for currency amounts
  const amountMatch = text.match(/(?:save|off)?\s*(?:\$|Rp|₹|€|£)([\d,]+)/i);
  if (amountMatch) return `Save ${amountMatch[1]}`;
  
  // Look for free shipping
  if (text.match(/free\s+(?:shipping|delivery|ongkir)/i)) return 'FREE SHIPPING';
  
  // Look for buy X get Y
  const buyGetMatch = text.match(/(buy\s+\d+\s+get\s+\d+)/i);
  if (buyGetMatch) return buyGetMatch[1].toUpperCase();
  
  return 'Special Offer';
}

function extractConditions(text) {
  if (!text) return [];
  
  const conditions = [];
  
  // Minimum purchase
  const minMatch = text.match(/min(?:imum)?(?:\s+purchase)?:?\s*(?:\$|Rp|€)?[\s]*([\d,]+)/i);
  if (minMatch) conditions.push(`Min. purchase ${minMatch[1]}`);
  
  // New users
  if (text.match(/(?:new\s+(?:customer|user|member)|first\s+order)/i)) {
    conditions.push('New users only');
  }
  
  // Limited time
  if (text.match(/(?:limited\s+time|while\s+stock|ends?|expires?)/i)) {
    conditions.push('Limited time');
  }
  
  // Specific items
  if (text.match(/(?:selected|specific|certain|participating)/i)) {
    conditions.push('Selected items only');
  }
  
  return [...new Set(conditions)];
}

console.log('[Background] Service worker loaded - fetching from Cuponation, RetailMeNot, and web search');
