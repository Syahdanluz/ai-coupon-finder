# AI Coupon Finder

🎟️ A browser extension that finds available coupons on e-commerce websites using AI without switching tabs.

## Features

✨ **Smart Coupon Discovery**
- Automatically detects when you visit e-commerce sites
- Uses AI/search engines to find current coupon codes
- Client-side processing for privacy and performance

📋 **Beautiful UI**
- Sleek popup with scrollable coupon list
- Shows coupon codes, discounts, and conditions
- One-click copy and redirect functionality

⚡ **Performance Optimized**
- 24-hour coupon caching to reduce API calls
- Intelligent rate limiting
- Lazy loading for smooth experience

🔧 **Flexible AI Options**
- Google Search integration
- Bing Search support
- DuckDuckGo integration
- Local AI (Ollama) for privacy-first users

## Installation

### Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm permissions

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `ai-coupon-finder` folder

## Usage

1. **Visit any e-commerce website** (Shopee, Lazada, Amazon, etc.)
2. **Click the extension icon** in your toolbar
3. **Click "Search for Coupons"** button
4. **View the coupon list** that appears
5. **Copy coupon code** with one click
6. **Follow link** to coupon details page (optional)

## Supported E-commerce Sites

- 🛍️ Shopee (all regions)
- 🛍️ Lazada (all regions)
- 🛍️ Tokopedia
- 🛍️ Bukalapak
- 🛍️ Blibli
- 🛍️ Amazon
- 🛍️ eBay
- 🛍️ AliExpress
- 🛍️ Wish
- 🛍️ Shein
- 🛍️ Uniqlo
- 🛍️ H&M
- 🛍️ Zara
- And more...

## Settings

⚙️ **AI Provider**: Choose between Google, Bing, DuckDuckGo, or local Ollama

💾 **Coupon Caching**: Enable 24-hour cache to reduce API calls

🔄 **Auto-search**: Automatically search for coupons when opening extension

## How It Works

```
┌─────────────────────────────────────────┐
│  User opens e-commerce site              │
│  e.g., shopee.com                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  User clicks extension icon              │
│  Popup opens                             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Extension detects website               │
│  Checks cache for existing coupons       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Sends query to AI/Search engine:        │
│  "shopee coupon codes 2024"              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  AI parses results:                      │
│  - Extract coupon codes                  │
│  - Find discounts & conditions           │
│  - Validate data                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Display in beautiful popup UI           │
│  - Scrollable list                       │
│  - One-click copy                        │
│  - Redirect to source                    │
└─────────────────────────────────────────┘
```

## Architecture

```
📁 ai-coupon-finder/
├── 📄 manifest.json          # Extension configuration
├── 📂 scripts/
│   ├── popup.js              # UI logic and interactions
│   ├── background.js         # Background service worker
│   └── content.js            # Website detection
├── 📂 styles/
│   └── popup.css             # Modern, responsive UI
├── 📂 utils/
│   ├── ai-integration.js     # AI/Search engine APIs
│   ├── coupon-parser.js      # Coupon extraction logic
│   ├── advanced-parser.js    # Advanced parsing with patterns
│   ├── validators.js         # Data validation
│   └── performance.js        # Caching and optimization
├── 📂 assets/
│   └── icons/                # Extension icons
└── 📄 README.md              # This file
```

## Data Privacy

🔒 **Your privacy matters**

- Extension runs primarily on your device (client-side)
- Optional: Use local Ollama AI for 100% offline operation
- Only sends domain name to search engines (no personal data)
- Coupons are cached locally in your browser
- No tracking or analytics

## Performance Tips

1. **Enable Caching**: Reduces API calls and speeds up subsequent searches
2. **Use Local AI**: If you want complete privacy, set up Ollama
3. **Clear Old Cache**: Periodically clear cached coupons to refresh results

## Development

### Setup
```bash
git clone https://github.com/Syahdanluz/ai-coupon-finder.git
cd ai-coupon-finder
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the folder

### Testing
1. Visit a supported e-commerce site
2. Click extension icon
3. Check browser console for logs (Ctrl+Shift+J)
4. Verify coupons display correctly

## Roadmap

- [ ] Support for more e-commerce sites
- [ ] Firefox extension version
- [ ] Safari extension version
- [ ] Price tracking integration
- [ ] Coupon notifications
- [ ] User community ratings
- [ ] Browser sync across devices
- [ ] Advanced filtering options

## Troubleshooting

### No coupons found?
- Ensure you're on a supported e-commerce site
- Try clicking "Retry" in the error message
- Check if the website is working normally
- Try a different AI provider in settings

### Extension not working?
- Refresh the webpage (Ctrl+R)
- Remove and re-add the extension
- Check extension permissions
- Clear browser cache and try again

### Local AI (Ollama) not connecting?
- Ensure Ollama is running: `ollama serve`
- Check that Ollama URL is correct in settings
- Default URL: `http://localhost:11434`
- Verify firewall allows local connections

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

Encountered an issue? Have a suggestion?

📧 Email: support@coupon-finder.dev
🐛 Issues: [GitHub Issues](https://github.com/Syahdanluz/ai-coupon-finder/issues)
💬 Discussions: [GitHub Discussions](https://github.com/Syahdanluz/ai-coupon-finder/discussions)

## License

MIT License - see LICENSE file for details

## Disclaimer

This extension is provided as-is for educational purposes. Users are responsible for:
- Verifying coupon validity before use
- Complying with website terms of service
- Ensuring compliance with local laws and regulations

## Credits

Built with ❤️ by the AI Coupon Finder team

---

**Made with ❤️ to help you save money on online shopping**
