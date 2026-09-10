# Development Guide

## Setup Instructions

### Prerequisites
- Chrome/Chromium browser (version 88+)
- Git
- Basic JavaScript knowledge
- (Optional) Ollama for local AI testing

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Syahdanluz/ai-coupon-finder.git
cd ai-coupon-finder
```

2. **Load into Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `ai-coupon-finder` folder

3. **Test the extension**
   - Visit any e-commerce website (Shopee, Lazada, Amazon, etc.)
   - Click the extension icon
   - Click "Search for Coupons"
   - Check console for logs: `Ctrl+Shift+J`

## Project Structure

```
ai-coupon-finder/
├── manifest.json              # Extension configuration
├── popup.html                 # Main UI
├── scripts/
│   ├── popup.js              # UI logic and state management
│   ├── background.js         # Service worker - handles coupon fetching
│   └── content.js            # Content script - detects e-commerce sites
├── styles/
│   └── popup.css             # Beautiful responsive UI styling
├── utils/
│   ├── ai-integration.js     # AI provider integration
│   ├── ai-providers.js       # Multiple AI provider implementations
│   ├── coupon-parser.js      # Basic coupon parsing
│   ├── advanced-parser.js    # Advanced pattern-based parsing
│   ├── performance.js        # Caching and rate limiting
│   └── validators.js         # Data validation and sanitization
├── package.json              # Project metadata
├── README.md                 # User documentation
└── DEVELOPMENT.md            # This file
```

## Key Components Explained

### 1. Manifest.json
Defines extension metadata, permissions, and entry points.

**Important permissions:**
- `activeTab` - Access current tab information
- `scripting` - Inject content scripts
- `storage` - Local coupon caching
- `<all_urls>` - Access all websites

### 2. Content Script (`content.js`)
- Runs on every webpage
- Detects e-commerce sites from hardcoded domain list
- Notifies background worker when user visits supported sites
- Lightweight to avoid performance impact

### 3. Background Worker (`background.js`)
- Service worker (runs in background)
- Handles coupon fetching and parsing
- Communicates with popup via `chrome.runtime.sendMessage`
- Main orchestration logic

### 4. Popup (`popup.html` + `popup.js`)
- User-facing interface
- Shows coupon list in beautiful card format
- Handles copy-to-clipboard functionality
- Settings modal for AI provider selection

### 5. AI Integration (`ai-integration.js` + `ai-providers.js`)
- Abstracts different AI/search providers
- Factory pattern for provider selection
- Supports: Google, Bing, DuckDuckGo, Ollama, OpenAI
- Fallback to Google if provider fails

### 6. Coupon Parser (`coupon-parser.js` + `advanced-parser.js`)
- Extracts structured data from raw AI results
- Pattern matching for codes, discounts, conditions
- Validates extracted data
- Deduplicates coupons

### 7. Performance (`performance.js`)
- `CouponCache` - 24-hour local caching
- `RateLimiter` - Prevents API spam
- `LazyLoader` - Smooth loading experience

## Data Flow

```
User Opens E-commerce Site
         ↓
   Content Script Detects
         ↓
   User Clicks Extension Icon
         ↓
   Popup.js Loads & Checks Cache
         ↓
   User Clicks "Search for Coupons"
         ↓
   Popup Sends Message to Background
         ↓
   Background.js Selects AI Provider
         ↓
   AI Provider Searches (Google/Bing/Ollama/etc)
         ↓
   AI Results Parsed by CouponParser
         ↓
   Validated & Enriched
         ↓
   Cached Locally (24 hours)
         ↓
   Popup Displays Beautiful UI
         ↓
   User Copies Code or Clicks Details Link
```

## Adding Support for New E-commerce Sites

### Step 1: Add domain to content.js
```javascript
const ECOMMERCE_DOMAINS = [
  'shopee.com',
  'your-site.com',  // Add here
  ...
];
```

### Step 2: Test
- Visit the website
- Extension should detect it
- Search for coupons

## Implementing a Custom AI Provider

### Step 1: Create provider class in `ai-providers.js`
```javascript
class CustomAIProvider extends BaseAIProvider {
  async search(query) {
    try {
      const response = await this.fetchWithTimeout(
        'your-api-endpoint',
        { /* options */ }
      );
      
      if (!response.ok) throw new Error('Request failed');
      
      const result = await response.json();
      return this.parseResults(result);
    } catch (error) {
      console.error('[CustomAIProvider] Error:', error);
      return [];
    }
  }

