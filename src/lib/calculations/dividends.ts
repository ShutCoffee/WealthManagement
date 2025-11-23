import type { Dividend, Transaction, Asset } from '@/db/schema'

interface DividendMetrics {
  totalDividends: number
  ytdDividends: number
  dividendYield: number
  count: number
}

interface DividendWithPayout {
  id: number
  exDate: Date
  paymentDate: Date | null
  amount: string
  currency: string
  type: string
  sharesHeld: number
  totalPayout: number
}

export function calculateDividendMetrics(
  asset: Asset,
  dividends: Dividend[],
  transactions: Transaction[]
): DividendMetrics {
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

  let totalDividends = 0
  let ytdDividends = 0
  const currentYear = new Date().getFullYear()

  for (const div of dividends) {
    const exDate = new Date(div.exDate)
    const shares = getSharesOnDate(exDate)
    
    if (shares > 0) {
      const amount = parseFloat(div.amount)
      const payout = amount * shares
      
      totalDividends += payout
      
      if (exDate.getFullYear() === currentYear) {
        ytdDividends += payout
      }
    }
  }

  let dividendYield = 0
  if (asset.quantity) {
    const currentValue = parseFloat(asset.value)
    const quantity = parseFloat(asset.quantity)
    const pricePerShare = quantity > 0 ? currentValue / quantity : 0
    
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    const trailing12MonthDividends = dividends
      .filter(d => new Date(d.exDate) >= oneYearAgo)
      .reduce((sum, d) => sum + parseFloat(d.amount), 0)

    if (pricePerShare > 0 && trailing12MonthDividends > 0) {
      dividendYield = (trailing12MonthDividends / pricePerShare) * 100
    }
  }

  return {
    totalDividends,
    ytdDividends,
    dividendYield,
    count: dividends.length,
  }
}

export function calculateDividendsWithPayouts(
  dividends: Dividend[],
  transactions: Transaction[]
): DividendWithPayout[] {
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

  return dividends
    .map((div) => {
      const exDate = new Date(div.exDate)
      const sharesHeld = getSharesOnDate(exDate)
      const amount = parseFloat(div.amount)
      const totalPayout = amount * sharesHeld

      return {
        id: div.id,
        exDate: div.exDate,
        paymentDate: div.paymentDate,
        amount: div.amount,
        currency: div.currency,
        type: div.type,
        sharesHeld,
        totalPayout,
      }
    })
    .filter((div) => div.sharesHeld > 0)
    .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime())
}

export type { DividendMetrics, DividendWithPayout }

