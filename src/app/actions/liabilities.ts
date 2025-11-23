'use server'

import { db } from '@/db'
import { liabilities } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

export async function createLiability(formData: FormData) {
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const balance = formData.get('balance') as string
  const currency = formData.get('currency') as string
  const interestRate = formData.get('interestRate') as string
  const description = formData.get('description') as string

  if (!name || !type || !balance) {
    return { error: 'Name, type, and balance are required' }
  }

  try {
    await db.insert(liabilities).values({
      name,
      type,
      balance,
      currency: currency || 'USD',
      interestRate: interestRate || null,
      description: description || null,
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to create liability:', error)
    return { error: 'Failed to create liability' }
  }
}

export async function getLiabilities() {
  try {
    const allLiabilities = await db.select().from(liabilities)
    return allLiabilities
  } catch (error) {
    console.error('Failed to fetch liabilities:', error)
    return []
  }
}

export async function deleteLiability(liabilityId: number) {
  try {
    await db.delete(liabilities).where(eq(liabilities.id, liabilityId))
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete liability:', error)
    return { error: 'Failed to delete liability' }
  }
}

export async function updateLiability(
  liabilityId: number,
  data: { balance?: string; interestRate?: string; nextPaymentDate?: Date }
) {
  try {
    await db
      .update(liabilities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(liabilities.id, liabilityId))

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to update liability:', error)
    return { error: 'Failed to update liability' }
  }
}

