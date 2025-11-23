'use server';

import { db } from '@/db';
import { assets, transactions, dividends } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { getStockPrice, getDividendHistory, getHistoricalPrices, getStockPriceOnDate } from '@/lib/stock-api';
import { searchLocalTickers, isTickerCacheInitialized, initializeTickerCache } from '@/lib/ticker-cache';

export async function searchStock(keyword: string) {
  try {
    // Check if cache is initialized, if not initialize it
    const cacheInitialized = await isTickerCacheInitialized();
    if (!cacheInitialized) {
      console.log('Ticker cache not initialized, initializing now...');
      await initializeTickerCache();
    }

    const results = await searchLocalTickers(keyword);
    return { success: true, results };
  } catch (error) {
    console.error('Failed to search stock:', error);
    return { error: 'Failed to search stock' };
  }
}

export async function createAssetWithPrice(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const category = formData.get('category') as string;
  const value = formData.get('value') as string;
  const currency = formData.get('currency') as string;
  const description = formData.get('description') as string;
  const symbol = formData.get('symbol') as string;
  const quantity = formData.get('quantity') as string;

  if (!name || !type) {
    return { error: 'Name and type are required' };
  }

  try {
    let finalValue = value || '0';
    let finalCurrency = currency || 'USD';
    let lastPriceUpdate = null;

    // If it's a stock with symbol and quantity, fetch current price
    if (symbol && quantity) {
      const quote = await getStockPrice(symbol);
      if (quote) {
        finalValue = (quote.price * parseFloat(quantity)).toFixed(2);
        finalCurrency = quote.currency;
        lastPriceUpdate = quote.lastUpdated;
      }
    }

    await db.insert(assets).values({
      name,
      type,
      category: category || null,
      value: finalValue,
      currency: finalCurrency,
      description: description || null,
      symbol: symbol || null,
      quantity: quantity || null,
      lastPriceUpdate,
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create asset:', error);
    return { error: 'Failed to create asset' };
  }
}

export async function createAsset(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const category = formData.get('category') as string;
  const value = formData.get('value') as string;
  const currency = formData.get('currency') as string;
  const description = formData.get('description') as string;
  const symbol = formData.get('symbol') as string;
  const quantity = formData.get('quantity') as string;

  if (!name || !type || !value) {
    return { error: 'Name, type, and value are required' };
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
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create asset:', error);
    return { error: 'Failed to create asset' };
  }
}

export async function getAssets() {
  try {
    const allAssets = await db.select().from(assets);
    return allAssets;
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return [];
  }
}

export async function refreshStockPrices() {
  try {
    // Get all investment assets with symbols
    const investmentAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.type, 'investment'));

    const assetsWithSymbols = investmentAssets.filter(
      (asset) => asset.symbol && asset.quantity
    );

    if (assetsWithSymbols.length === 0) {
      return { success: true, message: 'No investment assets with symbols to update' };
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Update each asset with current price
    // Alpha Vantage free tier: 25 calls/day - use sparingly!
    for (const asset of assetsWithSymbols) {
      const quote = await getStockPrice(asset.symbol!);

      if (quote) {
        const newValue = quote.price * parseFloat(asset.quantity!);
        await db
          .update(assets)
          .set({
            value: newValue.toFixed(2),
            currency: quote.currency,
            lastPriceUpdate: quote.lastUpdated,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, asset.id));
        updatedCount++;
      } else {
        errors.push(asset.symbol!);
      }

      // Small delay between requests
      if (assetsWithSymbols.indexOf(asset) < assetsWithSymbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    revalidatePath('/');

    if (errors.length > 0) {
      return {
        success: true,
        message: `Updated ${updatedCount} assets. Failed: ${errors.join(', ')}`,
      };
    }

    return { success: true, message: `Successfully updated ${updatedCount} assets` };
  } catch (error) {
    console.error('Failed to refresh stock prices:', error);
    return { error: 'Failed to refresh stock prices' };
  }
}

export async function deleteAsset(assetId: number) {
  try {
    await db.delete(assets).where(eq(assets.id, assetId));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return { error: 'Failed to delete asset' };
  }
}

export async function createTransaction(formData: FormData) {
  const assetId = parseInt(formData.get('assetId') as string);
  const type = formData.get('type') as string;
  const dateString = formData.get('date') as string;
  const quantity = formData.get('quantity') as string;
  const pricePerShare = formData.get('pricePerShare') as string;
  const notes = formData.get('notes') as string;

  if (!assetId || !type || !dateString || !quantity || !pricePerShare) {
    return { error: 'All fields except notes are required' };
  }

  try {
    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(pricePerShare);
    const totalValue = (quantityNum * priceNum).toFixed(2);

    // Insert transaction
    await db.insert(transactions).values({
      assetId,
      type,
      date: new Date(dateString),
      quantity: quantity,
      pricePerShare: pricePerShare,
      totalValue,
      notes: notes || null,
    });

    // Recalculate asset's total quantity and value
    await recalculateAssetValues(assetId);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return { error: 'Failed to create transaction' };
  }
}

export async function getAssetTransactions(assetId: number) {
  try {
    const assetTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.assetId, assetId))
      .orderBy(desc(transactions.date));
    
    return assetTransactions;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

export async function deleteTransaction(transactionId: number) {
  try {
    // Get the transaction to know which asset to update
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!transaction || transaction.length === 0) {
      return { error: 'Transaction not found' };
    }

    const assetId = transaction[0].assetId;

    // Delete transaction
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    // Recalculate asset values
    await recalculateAssetValues(assetId);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return { error: 'Failed to delete transaction' };
  }
}

async function recalculateAssetValues(assetId: number) {
  // Get all transactions for this asset
  const assetTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.assetId, assetId));

  // Calculate total shares (buys add, sells subtract)
  let totalShares = 0;
  for (const t of assetTransactions) {
    const qty = parseFloat(t.quantity);
    if (t.type === 'buy') {
      totalShares += qty;
    } else if (t.type === 'sell') {
      totalShares -= qty;
    }
  }

  // Get asset to fetch current price
  const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  
  if (asset && asset.length > 0 && asset[0].symbol) {
    // Fetch current price and calculate value
    const quote = await getStockPrice(asset[0].symbol);
    if (quote) {
      const currentValue = (totalShares * quote.price).toFixed(2);
      await db
        .update(assets)
        .set({
          quantity: totalShares.toFixed(4),
          value: currentValue,
          currency: quote.currency,
          lastPriceUpdate: quote.lastUpdated,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId));
    }
  } else {
    // No symbol, just update quantity
    await db
      .update(assets)
      .set({
        quantity: totalShares.toFixed(4),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId));
  }
}

