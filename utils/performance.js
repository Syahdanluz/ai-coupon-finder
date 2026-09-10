/**
 * Performance Optimization Module
 * Handles caching, rate limiting, and lazy loading
 */

export class CouponCache {
  constructor(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    this.maxAge = maxAge;
  }

  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(`cache_${key}`, (result) => {
        const cached = result[`cache_${key}`];
        
        if (cached && cached.timestamp > Date.now() - this.maxAge) {
          resolve(cached.data);
        } else {
          resolve(null);
        }
      });
    });
  }

  async set(key, data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [`cache_${key}`]: {
          data: data,
          timestamp: Date.now()
        }
      }, resolve);
    });
  }

  async clear(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(`cache_${key}`, resolve);
    });
  }

  async clearExpired() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = [];
        
        Object.entries(items).forEach(([key, value]) => {
          if (key.startsWith('cache_') && value.timestamp < Date.now() - this.maxAge) {
            keysToRemove.push(key);
          }
        });
        
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove, resolve);
        } else {
          resolve();
        }
      });
    });
  }
}

export class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  canRequest(key) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length < this.maxRequests) {
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
      return true;
    }
    
    return false;
  }

  getWaitTime(key) {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = requests[0];
    const waitTime = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }
}

export class LazyLoader {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 3;
    this.delay = 500; // ms between batches
  }

  async loadBatch(items) {
    this.queue.push(...items);
    
    if (!this.isProcessing) {
      await this.processBatch();
    }
  }

  async processBatch() {
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      // Process batch in parallel
      await Promise.all(batch.map(item => item.processor()));
      
      // Delay before next batch
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.isProcessing = false;
  }
}
