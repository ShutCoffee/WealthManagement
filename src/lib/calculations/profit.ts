import type { Asset, Transaction, Dividend } from '@/db/schema'

interface ProfitCalculation {
  totalShares: number
  avgCostBasis: number
  currentPrice: number
  currentValue: number
  totalCost: number
  unrealizedGain: number
  realizedGain: number
  dividendIncome: number
  totalGain: number
  gainPercentage: number
}

interface PurchaseQueueItem {
  shares: number
  pricePerShare: number
}

export function calculateProfit(
  asset: Asset,
  transactions: Transaction[],
  dividends: Dividend[]
): ProfitCalculation | { error: string } {
  if (transactions.length === 0) {
    const currentPrice = asset.quantity && parseFloat(asset.quantity) > 0
      ? parseFloat(asset.value) / parseFloat(asset.quantity)
      : parseFloat(asset.value)
    
    return {
      totalShares: 0,
      avgCostBasis: 0,
      currentPrice,
      currentValue: 0,
      totalCost: 0,
      unrealizedGain: 0,
      realizedGain: 0,
      dividendIncome: 0,
      totalGain: 0,
      gainPercentage: 0,
    }
  }

  // Sort transactions chronologically
  const sortedTransactions = [...transactions].reverse()

  // Calculate holdings and cost basis using FIFO
  let totalShares = 0
  let totalCost = 0
  let realizedGain = 0
  const purchaseQueue: PurchaseQueueItem[] = []

  for (const t of sortedTransactions) {
    const qty = parseFloat(t.quantity)
    const price = parseFloat(t.pricePerShare)

    if (t.type === 'buy') {
      totalShares += qty
      totalCost += qty * price
      purchaseQueue.push({ shares: qty, pricePerShare: price })
    } else if (t.type === 'sell') {
      totalShares -= qty
      let remainingSellQty = qty
      const salePrice = price

      while (remainingSellQty > 0 && purchaseQueue.length > 0) {
        const purchase = purchaseQueue[0]
        const qtyToSell = Math.min(remainingSellQty, purchase.shares)
        
        realizedGain += qtyToSell * (salePrice - purchase.pricePerShare)
        
        purchase.shares -= qtyToSell
        remainingSellQty -= qtyToSell
        
        if (purchase.shares <= 0) {
          purchaseQueue.shift()
        }
      }
    }
  }

  // Calculate dividend income
  const dividendIncome = calculateDividendIncome(asset, sortedTransactions, dividends)

  // Calculate remaining cost basis
  const remainingCost = purchaseQueue.reduce(
    (sum, purchase) => sum + (purchase.shares * purchase.pricePerShare),
    0
  )

  const currentPrice = totalShares > 0 ? parseFloat(asset.value) / totalShares : 0
  const currentValue = totalShares * currentPrice
  const unrealizedGain = currentValue - remainingCost
  const totalGain = unrealizedGain + realizedGain + dividendIncome
  const avgCostBasis = totalShares > 0 ? remainingCost / totalShares : 0
  const gainPercentage = remainingCost > 0 ? (totalGain / remainingCost) * 100 : 0

  return {
    totalShares,
    avgCostBasis,
    currentPrice,
    currentValue,
    totalCost: remainingCost,
    unrealizedGain,
    realizedGain,
    dividendIncome,
    totalGain,
    gainPercentage,
  }
}

function calculateDividendIncome(
  asset: Asset,
  transactions: Transaction[],
  dividends: Dividend[]
): number {
  if (!asset.symbol) {
    return 0
  }

  let dividendIncome = 0

  const getSharesOnDate = (date: Date) => {
    return transactions.reduce((total, t) => {
      const tDate = new Date(t.date)
      if (tDate < date) {
        const qty = parseFloat(t.quantity)
        return t.type === 'buy' ? total + qty : total - qty
      }
      return total
    }, 0)
  }

  for (const div of dividends) {
    const exDate = new Date(div.exDate)
    const shares = getSharesOnDate(exDate)
    
    if (shares > 0) {
      const amount = parseFloat(div.amount)
      dividendIncome += amount * shares
    }
  }

  return dividendIncome
}

export type { ProfitCalculation }

