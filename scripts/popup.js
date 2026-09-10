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
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
  setupEventListeners();
  loadSettings();
});

function initializePopup() {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        const tab = tabs[0];
        currentUrl = tab.url;
        currentDomain = new URL(tab.url).hostname;
        
        websiteName.textContent = currentDomain;
        websiteStatus.textContent = '✓ Ready';
      }
    });
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

function searchCoupons() {
  if (!currentDomain) {
    showError('Unable to detect website');
    return;
  }
  
  showLoading();
  websiteStatus.textContent = '🔍 Searching...';
  
  // Send message to background script with a timeout
  chrome.runtime.sendMessage({
    action: 'fetchCoupons',
    domain: currentDomain,
    url: currentUrl,
    aiProvider: 'google'
  }, (response) => {
    // Check for errors
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      showError('Error: ' + chrome.runtime.lastError.message);
      websiteStatus.textContent = '✕ Error';
      return;
    }
    
    if (!response) {
      console.error('No response from background');
      showError('No response from extension');
      websiteStatus.textContent = '✕ Error';
      return;
    }
    
    if (response.error) {
      console.error('Background error:', response.error);
      showError(response.error);
      websiteStatus.textContent = '✕ Error';
      return;
    }
    
    // Success - display coupons
    const coupons = response;
    if (coupons && coupons.length > 0) {
      displayCoupons(coupons);
      websiteStatus.textContent = '✓ Found ' + coupons.length;
    } else {
      showEmpty();
      websiteStatus.textContent = '∘ None found';
    }
  });
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
