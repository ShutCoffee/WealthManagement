'use server'

import { db } from '@/db'
import { transactions } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, desc } from 'drizzle-orm'
import { recalculateAssetValues } from './asset-helpers'

export async function createTransaction(formData: FormData) {
  const assetId = parseInt(formData.get('assetId') as string)
  const type = formData.get('type') as string
  const dateString = formData.get('date') as string
  const quantity = formData.get('quantity') as string
  const pricePerShare = formData.get('pricePerShare') as string
  const notes = formData.get('notes') as string

  if (!assetId || !type || !dateString || !quantity || !pricePerShare) {
    return { error: 'All fields except notes are required' }
  }

  try {
    const quantityNum = parseFloat(quantity)
    const priceNum = parseFloat(pricePerShare)
    const totalValue = (quantityNum * priceNum).toFixed(2)

    await db.insert(transactions).values({
      assetId,
      type,
      date: new Date(dateString),
      quantity: quantity,
      pricePerShare: pricePerShare,
      totalValue,
      notes: notes || null,
    })

    await recalculateAssetValues(assetId)

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return { error: 'Failed to create transaction' }
  }
}

export async function getAssetTransactions(assetId: number) {
  try {
    const assetTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.assetId, assetId))
      .orderBy(desc(transactions.date))
    
    return assetTransactions
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return []
  }
}

export async function deleteTransaction(transactionId: number) {
  try {
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1)

    if (!transaction || transaction.length === 0) {
      return { error: 'Transaction not found' }
    }

    const assetId = transaction[0].assetId

    await db.delete(transactions).where(eq(transactions.id, transactionId))
    await recalculateAssetValues(assetId)

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return { error: 'Failed to delete transaction' }
  }
}

