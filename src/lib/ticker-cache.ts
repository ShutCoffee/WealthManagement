/**
 * Ticker Cache Service
 * Manages local database cache of US stock tickers for fast search
 */

import { db } from '@/db';
import { tickers } from '@/db/schema';
import { sql, ilike, or } from 'drizzle-orm';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

interface FinnhubSymbol {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

/**
 * Initialize ticker cache by fetching all US stocks from Finnhub
 * This should be run once to populate the database
 */
export async function initializeTickerCache(): Promise<{ success: boolean; count?: number; error?: string }> {
  if (!FINNHUB_API_KEY) {
    return { success: false, error: 'FINNHUB_API_KEY is not set' };
  }

  try {
    // Fetch US stock symbols from Finnhub
    const url = `${BASE_URL}/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    const data: FinnhubSymbol[] = await response.json();

    if (!Array.isArray(data)) {
      return { success: false, error: 'Invalid response from Finnhub' };
    }

    // Filter out invalid entries and prepare for insertion
    const tickerData = data
      .filter((item) => item.symbol && item.description)
      .map((item) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type || 'Common Stock',
      }));

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

