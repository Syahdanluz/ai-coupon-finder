/**
 * AI Integration Module
 * Handles communication with different AI providers/search engines
 */

export async function fetchCouponsFromAI({ domain, url, aiProvider, ollamaUrl }) {
  console.log(`[AI Integration] Using ${aiProvider} provider`);
  
  const query = generateSearchQuery(domain);
  
  switch (aiProvider) {
    case 'google':
      return fetchFromGoogleSearch(query);
    case 'bing':
      return fetchFromBingSearch(query);
    case 'duckduckgo':
      return fetchFromDuckDuckGo(query);
    case 'local':
      return fetchFromLocalAI(query, ollamaUrl);
    default:
      return fetchFromGoogleSearch(query);
  }
}

function generateSearchQuery(domain) {
  const cleanDomain = domain
    .replace('www.', '')
    .split('.')[0]
    .toLowerCase();
  
  return `${cleanDomain} coupon codes promo ${new Date().getFullYear()}`;
}

async function fetchFromGoogleSearch(query) {
  try {
    // Since we can't directly query Google from extension, we'll use a workaround
    // Open a hidden request or use an API
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.google.com/search?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('Google Search request failed');
    
    const html = await response.text();
    return parseGoogleSearchResults(html);
  } catch (error) {
    console.error('[AI Integration] Google Search error:', error);
    return [];
  }
}

async function fetchFromBingSearch(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.bing.com/search?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('Bing Search request failed');
    
    const html = await response.text();
    return parseBingSearchResults(html);
  } catch (error) {
    console.error('[AI Integration] Bing Search error:', error);
    return [];
  }
}

async function fetchFromDuckDuckGo(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://html.duckduckgo.com/?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) throw new Error('DuckDuckGo request failed');
    
    const html = await response.text();
    return parseDuckDuckGoResults(html);
  } catch (error) {
    console.error('[AI Integration] DuckDuckGo error:', error);
    return [];
  }
}

async function fetchFromLocalAI(query, ollamaUrl) {
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: `Find coupon codes for: ${query}. Return as JSON array with fields: code, discount, description, conditions, link`,
        stream: false
      })
    });
    
    if (!response.ok) throw new Error('Local AI request failed');
    
    const result = await response.json();
    return parseLocalAIResponse(result.response);
  } catch (error) {
    console.error('[AI Integration] Local AI error:', error);
    return [];
  }
}

// Parse functions for different sources
function parseGoogleSearchResults(html) {
  const results = [];
  // Parse Google HTML and extract coupon-related links and snippets
  // This is simplified - real implementation would need better parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const links = doc.querySelectorAll('a');
  links.forEach(link => {
    const text = link.textContent.toLowerCase();
    if (text.includes('coupon') || text.includes('promo')) {
      results.push({
        title: link.textContent,
        url: link.href,
        snippet: link.parentElement?.textContent || ''
      });
    }
  });
  
  return results;
}

function parseBingSearchResults(html) {
  // Similar to Google parsing
  return parseGoogleSearchResults(html);
}

function parseDuckDuckGoResults(html) {
  // Similar to Google parsing
  return parseGoogleSearchResults(html);
}

function parseLocalAIResponse(response) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('[AI Integration] Failed to parse AI response:', error);
    return [];
  }
}
