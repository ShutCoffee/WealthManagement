'use server'

import { db } from '@/db'
import { dividends, assets, transactions } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, desc } from 'drizzle-orm'
import { getDividendHistory } from '@/lib/stock-api'
import { 
  calculateDividendMetrics as calculateDividendMetricsHelper, 
  calculateDividendsWithPayouts 
} from '@/lib/calculations/dividends'
import type { DividendWithPayout } from '@/lib/calculations/dividends'

export async function fetchAndStoreDividends(assetId: number) {
  try {
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1)
    
    if (!asset || asset.length === 0 || !asset[0].symbol) {
      return { error: 'Asset not found or has no symbol' }
    }

    const symbol = asset[0].symbol

    const dividendData = await getDividendHistory(symbol)

    if (dividendData.length === 0) {
      return { success: true, message: 'No dividends found for this symbol' }
    }

    await db.delete(dividends).where(eq(dividends.assetId, assetId))

    const dividendsToInsert = dividendData.map((div) => ({
      assetId,
      exDate: div.exDate,
      paymentDate: div.paymentDate,
      amount: div.amount.toString(),
      currency: div.currency,
      type: 'cash' as const,
    }))

    await db.insert(dividends).values(dividendsToInsert)

    revalidatePath('/')
    return { success: true, message: `Fetched ${dividendData.length} dividend records` }
  } catch (error) {
    console.error('Failed to fetch and store dividends:', error)
    return { error: 'Failed to fetch dividends' }
  }
}

export async function getDividends(assetId: number) {
  try {
    const assetDividends = await db
      .select()
      .from(dividends)
      .where(eq(dividends.assetId, assetId))
      .orderBy(desc(dividends.exDate))
    
    return assetDividends
  } catch (error) {
    console.error('Failed to fetch dividends:', error)
    return []
  }
}

export async function getDividendsWithPayouts(assetId: number): Promise<DividendWithPayout[]> {
  try {
    const [assetDividends, assetTransactions] = await Promise.all([
      db.select().from(dividends).where(eq(dividends.assetId, assetId)),
      db.select().from(transactions).where(eq(transactions.assetId, assetId))
    ])

    return calculateDividendsWithPayouts(assetDividends, assetTransactions)
  } catch (error) {
    console.error('Failed to fetch dividends with payouts:', error)
    return []
  }
}

export async function calculateDividendMetrics(assetId: number) {
  try {
    const [asset, assetDividends, assetTransactions] = await Promise.all([
      db.select().from(assets).where(eq(assets.id, assetId)).limit(1),
      db.select().from(dividends).where(eq(dividends.assetId, assetId)),
      db.select().from(transactions).where(eq(transactions.assetId, assetId))
    ])

    if (!asset || asset.length === 0) {
      return {
        totalDividends: 0,
        ytdDividends: 0,
        dividendYield: 0,
        count: 0,
      }
    }

    return calculateDividendMetricsHelper(asset[0], assetDividends, assetTransactions)
  } catch (error) {
    console.error('Failed to calculate dividend metrics:', error)
    return {
      totalDividends: 0,
      ytdDividends: 0,
      dividendYield: 0,
      count: 0,
    }
  }
}

export async function getAllDividendMetrics() {
  try {
    const investmentAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.type, 'investment'))

    const assetsWithSymbols = investmentAssets.filter((asset) => asset.symbol)
    let totalYTDDividends = 0

    for (const asset of assetsWithSymbols) {
      const metrics = await calculateDividendMetrics(asset.id)
      totalYTDDividends += metrics.ytdDividends
    }

    return {
      totalYTDDividends,
    }
  } catch (error) {
    console.error('Failed to calculate portfolio dividend metrics:', error)
    return {
      totalYTDDividends: 0,
    }
  }
}

export type { DividendWithPayout }