export async function calculateAssetProfit(assetId: number) {
  try {
    // Get asset
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    
    if (!asset || asset.length === 0) {
      return { error: 'Asset not found' };
    }

    const assetData = asset[0];

    // Get all transactions and dividends
    const [assetTransactions, assetDividends] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.assetId, assetId)).orderBy(desc(transactions.date)),
      db.select().from(dividends).where(eq(dividends.assetId, assetId))
    ]);

    if (assetTransactions.length === 0) {
      return {
        totalShares: 0,
        avgCostBasis: 0,
        currentPrice: 0,
        currentValue: 0,
        totalCost: 0,
        unrealizedGain: 0,
        realizedGain: 0,
        dividendIncome: 0,
        totalGain: 0,
        gainPercentage: 0,
      };
    }

    // Calculate holdings and cost basis
    let totalShares = 0;
    let totalCost = 0;
    let realizedGain = 0;
    
    // Track purchases using FIFO for realized gains
    const purchaseQueue: Array<{ shares: number; pricePerShare: number }> = [];

    for (const t of assetTransactions.slice().reverse()) { // Process chronologically
      const qty = parseFloat(t.quantity);
      const price = parseFloat(t.pricePerShare);

      if (t.type === 'buy') {
        totalShares += qty;
        totalCost += qty * price;
        purchaseQueue.push({ shares: qty, pricePerShare: price });
      } else if (t.type === 'sell') {
        totalShares -= qty;
        let remainingSellQty = qty;
        const salePrice = price;

        // Calculate realized gain using FIFO
        while (remainingSellQty > 0 && purchaseQueue.length > 0) {
          const purchase = purchaseQueue[0];
          const qtyToSell = Math.min(remainingSellQty, purchase.shares);
          
          realizedGain += qtyToSell * (salePrice - purchase.pricePerShare);
          
          purchase.shares -= qtyToSell;
          remainingSellQty -= qtyToSell;
          
          if (purchase.shares <= 0) {
            purchaseQueue.shift();
          }
        }
      }
    }

    // Calculate dividend income
    // Helper to calculate shares owned on a specific date
    const getSharesOnDate = (date: Date) => {
      return assetTransactions.reduce((total, t) => {
        const tDate = new Date(t.date);
        // Transaction must happen BEFORE ex-date to qualify for dividend
        if (tDate < date) {
          const qty = parseFloat(t.quantity);
          return t.type === 'buy' ? total + qty : total - qty;
        }
        return total;
      }, 0);
    };

    let dividendIncome = 0;
    for (const div of assetDividends) {
      const exDate = new Date(div.exDate);
      const shares = getSharesOnDate(exDate);
      
      // Only count if shares were held
      if (shares > 0) {
        const amount = parseFloat(div.amount);
        dividendIncome += amount * shares;
      }
    }

    // Calculate remaining cost basis from unsold shares
    let remainingCost = 0;
    for (const purchase of purchaseQueue) {
      remainingCost += purchase.shares * purchase.pricePerShare;
    }

    // Use the cached price from the database (updated via "Refresh Prices" button)
    // This avoids making slow API calls on every page load
    const currentPrice = totalShares > 0 ? parseFloat(assetData.value) / totalShares : 0;

    const currentValue = totalShares * currentPrice;
    const unrealizedGain = currentValue - remainingCost;
    
    // Total gain now includes dividends
    const totalGain = unrealizedGain + realizedGain + dividendIncome;
    const avgCostBasis = totalShares > 0 ? remainingCost / totalShares : 0;
    
    // Gain percentage includes dividends in total return
    const gainPercentage = remainingCost > 0 ? (totalGain / remainingCost) * 100 : 0;

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
    };
  } catch (error) {
    console.error('Failed to calculate asset profit:', error);
    return { error: 'Failed to calculate profit' };
  }
}


