'use server'

import { getHistoricalPrices, getStockPriceOnDate } from '@/lib/stock-api'

export async function getHistoricalPriceData(symbol: string, range: string = '1Y') {
  try {
    const priceData = await getHistoricalPrices(symbol, range)
    return { success: true, data: priceData }
  } catch (error) {
    console.error('Failed to fetch historical price data:', error)
    return { error: 'Failed to fetch historical data' }
  }
}

export async function getStockPriceForDate(symbol: string, date: string) {
  try {
    const priceData = await getStockPriceOnDate(symbol, date)
    if (priceData) {
      return { success: true, price: priceData.price, actualDate: priceData.actualDate }
    }
    return { error: 'No price data available for this date' }
  } catch (error) {
    console.error('Failed to fetch price for date:', error)
    return { error: 'Failed to fetch price' }
  }
}

