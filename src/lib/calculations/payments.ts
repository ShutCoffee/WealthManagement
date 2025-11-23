import type { Liability, LiabilityPayment } from '@/db/schema'

interface LiabilityMetrics {
  currentBalance: number
  interestRate: number
  totalPaid: number
  totalInterestPaid: number
  totalPrincipalPaid: number
  ytdInterestPaid: number
  ytdPrincipalPaid: number
  paymentCount: number
}

interface PaymentCalculation {
  principalPortion: number
  interestPortion: number
}

export function calculateLiabilityMetrics(
  liability: Liability,
  payments: LiabilityPayment[]
): LiabilityMetrics {
  const currentBalance = parseFloat(liability.balance)
  const interestRate = liability.interestRate ? parseFloat(liability.interestRate) : 0

  let totalPaid = 0
  let totalInterestPaid = 0
  let totalPrincipalPaid = 0
  const currentYear = new Date().getFullYear()
  let ytdInterestPaid = 0
  let ytdPrincipalPaid = 0

  for (const payment of payments) {
    const amount = parseFloat(payment.amount)
    const interest = payment.interestPortion ? parseFloat(payment.interestPortion) : 0
    const principal = payment.principalPortion ? parseFloat(payment.principalPortion) : 0
    
    totalPaid += amount
    totalInterestPaid += interest
    totalPrincipalPaid += principal

    const paymentDate = new Date(payment.date)
    if (paymentDate.getFullYear() === currentYear) {
      ytdInterestPaid += interest
      ytdPrincipalPaid += principal
    }
  }

  return {
    currentBalance,
    interestRate,
    totalPaid,
    totalInterestPaid,
    totalPrincipalPaid,
    ytdInterestPaid,
    ytdPrincipalPaid,
    paymentCount: payments.length,
  }
}

export function calculatePaymentPortions(
  balance: number,
  interestRate: number,
  paymentAmount: number
): PaymentCalculation {
  const monthlyInterestRate = interestRate / 100 / 12
  const interestPortion = balance * monthlyInterestRate
  const principalPortion = paymentAmount - interestPortion

  return {
    principalPortion,
    interestPortion,
  }
}

export type { LiabilityMetrics, PaymentCalculation }

