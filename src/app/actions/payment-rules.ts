'use server'

import { db } from '@/db'
import { liabilityPaymentRules, liabilityPayments, liabilities } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, desc, and, lte } from 'drizzle-orm'
import { evaluateFormula } from '@/lib/validators/formulas'
import { calculateNextExecutionDate } from '@/lib/helpers/dates'
import { calculatePaymentPortions } from '@/lib/calculations/payments'
import { calculateLiabilityMetrics } from '@/lib/calculations/payments'

export async function createPaymentRule(formData: FormData) {
  const liabilityId = parseInt(formData.get('liabilityId') as string)
  const frequency = formData.get('frequency') as string
  const formulaExpression = formData.get('formulaExpression') as string
  const nextExecutionDateString = formData.get('nextExecutionDate') as string

  if (!liabilityId || !frequency || !formulaExpression || !nextExecutionDateString) {
    return { error: 'All fields are required' }
  }

  try {
    await db.insert(liabilityPaymentRules).values({
      liabilityId,
      frequency,
      formulaType: 'custom',
      formulaExpression,
      enabled: true,
      nextExecutionDate: new Date(nextExecutionDateString),
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to create payment rule:', error)
    return { error: 'Failed to create payment rule' }
  }
}

export async function getPaymentRules(liabilityId: number) {
  try {
    const rules = await db
      .select()
      .from(liabilityPaymentRules)
      .where(eq(liabilityPaymentRules.liabilityId, liabilityId))
      .orderBy(desc(liabilityPaymentRules.createdAt))
    
    return rules
  } catch (error) {
    console.error('Failed to fetch payment rules:', error)
    return []
  }
}

export async function updatePaymentRule(
  ruleId: number,
  data: { enabled?: boolean; formulaExpression?: string; frequency?: string; nextExecutionDate?: Date }
) {
  try {
    await db
      .update(liabilityPaymentRules)
      .set(data)
      .where(eq(liabilityPaymentRules.id, ruleId))

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to update payment rule:', error)
    return { error: 'Failed to update payment rule' }
  }
}

export async function deletePaymentRule(ruleId: number) {
  try {
    await db.delete(liabilityPaymentRules).where(eq(liabilityPaymentRules.id, ruleId))
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete payment rule:', error)
    return { error: 'Failed to delete payment rule' }
  }
}

export async function executePaymentRules() {
  try {
    const today = new Date()
    
    const dueRules = await db
      .select()
      .from(liabilityPaymentRules)
      .where(
        and(
          eq(liabilityPaymentRules.enabled, true),
          lte(liabilityPaymentRules.nextExecutionDate, today)
        )
      )

    if (dueRules.length === 0) {
      return { success: true, message: 'No payment rules due for execution', paymentsExecuted: 0 }
    }

    let paymentsExecuted = 0
    const errors: string[] = []

    for (const rule of dueRules) {
      try {
        const liability = await db
          .select()
          .from(liabilities)
          .where(eq(liabilities.id, rule.liabilityId))
          .limit(1)

        if (!liability || liability.length === 0) {
          errors.push(`Liability ${rule.liabilityId} not found`)
          continue
        }

        const liabilityData = liability[0]
        const currentBalance = parseFloat(liabilityData.balance)
        
        if (currentBalance <= 0) {
          continue
        }

        const interestRate = liabilityData.interestRate ? parseFloat(liabilityData.interestRate) : 0

        const paymentAmount = evaluateFormula(rule.formulaExpression, {
          balance: currentBalance,
          interestRate: interestRate,
        })

        const actualPayment = Math.min(paymentAmount, currentBalance)

        const { principalPortion, interestPortion } = calculatePaymentPortions(
          currentBalance,
          interestRate,
          actualPayment
        )

        await db.insert(liabilityPayments).values({
          liabilityId: rule.liabilityId,
          date: today,
          amount: actualPayment.toFixed(2),
          principalPortion: principalPortion.toFixed(2),
          interestPortion: interestPortion.toFixed(2),
          type: 'automatic',
          notes: `Automatic payment from rule: ${rule.formulaExpression}`,
        })

        const newBalance = Math.max(0, currentBalance - actualPayment)
        await db
          .update(liabilities)
          .set({
            balance: newBalance.toFixed(2),
            lastPaymentDate: today,
            updatedAt: today,
          })
          .where(eq(liabilities.id, rule.liabilityId))

        const nextExecution = calculateNextExecutionDate(rule.nextExecutionDate, rule.frequency)
        await db
          .update(liabilityPaymentRules)
          .set({
            lastExecutionDate: today,
            nextExecutionDate: nextExecution,
          })
          .where(eq(liabilityPaymentRules.id, rule.id))

        paymentsExecuted++
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error)
        errors.push(`Rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    revalidatePath('/')

    if (errors.length > 0) {
      return {
        success: true,
        message: `Executed ${paymentsExecuted} payments with ${errors.length} errors`,
        paymentsExecuted,
        errors,
      }
    }

    return {
      success: true,
      message: `Successfully executed ${paymentsExecuted} automatic payments`,
      paymentsExecuted,
    }
  } catch (error) {
    console.error('Failed to execute payment rules:', error)
    return { error: 'Failed to execute payment rules' }
  }
}

export async function recordManualPayment(formData: FormData) {
  const liabilityId = parseInt(formData.get('liabilityId') as string)
  const amount = formData.get('amount') as string
  const dateString = formData.get('date') as string
  const notes = formData.get('notes') as string

  if (!liabilityId || !amount || !dateString) {
    return { error: 'Liability, amount, and date are required' }
  }

  try {
    const paymentAmount = parseFloat(amount)
    
    const liability = await db
      .select()
      .from(liabilities)
      .where(eq(liabilities.id, liabilityId))
      .limit(1)

    if (!liability || liability.length === 0) {
      return { error: 'Liability not found' }
    }

    const liabilityData = liability[0]
    const currentBalance = parseFloat(liabilityData.balance)
    const interestRate = liabilityData.interestRate ? parseFloat(liabilityData.interestRate) : 0

    const { principalPortion, interestPortion } = calculatePaymentPortions(
      currentBalance,
      interestRate,
      paymentAmount
    )

    await db.insert(liabilityPayments).values({
      liabilityId,
      date: new Date(dateString),
      amount: paymentAmount.toFixed(2),
      principalPortion: principalPortion.toFixed(2),
      interestPortion: interestPortion.toFixed(2),
      type: 'manual',
      notes: notes || null,
    })

    const newBalance = Math.max(0, currentBalance - paymentAmount)
    await db
      .update(liabilities)
      .set({
        balance: newBalance.toFixed(2),
        lastPaymentDate: new Date(dateString),
        updatedAt: new Date(),
      })
      .where(eq(liabilities.id, liabilityId))

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to record manual payment:', error)
    return { error: 'Failed to record payment' }
  }
}

export async function getLiabilityPayments(liabilityId: number) {
  try {
    const payments = await db
      .select()
      .from(liabilityPayments)
      .where(eq(liabilityPayments.liabilityId, liabilityId))
      .orderBy(desc(liabilityPayments.date))
    
    return payments
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return []
  }
}

export async function calculateLiabilityMetricsAction(liabilityId: number) {
  try {
    const [liability, payments] = await Promise.all([
      db.select().from(liabilities).where(eq(liabilities.id, liabilityId)).limit(1),
      db.select().from(liabilityPayments).where(eq(liabilityPayments.liabilityId, liabilityId))
    ])

    if (!liability || liability.length === 0) {
      return { error: 'Liability not found' }
    }

    return calculateLiabilityMetrics(liability[0], payments)
  } catch (error) {
    console.error('Failed to calculate liability metrics:', error)
    return {
      currentBalance: 0,
      interestRate: 0,
      totalPaid: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      ytdInterestPaid: 0,
      ytdPrincipalPaid: 0,
      paymentCount: 0,
    }
  }
}

