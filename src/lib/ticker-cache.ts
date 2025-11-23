/**
 * Ticker Cache Service
 * Manages local database cache of stock tickers for fast search
 * Uses Alpha Vantage for ticker listing (requires CSV download)
 * Note: Free tier has 25 API calls/day limit - use ticker cache to minimize API usage
 */

import { db } from '@/db';
import { tickers } from '@/db/schema';
import { sql, ilike, or } from 'drizzle-orm';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

/**
 * Initialize ticker cache
 * Note: Alpha Vantage provides listing status via CSV download endpoint
 * For a comprehensive ticker list, consider downloading the CSV separately
 * Or use searchLocalTickers for real-time search via Alpha Vantage API
 */
export async function initializeTickerCache(): Promise<{ success: boolean; count?: number; error?: string }> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return { success: false, error: 'ALPHA_VANTAGE_API_KEY is not set' };
  }

  try {
    // Alpha Vantage provides a CSV listing endpoint for active/delisted stocks
    // https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=YOUR_API_KEY
    const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch ticker list from Alpha Vantage' };
    }

    const csvText = await response.text();
    
    // Check for rate limit message
    if (csvText.includes('Thank you for using Alpha Vantage') || csvText.includes('premium')) {
      return { success: false, error: 'Rate limit reached or premium feature required' };
    }

    // Parse CSV (skip header row)
    const lines = csvText.trim().split('\n');
    const tickerData: Array<{ symbol: string; name: string; type: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // CSV format: symbol,name,exchange,assetType,ipoDate,delistingDate,status
      const parts = line.split(',');
      if (parts.length >= 4) {
        const symbol = parts[0].trim();
        const name = parts[1].trim();
        const assetType = parts[3].trim();
        const status = parts[6]?.trim();

        // Only include active stocks/ETFs
        if (symbol && name && status === 'Active') {
          tickerData.push({
            symbol,
            name,
            type: assetType || 'Stock',
          });
        }
      }
    }

    if (tickerData.length === 0) {
      return { success: false, error: 'No valid tickers found in response' };
    }

    // Clear existing tickers and insert new ones
    await db.delete(tickers);
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 500;
    for (let i = 0; i < tickerData.length; i += batchSize) {
      const batch = tickerData.slice(i, i + batchSize);
      await db.insert(tickers).values(batch);
    }

    return { success: true, count: tickerData.length };
  } catch (error) {
    console.error('Failed to initialize ticker cache:', error);
    return { success: false, error: 'Failed to fetch or store tickers' };
  }
}

/**
 * Search for tickers in the local database
 * Searches both symbol and name fields
 */
export async function searchLocalTickers(query: string): Promise<StockSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    
    // Search for matches in both symbol and name
    const results = await db
      .select()
      .from(tickers)
      .where(
        or(
          ilike(tickers.symbol, searchTerm),
          ilike(tickers.name, searchTerm)
        )
      )
      .limit(10);

    // Map to expected format
    return results.map((ticker) => ({
      symbol: ticker.symbol,
      name: ticker.name,
      type: ticker.type || 'Stock',
      region: 'US',
      currency: 'USD',
    }));
  } catch (error) {
    console.error('Failed to search local tickers:', error);
    return [];
  }
}

/**
 * Check if ticker cache is initialized
 */
export async function isTickerCacheInitialized(): Promise<boolean> {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(tickers);
    return result[0].count > 0;
  } catch (error) {
    console.error('Failed to check ticker cache:', error);
    return false;
  }
}

/**
 * Get ticker cache statistics
 */
export async function getTickerCacheStats() {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(tickers);
    const lastUpdated = await db
      .select({ lastUpdated: tickers.lastUpdated })
      .from(tickers)
      .orderBy(sql`${tickers.lastUpdated} DESC`)
      .limit(1);

    return {
      count: result[0].count,
      lastUpdated: lastUpdated[0]?.lastUpdated || null,
    };
  } catch (error) {
    console.error('Failed to get ticker cache stats:', error);
    return { count: 0, lastUpdated: null };
  }
}

