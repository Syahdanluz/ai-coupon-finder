// Background Service Worker
import { fetchCouponsFromAI } from './utils/ai-integration.js';
import { parseWebsiteForCoupons } from './utils/coupon-parser.js';
import { validateCoupon, sanitizeURL } from './utils/validators.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCoupons') {
    handleCouponFetch(request, sender)
      .then(coupons => sendResponse(coupons))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function handleCouponFetch(request, sender) {
  const { domain, url, aiProvider, ollamaUrl } = request;
  
  console.log(`[Background] Fetching coupons for: ${domain}`);
  
  try {
    // Step 1: Fetch raw data from AI/Search
    const aiResults = await fetchCouponsFromAI({
      domain,
      url,
      aiProvider,
      ollamaUrl
    });
    
    console.log(`[Background] AI returned ${aiResults.length} results`);
    
    // Step 2: Parse and validate results
    const parsedCoupons = parseWebsiteForCoupons(aiResults, domain);
    
    console.log(`[Background] Parsed ${parsedCoupons.length} coupons`);
    
    // Step 3: Validate and enrich coupons
    const validatedCoupons = parsedCoupons
      .filter(c => validateCoupon(c))
      .map(c => enrichCoupon(c, domain));
    
    console.log(`[Background] Validated ${validatedCoupons.length} coupons`);
    
    return validatedCoupons;
  } catch (error) {
    console.error('[Background] Error fetching coupons:', error);
    throw new Error(`Failed to fetch coupons: ${error.message}`);
  }
}

function enrichCoupon(coupon, domain) {
  return {
    code: coupon.code || '',
    discount: coupon.discount || '',
    description: coupon.description || '',
    conditions: coupon.conditions || [],
    link: sanitizeURL(coupon.link) || '',
    expiryDate: coupon.expiryDate || '',
    source: domain,
    fetchedAt: new Date().toISOString()
  };
}
