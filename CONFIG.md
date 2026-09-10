# Configuration Guide

## Extension Settings

### AI Provider Selection

#### Google Search (Default)
- ✅ **Pros**: Fast, reliable, most results
- ❌ **Cons**: May detect bot traffic, no API needed
- 🔧 **Setup**: No configuration needed

#### Bing Search
- ✅ **Pros**: Alternative to Google, good results
- ❌ **Cons**: Similar to Google search
- 🔧 **Setup**: No configuration needed

#### DuckDuckGo
- ✅ **Pros**: Privacy-focused
- ❌ **Cons**: Fewer results than Google
- 🔧 **Setup**: No configuration needed

#### Local AI (Ollama) - Recommended for Privacy
- ✅ **Pros**: 100% offline, private, no API keys
- ❌ **Cons**: Requires Ollama installation, slower
- 🔧 **Setup**:
  1. Install Ollama: https://ollama.ai
  2. Run: `ollama serve`
  3. In extension settings:
     - Select "Local AI (Ollama)"
     - URL: `http://localhost:11434`
     - Click Save
  4. Extension will use local AI for searches

#### OpenAI (Future)
- ✅ **Pros**: Most accurate results
- ❌ **Cons**: Requires API key, costs money
- 🔧 **Setup**: Coming in v2.0

### Cache Settings

**Enable Coupon Caching (24 hours)**
- Stores found coupons locally
- Reduces API calls
- Shows cached results immediately on next visit
- Improves performance
- No data leaves your device

### Auto-Search

**Auto-search when opening extension**
- Automatically searches for coupons when you click the extension icon
- No need to click "Search for Coupons" button
- Useful for frequent shoppers
- Can be disabled if preferred

## Storage Usage

### Local Storage
- Coupon cache: ~5-10 KB per site
- Max cache size: 10 MB (Chrome limit)
- Auto-cleanup after 24 hours

### Chrome Storage
- Settings: ~1 KB
- Syncs across Chrome devices (if you enable sync)

## Privacy

### What We Collect
- ❌ **Nothing**: We don't collect any data
- ❌ **No Tracking**: No analytics or tracking
- ❌ **No Accounts**: No user accounts or login

### What's Stored Locally
- ✅ Coupon codes you've found
- ✅ Your extension settings
- ✅ Preferences (AI provider, cache enabled, etc.)

### Data Transmission
- When using search engines (Google/Bing/DuckDuckGo):
  - Only sends: domain name (e.g., "shopee")
  - Does NOT send: personal data, browsing history
- When using local Ollama:
  - No data leaves your computer
  - All processing is local

## Performance Tips

### 1. Use Caching
- Enable cache in settings
- Reduces API calls by 90%
- Coupons load instantly from cache

### 2. Use Local AI
- If you visit same sites regularly
- Ollama is faster after first run
- Zero privacy concerns

### 3. Clear Old Cache
- Manually clear cache every month
- Ensures fresh coupon data
- Right-click extension → Options → Clear Cache (future feature)

## Troubleshooting

### Settings Not Saving
- Issue: Settings revert after refresh
- Solution: Check if Chrome sync is enabled
- Try: Clear Chrome cache and reload extension

### Extension Slow
- Issue: Takes long to search
- Cause: AI provider is slow
- Solution: 
  - Try different provider
  - Enable caching
  - Use Ollama locally

### Too Many Requests Error
- Issue: "Rate limited" message
- Cause: Searched too many times quickly
- Solution: Wait 1 minute before retrying

### Ollama Connection Failed
- Issue: Can't connect to local AI
- Cause: Ollama not running or wrong URL
- Solution:
  1. Ensure Ollama is running: `ollama serve`
  2. Check URL is `http://localhost:11434`
  3. Verify firewall allows localhost

## Advanced Configuration

### Custom Ollama URL
If running Ollama on different machine:
1. Open extension settings
2. Change Ollama URL to: `http://your-ip:11434`
3. Ensure network allows connection
4. Test with search

### Custom AI Model
To use different Ollama model:
1. In `utils/ai-providers.js`, line ~101
2. Change: `model: 'mistral'` to your model
3. Reload extension
4. Ensure model is installed: `ollama pull model-name`

### Multiple Profiles
Chrome allows multiple profiles:
1. Each profile has independent settings
2. Extensions load for each profile
3. Useful for different configurations

## API Rate Limits

### Search Engines
- Google: ~1000 requests/day (soft limit)
- Bing: Similar to Google
- DuckDuckGo: No strict limit

### Built-in Limiters
- Extension limits: 5 requests/minute per site
- Prevents accidental spam
- Auto-queues requests

## Browser Compatibility

### Fully Supported
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ✅ Vivaldi

### Partial Support (Coming Soon)
- ⏳ Firefox
- ⏳ Safari

## Updating

### Auto-Update
- Chrome automatically updates extensions
- No action needed

### Manual Update
1. Open `chrome://extensions/`
2. Look for "AI Coupon Finder"
3. Click update if available
4. Or reload: Click refresh icon

## Uninstalling

### Remove Extension
1. Open `chrome://extensions/`
2. Find "AI Coupon Finder"
3. Click "Remove"
4. Confirm deletion

### Clear Local Data
- Extension data is automatically deleted
- Cached coupons are removed
- Settings are reset

---

**Questions?** Check [README.md](README.md) or [DEVELOPMENT.md](DEVELOPMENT.md)
