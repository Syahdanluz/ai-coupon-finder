/**
 * Alternative AI Providers Module
 * Support for multiple AI APIs and search engines
 */

export class AIProviderFactory {
  static create(provider, config = {}) {
    switch (provider.toLowerCase()) {
      case 'google':
        return new GoogleSearchProvider(config);
      case 'bing':
        return new BingSearchProvider(config);
      case 'duckduckgo':
        return new DuckDuckGoProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      default:
        return new GoogleSearchProvider(config);
    }
  }
}

class BaseAIProvider {
  constructor(config = {}) {
    this.config = config;
    this.timeout = config.timeout || 10000;
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async search(query) {
    throw new Error('search() must be implemented');
  }
}

class GoogleSearchProvider extends BaseAIProvider {
  async search(query) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.fetchWithTimeout(
        `https://www.google.com/search?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (!response.ok) throw new Error('Google Search failed');
      
      const html = await response.text();
      return this.parseResults(html);
    } catch (error) {
      console.error('[GoogleSearchProvider] Error:', error);
      return [];
    }
  }

  parseResults(html) {
    const results = [];
    const parser = new DOMParser();
    
    try {
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a');
      
      links.forEach(link => {
        const text = link.textContent.toLowerCase();
        if (text.includes('coupon') || text.includes('promo') || text.includes('discount')) {
          results.push({
            title: link.textContent,
            url: link.href,
            snippet: link.parentElement?.textContent || ''
          });
        }
      });
    } catch (error) {
      console.error('[GoogleSearchProvider] Parse error:', error);
    }
    
    return results;
  }
}

class BingSearchProvider extends BaseAIProvider {
  async search(query) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.fetchWithTimeout(
        `https://www.bing.com/search?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (!response.ok) throw new Error('Bing Search failed');
      
      const html = await response.text();
      return this.parseResults(html);
    } catch (error) {
      console.error('[BingSearchProvider] Error:', error);
      return [];
    }
  }

  parseResults(html) {
    // Similar to Google but adapted for Bing's HTML structure
    return new GoogleSearchProvider().parseResults(html);
  }
}

class DuckDuckGoProvider extends BaseAIProvider {
  async search(query) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.fetchWithTimeout(
        `https://html.duckduckgo.com/?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (!response.ok) throw new Error('DuckDuckGo search failed');
      
      const html = await response.text();
      return this.parseResults(html);
    } catch (error) {
      console.error('[DuckDuckGoProvider] Error:', error);
      return [];
    }
  }

  parseResults(html) {
    return new GoogleSearchProvider().parseResults(html);
  }
}

class OllamaProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'mistral';
  }

  async search(query) {
    try {
      const prompt = `Find the latest coupon codes for: "${query}"
      Return a JSON array with these fields for each coupon:
      - code: the coupon code
      - discount: discount percentage or amount
      - description: brief description
      - conditions: array of conditions (min purchase, new users only, etc)
      - link: link to the coupon page
      Only return valid JSON array, no markdown formatting.`;
      
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            prompt: prompt,
            stream: false,
            temperature: 0.3 // Lower temperature for more factual results
          })
        }
      );
      
      if (!response.ok) throw new Error('Ollama request failed');
      
      const result = await response.json();
      return this.parseResults(result.response);
    } catch (error) {
      console.error('[OllamaProvider] Error:', error);
      return [];
    }
  }

  parseResults(response) {
    try {
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('[OllamaProvider] Parse error:', error);
      return [];
    }
  }
}

class OpenAIProvider extends BaseAIProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-3.5-turbo';
  }

  async search(query) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{
              role: 'user',
              content: `Find current coupon codes for: "${query}". Return as JSON array with: code, discount, description, conditions, link`
            }],
            temperature: 0.3
          })
        }
      );
      
      if (!response.ok) throw new Error('OpenAI API request failed');
      
      const result = await response.json();
      const content = result.choices[0].message.content;
      return this.parseResults(content);
    } catch (error) {
      console.error('[OpenAIProvider] Error:', error);
      return [];
    }
  }

  parseResults(response) {
    try {
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('[OpenAIProvider] Parse error:', error);
      return [];
    }
  }
}
