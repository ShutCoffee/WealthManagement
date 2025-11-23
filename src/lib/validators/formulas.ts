interface FormulaVariables {
  balance: number
  interestRate: number
}

export function evaluateFormula(formula: string, variables: FormulaVariables): number {
  try {
    const { balance, interestRate } = variables
    
    // Replace variable names in formula
    const processedFormula = formula
      .replace(/balance/g, balance.toString())
      .replace(/interestRate/g, interestRate.toString())
    
    // Only allow basic math operations
    const allowedChars = /^[0-9+\-*/(). ]+$/
    if (!allowedChars.test(processedFormula)) {
      throw new Error('Formula contains invalid characters')
    }
    
    // Use Function constructor for evaluation (safer than eval)
    const result = Function(`"use strict"; return (${processedFormula})`)()
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Formula did not evaluate to a valid number')
    }
    
    return Math.max(0, result) // Payment can't be negative
  } catch (error) {
    console.error('Formula evaluation error:', error)
    throw new Error('Invalid formula')
  }
}

export type { FormulaVariables }

