/**
 * Stock Price API Service using Finnhub
 * Free tier: 60 API calls/minute (effectively unlimited for personal use)
 * Real-time stock prices included on free tier
 * Get your free API key at: https://finnhub.io/register
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface StockQuote {
  symbol: string;
  price: number;
  currency: string;
  lastUpdated: Date;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export async function searchStockSymbol(keyword: string): Promise<StockSearchResult[]> {
  if (!FINNHUB_API_KEY) {
    console.error('FINNHUB_API_KEY is not set in environment variables');
    return [];
  }

  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(keyword)}&token=${FINNHUB_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error('Finnhub API error:', data.error);
      return [];
    }

    const results = data.result || [];
    
    // Map Finnhub response to our format
    return results.slice(0, 10).map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      type: item.type || 'Stock',
      region: item.type === 'Common Stock' ? 'US' : item.type,
      currency: 'USD', // Finnhub primarily returns USD prices
    }));
  } catch (error) {
    console.error('Failed to search stock symbol:', error);
    return [];
  }
}

export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
  if (!FINNHUB_API_KEY) {
    console.error('FINNHUB_API_KEY is not set in environment variables');
    return null;
  }

  try {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error(`Finnhub API error for ${symbol}:`, data.error);
      return null;
    }

    // Finnhub returns { c: current_price, h: high, l: low, o: open, pc: previous_close, t: timestamp }
    if (!data.c || data.c === 0) {
      console.error(`No quote data found for symbol: ${symbol}`);
      return null;
    }

    return {
      symbol: symbol,
      price: data.c, // 'c' is current price
      currency: 'USD',
      lastUpdated: new Date(data.t * 1000), // Convert Unix timestamp to Date
    };
  } catch (error) {
    console.error(`Failed to fetch stock price for ${symbol}:`, error);
    return null;
  }
}

export async function getMultipleStockPrices(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  // Finnhub free tier: 60 calls/minute
  // No need for delays with such generous limits, but we'll add a small one to be safe
  for (const symbol of symbols) {
    const quote = await getStockPrice(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
    // Small 100ms delay between requests (allows 600 requests/minute)
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}



