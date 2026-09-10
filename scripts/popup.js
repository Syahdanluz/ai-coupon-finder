// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const retryBtn = document.getElementById('retryBtn');

const websiteName = document.getElementById('websiteName');
const websiteStatus = document.getElementById('websiteStatus');
const searchState = document.getElementById('searchState');
const couponsContainer = document.getElementById('couponsContainer');
const couponsList = document.getElementById('couponsList');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');

let currentUrl = '';
let currentDomain = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
  loadSettings();
});

async function initializePopup() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab.url;
    currentDomain = new URL(tab.url).hostname;
    
    websiteName.textContent = currentDomain;
    websiteStatus.textContent = '✓ Ready';
    
    // Check if we have cached coupons
    const cached = await getCachedCoupons(currentDomain);
    if (cached) {
      displayCoupons(cached);
      websiteStatus.textContent = '📦 Cached';
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
    websiteName.textContent = 'Error';
  }
}

function setupEventListeners() {
  searchBtn.addEventListener('click', searchCoupons);
  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  retryBtn.addEventListener('click', searchCoupons);
}

async function searchCoupons() {
  if (!currentDomain) {
    showError('Unable to detect website');
    return;
  }
  
  showLoading();
  websiteStatus.textContent = '🔍 Searching...';
  
  try {
    // Get settings
    const settings = await getSettings();
    
    // Call background script to fetch coupons
    const coupons = await chrome.runtime.sendMessage({
      action: 'fetchCoupons',
      domain: currentDomain,
      url: currentUrl,
      aiProvider: settings.aiProvider,
      ollamaUrl: settings.ollamaUrl
    });
    
    if (coupons && coupons.length > 0) {
      // Cache the results
      if (settings.enableCache) {
        await cacheCoupons(currentDomain, coupons);
      }
      displayCoupons(coupons);
      websiteStatus.textContent = '✓ Found ' + coupons.length;
    } else {
      showEmpty();
      websiteStatus.textContent = '○ None found';
    }
  } catch (error) {
    console.error('Error searching coupons:', error);
    showError(error.message || 'Failed to search for coupons');
    websiteStatus.textContent = '✕ Error';
  }
}

function displayCoupons(coupons) {
  couponsList.innerHTML = '';
  couponsContainer.style.display = 'block';
  searchState.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
  
  coupons.forEach((coupon, index) => {
    const card = createCouponCard(coupon, index);
    couponsList.appendChild(card);
  });
}

function createCouponCard(coupon, index) {
  const card = document.createElement('div');
  card.className = 'coupon-card';
  
  const conditions = coupon.conditions || [];
  const conditionsHTML = conditions.map(c => `<span class="condition-tag">${c}</span>`).join('');
  
  const discount = coupon.discount ? `<span class="coupon-badge">${coupon.discount}</span>` : '';
  
  card.innerHTML = `
    <div class="coupon-header">
      <span class="coupon-code">${coupon.code}</span>
      ${discount}
    </div>
    <div class="coupon-description">${coupon.description || ''}</div>
    ${conditions.length > 0 ? `<div class="coupon-conditions">${conditionsHTML}</div>` : ''}
    <div class="coupon-actions">
      <button class="btn-copy" data-code="${coupon.code}" data-index="${index}">📋 Copy</button>
      ${coupon.link ? `<button class="btn-link" data-link="${coupon.link}">🔗 Details</button>` : ''}
    </div>
  `;
  
  // Copy button
  const copyBtn = card.querySelector('.btn-copy');
  copyBtn.addEventListener('click', () => copyCouponCode(coupon.code, copyBtn));
  
  // Link button
  const linkBtn = card.querySelector('.btn-link');
  if (linkBtn) {
    linkBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: coupon.link });
    });
  }
  
  return card;
}

function copyCouponCode(code, button) {
  navigator.clipboard.writeText(code).then(() => {
    const original = button.textContent;
    button.textContent = '✓ Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function showLoading() {
  searchState.style.display = 'flex';
  couponsContainer.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
}

function showEmpty() {
  searchState.style.display = 'none';
  couponsContainer.style.display = 'none';
  emptyState.style.display = 'flex';
  errorState.style.display = 'none';
}

function showError(message) {
  searchState.style.display = 'none';
  couponsContainer.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'flex';
  errorMessage.textContent = message;
}

// Settings
function openSettings() {
  settingsModal.style.display = 'flex';
}

function closeSettings() {
  settingsModal.style.display = 'none';
}

function loadSettings() {
  chrome.storage.sync.get([
    'aiProvider',
    'ollamaUrl',
    'enableCache',
    'autoSearch'
  ], (result) => {
    document.getElementById('aiProviderSelect').value = result.aiProvider || 'google';
    document.getElementById('ollamaUrlInput').value = result.ollamaUrl || 'http://localhost:11434';
    document.getElementById('cacheToggle').checked = result.enableCache !== false;
    document.getElementById('autoSearchToggle').checked = result.autoSearch || false;
  });
}

function saveSettings() {
  const settings = {
    aiProvider: document.getElementById('aiProviderSelect').value,
    ollamaUrl: document.getElementById('ollamaUrlInput').value,
    enableCache: document.getElementById('cacheToggle').checked,
    autoSearch: document.getElementById('autoSearchToggle').checked
  };
  
  chrome.storage.sync.set(settings, () => {
    closeSettings();
    // Show confirmation
    const saveBtn = saveSettingsBtn;
    const original = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      saveBtn.textContent = original;
    }, 2000);
  });
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([
      'aiProvider',
      'ollamaUrl',
      'enableCache',
      'autoSearch'
    ], (result) => {
      resolve({
        aiProvider: result.aiProvider || 'google',
        ollamaUrl: result.ollamaUrl || 'http://localhost:11434',
        enableCache: result.enableCache !== false,
        autoSearch: result.autoSearch || false
      });
    });
  });
}

// Caching
function getCachedCoupons(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get(`coupons_${domain}`, (result) => {
      const cached = result[`coupons_${domain}`];
      if (cached && cached.timestamp > Date.now() - (24 * 60 * 60 * 1000)) {
        resolve(cached.coupons);
      } else {
        resolve(null);
      }
    });
  });
}

function cacheCoupons(domain, coupons) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [`coupons_${domain}`]: {
        coupons: coupons,
        timestamp: Date.now()
      }
    }, resolve);
  });
}