// ============ DIVIDEND ACTIONS ============

export async function fetchAndStoreDividends(assetId: number) {
  try {
    // Get the asset
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    
    if (!asset || asset.length === 0 || !asset[0].symbol) {
      return { error: 'Asset not found or has no symbol' };
    }

    const symbol = asset[0].symbol;

    // Fetch dividend data from Alpha Vantage
    const dividendData = await getDividendHistory(symbol);

    if (dividendData.length === 0) {
      return { success: true, message: 'No dividends found for this symbol' };
    }

    // Clear existing dividends for this asset
    await db.delete(dividends).where(eq(dividends.assetId, assetId));

    // Insert new dividend data
    const dividendsToInsert = dividendData.map((div) => ({
      assetId,
      exDate: div.exDate,
      paymentDate: div.paymentDate,
      amount: div.amount.toString(),
      currency: div.currency,
      type: 'cash' as const,
    }));

    await db.insert(dividends).values(dividendsToInsert);

    revalidatePath('/');
    return { success: true, message: `Fetched ${dividendData.length} dividend records` };
  } catch (error) {
    console.error('Failed to fetch and store dividends:', error);
    return { error: 'Failed to fetch dividends' };
  }
}

export async function getDividends(assetId: number) {
  try {
    const assetDividends = await db
      .select()
      .from(dividends)
      .where(eq(dividends.assetId, assetId))
      .orderBy(desc(dividends.exDate));
    
    return assetDividends;
  } catch (error) {
    console.error('Failed to fetch dividends:', error);
    return [];
  }
}

export interface DividendWithPayout {
  id: number;
  exDate: Date;
  paymentDate: Date | null;
  amount: string;
  currency: string;
  type: string;
  sharesHeld: number;
  totalPayout: number;
}

export async function getDividendsWithPayouts(assetId: number): Promise<DividendWithPayout[]> {
  try {
    const [assetDividends, assetTransactions] = await Promise.all([
      db.select().from(dividends).where(eq(dividends.assetId, assetId)),
      db.select().from(transactions).where(eq(transactions.assetId, assetId))
    ]);

    // Helper to calculate shares owned on a specific date
    const getSharesOnDate = (date: Date) => {
      return assetTransactions.reduce((total, t) => {
        const tDate = new Date(t.date);
        // Transaction must happen BEFORE ex-date to qualify for dividend
        if (tDate < date) {
          const qty = parseFloat(t.quantity);
          return t.type === 'buy' ? total + qty : total - qty;
        }
        return total;
      }, 0);
    };

    // Map dividends with payout information
    const dividendsWithPayouts: DividendWithPayout[] = assetDividends
      .map((div) => {
        const exDate = new Date(div.exDate);
        const sharesHeld = getSharesOnDate(exDate);
        const amount = parseFloat(div.amount);
        const totalPayout = amount * sharesHeld;

        return {
          id: div.id,
          exDate: div.exDate,
          paymentDate: div.paymentDate,
          amount: div.amount,
          currency: div.currency,
          type: div.type,
          sharesHeld,
          totalPayout,
        };
      })
      // Filter out dividends where no shares were held
      .filter((div) => div.sharesHeld > 0)
      // Sort by ex-date descending (most recent first)
      .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());

    return dividendsWithPayouts;
  } catch (error) {
    console.error('Failed to fetch dividends with payouts:', error);
    return [];
  }
}