  parseResults(response) {
    // Transform to coupon format
    return [];
  }
}
```

### Step 2: Register in factory
```javascript
static create(provider, config = {}) {
  switch (provider.toLowerCase()) {
    case 'custom':
      return new CustomAIProvider(config);
    // ...
  }
}
```

### Step 3: Add to settings
Update the `aiProviderSelect` dropdown in `popup.html`

## Testing

### Manual Testing
1. Load extension in Chrome
2. Visit supported e-commerce site
3. Click extension icon
4. Click "Search for Coupons"
5. Verify coupons display
6. Test copy functionality
7. Test redirect links

### Console Debugging
```javascript
// Open DevTools: Ctrl+Shift+J
// Check console for logs from:
// - [Content Script] messages
// - [Background] messages
// - [AI Integration] messages
// - [GoogleSearchProvider] etc.
```

### Testing Different Providers
1. Click settings icon (⚙️)
2. Select different AI provider
3. Save settings
4. Test search again

### Testing Local Ollama
1. Install Ollama: https://ollama.ai
2. Run: `ollama serve`
3. In extension settings, select "Local AI (Ollama)"
4. Verify URL: `http://localhost:11434`
5. Test search

## Common Issues & Solutions

### Extension not loading
- **Issue**: "Cannot find manifest.json"
- **Solution**: Ensure you're loading the `ai-coupon-finder` folder, not a subfolder

### No coupons found
- **Issue**: Empty results on supported sites
- **Solution**: 
  - Check browser console (Ctrl+Shift+J)
  - Verify AI provider is responding
  - Try different provider in settings
  - Check if website structure changed

### Rate limiting errors
- **Issue**: "Too many requests"
- **Solution**: 
  - Wait a few minutes before retrying
  - Rate limiter is set to 5 requests/minute
  - Check cache is enabled

### Ollama connection fails
- **Issue**: "Failed to connect to Ollama"
- **Solution**:
  - Verify Ollama is running: `ollama serve`
  - Check URL in settings: `http://localhost:11434`
  - Check firewall allows localhost connections
  - Verify `mistral` model is installed: `ollama pull mistral`

## Performance Optimization Tips

### 1. Caching Strategy
- 24-hour cache enabled by default
- Cached results shown immediately
- Fresh search still available via "Search for Coupons" button

### 2. Lazy Loading
- Coupons load in batches of 3
- 500ms delay between batches
- Prevents UI freezing

### 3. Rate Limiting
- Maximum 5 requests per minute per domain
- Protects against accidental spam
- Queue for waiting requests

### 4. Code Optimization
- Minimal DOM operations
- Event delegation where possible
- Efficient regex patterns
- No unnecessary dependencies

## Contributing Guidelines

### Code Style
- Use ES6+ syntax
- No external dependencies (keep it lightweight)
- Add comments for complex logic
- Use descriptive variable names

### Commit Messages
- Use descriptive titles
- Example: "Add support for Shein coupons"
- Include issue number if applicable: "Fix #42"

### Pull Request Process
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with clear commits
4. Push to branch: `git push origin feature/amazing-feature`
5. Open pull request with description
6. Address review feedback
7. Merge when approved

## Debugging Tips

### 1. Enable Verbose Logging
Add to relevant files:
```javascript
chrome.storage.sync.set({ debug: true });
// Then in code:
if (debug) console.log('[Component] Message');
```

### 2. Inspect Cached Data
```javascript
// Open DevTools Console
chrome.storage.local.get(null, (result) => {
  console.log('Storage:', result);
});
```

### 3. Test Background Worker
```javascript
// In DevTools console on background worker:
chrome.runtime.sendMessage({
  action: 'fetchCoupons',
  domain: 'shopee.com',
  url: 'https://shopee.com',
  aiProvider: 'google'
}, response => console.log('Response:', response));
```

## Future Enhancements

- [ ] Add unit tests (Jest/Vitest)
- [ ] Add e2e tests (Playwright)
- [ ] Implement proper error tracking
- [ ] Add analytics (privacy-respecting)
- [ ] Build Chrome Web Store package
- [ ] Create Firefox version
- [ ] Add price tracking
- [ ] Implement user ratings system
- [ ] Add browser sync

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Ollama Documentation](https://github.com/ollama/ollama)

## Support

Have questions? 
- Check existing [GitHub Issues](https://github.com/Syahdanluz/ai-coupon-finder/issues)
- Read [Discussions](https://github.com/Syahdanluz/ai-coupon-finder/discussions)
- Create new issue with detailed description

---

**Happy coding! 🚀**
