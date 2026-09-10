/**
 * Background Service Worker
 * Handles coupon fetching and processing
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCoupons') {
    // Return coupons immediately (synchronously)
    const coupons = getCouponData();
    sendResponse(coupons);
  }
});

function getCouponData() {
  // Return demo coupons immediately - no async/await
  return [
    {
      code: 'SAVE20',
      discount: '20% OFF',
      description: 'Save 20% on your order - Limited time offer',
      conditions: ['Min. purchase 100K', 'New users only'],
      link: 'https://example.com/coupon/save20',
      expiryDate: '2024-12-31'
    },
    {
      code: 'FREESHIP',
      discount: 'FREE SHIPPING',
      description: 'Free shipping on all orders above minimum purchase',
      conditions: ['Min. purchase 50K', 'Limited time'],
      link: 'https://example.com/coupon/freeship',
      expiryDate: '2024-12-25'
    },
    {
      code: 'WELCOME50',
      discount: '50K OFF',
      description: 'Welcome discount for new users on first order',
      conditions: ['New users only', 'First order only'],
      link: 'https://example.com/coupon/welcome50',
      expiryDate: '2024-12-30'
    },
    {
      code: 'SUMMER25',
      discount: '25% OFF',
      description: 'Summer sale - Save 25% on selected items',
      conditions: ['Selected items only', 'Limited time'],
      link: 'https://example.com/coupon/summer25',
      expiryDate: '2024-12-28'
    },
    {
      code: 'FLASH10',
      discount: '10K OFF',
      description: 'Flash sale discount on fashion category',
      conditions: ['Fashion category', 'Min. purchase 75K'],
      link: 'https://example.com/coupon/flash10',
      expiryDate: '2024-12-20'
    }
  ];
}

console.log('[Background] Service worker loaded and ready');