export async function calculateDividendMetrics(assetId: number) {
  try {
    const [assetDividends, assetTransactions] = await Promise.all([
      db.select().from(dividends).where(eq(dividends.assetId, assetId)),
      db.select().from(transactions).where(eq(transactions.assetId, assetId))
    ]);

    // Helper to calculate shares owned on a specific date
    const getSharesOnDate = (date: Date) => {
      return assetTransactions.reduce((total, t) => {
        const tDate = new Date(t.date);
        // Transaction must happen BEFORE ex-date to qualify for dividend
        if (tDate < date) {
          const qty = parseFloat(t.quantity);
          return t.type === 'buy' ? total + qty : total - qty;
        }
        return total;
      }, 0);
    };

    let totalDividends = 0;
    let ytdDividends = 0;
    const currentYear = new Date().getFullYear();

    for (const div of assetDividends) {
      const exDate = new Date(div.exDate);
      const shares = getSharesOnDate(exDate);
      
      // Only count if shares were held
      if (shares > 0) {
        const amount = parseFloat(div.amount);
        const payout = amount * shares;
        
        totalDividends += payout;
        
        if (exDate.getFullYear() === currentYear) {
          ytdDividends += payout;
        }
      }
    }

    // Get asset for yield calculation
    const asset = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    
    let dividendYield = 0;
    if (asset && asset.length > 0 && asset[0].quantity) {
      const currentValue = parseFloat(asset[0].value);
      const quantity = parseFloat(asset[0].quantity);
      const pricePerShare = quantity > 0 ? currentValue / quantity : 0;
      
      // Annual yield = (annual dividend per share / price per share) * 100
      // We'll estimate annual dividend based on last 12 months of dividends (sum of amounts, not payouts)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const trailing12MonthDividends = assetDividends
        .filter(d => new Date(d.exDate) >= oneYearAgo)
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      if (pricePerShare > 0 && trailing12MonthDividends > 0) {
        dividendYield = (trailing12MonthDividends / pricePerShare) * 100;
      }
    }

    return {
      totalDividends,
      ytdDividends,
      dividendYield,
      count: assetDividends.length,
    };
  } catch (error) {
    console.error('Failed to calculate dividend metrics:', error);
    return {
      totalDividends: 0,
      ytdDividends: 0,
      dividendYield: 0,
      count: 0,
    };
  }
}

export async function getAllDividendMetrics() {
  try {
    // Get all investment assets with symbols
    const investmentAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.type, 'investment'));

    const assetsWithSymbols = investmentAssets.filter((asset) => asset.symbol);
    const currentYear = new Date().getFullYear();
    let totalYTDDividends = 0;

    // This loop could be optimized with a single complex query, but this is safer for now
    for (const asset of assetsWithSymbols) {
      const metrics = await calculateDividendMetrics(asset.id);
      totalYTDDividends += metrics.ytdDividends;
    }

    return {
      totalYTDDividends,
    };
  } catch (error) {
    console.error('Failed to calculate portfolio dividend metrics:', error);
    return {
      totalYTDDividends: 0,
    };
  }
}

// ============ HISTORICAL PRICE ACTIONS ============

export async function getHistoricalPriceData(symbol: string, range: string = '1Y') {
  try {
    const priceData = await getHistoricalPrices(symbol, range);
    return { success: true, data: priceData };
  } catch (error) {
    console.error('Failed to fetch historical price data:', error);
    return { error: 'Failed to fetch historical data' };
  }
}

export async function getStockPriceForDate(symbol: string, date: string) {
  try {
    const priceData = await getStockPriceOnDate(symbol, date);
    if (priceData) {
      return { success: true, price: priceData.price, actualDate: priceData.actualDate };
    }
    return { error: 'No price data available for this date' };
  } catch (error) {
    console.error('Failed to fetch price for date:', error);
    return { error: 'Failed to fetch price' };
  }
}


