'use server'

import { db } from '@/db'
import { assets, transactions, dividends } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, desc } from 'drizzle-orm'
import { getStockPrice } from '@/lib/stock-api'
import { calculateProfit } from '@/lib/calculations/profit'

export async function createAssetWithPrice(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const category = formData.get('category') as string
  const value = formData.get('value') as string
  const currency = formData.get('currency') as string
  const description = formData.get('description') as string
  const symbol = formData.get('symbol') as string
  const quantity = formData.get('quantity') as string

  if (!name || !type) {
    return { error: 'Name and type are required' }
  }

  try {
    let finalValue = value || '0'
    let finalCurrency = currency || 'USD'
    let lastPriceUpdate = null
    let pricePerShare = 0

    // If it's a stock with symbol and quantity, fetch current price
    if (symbol && quantity) {
      const quote = await getStockPrice(symbol)
      if (quote) {
        pricePerShare = quote.price
        finalValue = (quote.price * parseFloat(quantity)).toFixed(2)
        finalCurrency = quote.currency
        lastPriceUpdate = quote.lastUpdated
      }
    }

    const [newAsset] = await db.insert(assets).values({
      name,
      type,
      category: category || null,
      value: finalValue,
      currency: finalCurrency,
      description: description || null,
      symbol: symbol || null,
      quantity: quantity || null,
      lastPriceUpdate,
    }).returning()

    // Create initial transaction if we have symbol, quantity, and price
    if (symbol && quantity && pricePerShare > 0) {
      const quantityNum = parseFloat(quantity)
      const totalValue = (quantityNum * pricePerShare).toFixed(2)
      
      await db.insert(transactions).values({
        assetId: newAsset.id,
        type: 'buy',
        date: new Date(),
        quantity: quantity,
        pricePerShare: pricePerShare.toFixed(4),
        totalValue,
        notes: 'Initial position',
      })
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to create asset:', error)
    return { error: 'Failed to create asset' }
  }
}

export async function createAsset(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const category = formData.get('category') as string
  const value = formData.get('value') as string
  const currency = formData.get('currency') as string
  const description = formData.get('description') as string
  const symbol = formData.get('symbol') as string
  const quantity = formData.get('quantity') as string

  if (!name || !type || !value) {
    return { error: 'Name, type, and value are required' }
  }

  try {
    await db.insert(assets).values({
      name,
      type,
      category: category || null,
      value,
      currency: currency || 'USD',
      description: description || null,
      symbol: symbol || null,
      quantity: quantity || null,
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to create asset:', error)
    return { error: 'Failed to create asset' }
  }
}

export async function getAssets() {
  try {
    const allAssets = await db.select().from(assets)
    return allAssets
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return []
  }
}

export async function refreshStockPrices() {
  try {
    const investmentAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.type, 'investment'))

    const assetsWithSymbols = investmentAssets.filter(
      (asset) => asset.symbol && asset.quantity
    )

    if (assetsWithSymbols.length === 0) {
      return { success: true, message: 'No investment assets with symbols to update' }
    }

    let updatedCount = 0
    const errors: string[] = []

    for (const asset of assetsWithSymbols) {
      const quote = await getStockPrice(asset.symbol!)

      if (quote) {
        const newValue = quote.price * parseFloat(asset.quantity!)
        await db
          .update(assets)
          .set({
            value: newValue.toFixed(2),
            currency: quote.currency,
            lastPriceUpdate: quote.lastUpdated,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, asset.id))
        updatedCount++
      } else {
        errors.push(asset.symbol!)
      }

      // Small delay between requests
      if (assetsWithSymbols.indexOf(asset) < assetsWithSymbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    revalidatePath('/')

    if (errors.length > 0) {
      return {
        success: true,
        message: `Updated ${updatedCount} assets. Failed: ${errors.join(', ')}`,
      }
    }

    return { success: true, message: `Successfully updated ${updatedCount} assets` }
  } catch (error) {
    console.error('Failed to refresh stock prices:', error)
    return { error: 'Failed to refresh stock prices' }
  }
}

export async function deleteAsset(assetId: number) {
  try {
    await db.delete(assets).where(eq(assets.id, assetId))
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete asset:', error)
    return { error: 'Failed to delete asset' }
  }
}

export async function calculateAssetProfit(assetId: number) {
  try {
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1)
    
    if (!asset || asset.length === 0) {
      return { error: 'Asset not found' }
    }

    const assetData = asset[0]

    const [assetTransactions, assetDividends] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.assetId, assetId)).orderBy(desc(transactions.date)),
      db.select().from(dividends).where(eq(dividends.assetId, assetId))
    ])

    return calculateProfit(assetData, assetTransactions, assetDividends)
  } catch (error) {
    console.error('Failed to calculate asset profit:', error)
    return { error: 'Failed to calculate profit' }
  }
}

export async function calculateAssetsProfit(assetIds: number[]) {
  try {
    if (assetIds.length === 0) {
      return {}
    }

    const [allAssets, allTransactions, allDividends] = await Promise.all([
      db.select().from(assets),
      db.select().from(transactions),
      db.select().from(dividends),
    ])

    const assetMap = new Map(allAssets.map(a => [a.id, a]))
    const transactionsByAsset = new Map<number, typeof allTransactions>()
    const dividendsByAsset = new Map<number, typeof allDividends>()

    for (const t of allTransactions) {
      if (!transactionsByAsset.has(t.assetId)) {
        transactionsByAsset.set(t.assetId, [])
      }
      transactionsByAsset.get(t.assetId)!.push(t)
    }

    for (const d of allDividends) {
      if (!dividendsByAsset.has(d.assetId)) {
        dividendsByAsset.set(d.assetId, [])
      }
      dividendsByAsset.get(d.assetId)!.push(d)
    }

    const results: Record<number, ReturnType<typeof calculateProfit>> = {}

    for (const assetId of assetIds) {
      const assetData = assetMap.get(assetId)
      if (!assetData) continue

      const assetTransactions = (transactionsByAsset.get(assetId) || [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const assetDividends = dividendsByAsset.get(assetId) || []

      const result = calculateProfit(assetData, assetTransactions, assetDividends)
      if (!('error' in result)) {
        results[assetId] = result
      }
    }

    return results
  } catch (error) {
    console.error('Failed to calculate assets profit:', error)
    return {}
  }
}

