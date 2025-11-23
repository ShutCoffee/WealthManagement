import { db } from '@/db'
import { assets, transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getStockPrice } from '@/lib/stock-api'

export async function recalculateAssetValues(assetId: number) {
  const assetTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.assetId, assetId))

  let totalShares = 0
  for (const t of assetTransactions) {
    const qty = parseFloat(t.quantity)
    if (t.type === 'buy') {
      totalShares += qty
    } else if (t.type === 'sell') {
      totalShares -= qty
    }
  }

  const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1)
  
  if (asset && asset.length > 0 && asset[0].symbol) {
    const quote = await getStockPrice(asset[0].symbol)
    if (quote) {
      const currentValue = (totalShares * quote.price).toFixed(2)
      await db
        .update(assets)
        .set({
          quantity: totalShares.toFixed(4),
          value: currentValue,
          currency: quote.currency,
          lastPriceUpdate: quote.lastUpdated,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId))
    }
  } else {
    await db
      .update(assets)
      .set({
        quantity: totalShares.toFixed(4),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
  }
}

