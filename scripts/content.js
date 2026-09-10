/**
 * Content Script
 * Injected into web pages to detect when user visits an e-commerce site
 */

// List of known e-commerce domains
const ECOMMERCE_DOMAINS = [
  'shopee.com', 'shopee.co.id', 'shopee.sg', 'shopee.ph',
  'lazada.com', 'lazada.co.id', 'lazada.sg',
  'tokopedia.com',
  'bukalapak.com',
  'blibli.com',
  'amazon.com', 'amazon.co.id', 'amazon.sg',
  'ebay.com',
  'aliexpress.com',
  'wish.com',
  'shein.com',
  'uniqlo.com',
  'h&m.com',
  'zara.com'
];

// Notify popup that we're on an e-commerce site
function detectEcommerceSite() {
  const hostname = window.location.hostname;
  
  const isEcommerce = ECOMMERCE_DOMAINS.some(domain => 
    hostname.includes(domain)
  );
  
  if (isEcommerce) {
    chrome.runtime.sendMessage({
      action: 'ecommerceDetected',
      domain: hostname,
      url: window.location.href
    }).catch(err => {
      // Extension context invalidated, ignore
      console.log('[Content Script] Extension context:', err);
    });
  }
}

// Run on page load
detectEcommerceSite();

// Also run when page changes (SPA navigation)
window.addEventListener('hashchange', detectEcommerceSite);
window.addEventListener('popstate', detectEcommerceSite);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname
    });
  }
});

console.log('[Content Script] Loaded and ready');
