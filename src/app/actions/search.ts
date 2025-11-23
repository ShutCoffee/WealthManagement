'use server'

import { searchLocalTickers, isTickerCacheInitialized, initializeTickerCache } from '@/lib/ticker-cache'

export async function searchStock(keyword: string) {
  try {
    // Check if cache is initialized, if not initialize it
    const cacheInitialized = await isTickerCacheInitialized()
    if (!cacheInitialized) {
      console.log('Ticker cache not initialized, initializing now...')
      await initializeTickerCache()
    }

    const results = await searchLocalTickers(keyword)
    return { success: true, results }
  } catch (error) {
    console.error('Failed to search stock:', error)
    return { error: 'Failed to search stock' }
  }
}

