import { useState, useCallback } from 'react'
import axios from 'axios'

export interface Expense {
  id: string
  category: string
  amount: number
  description: string
  date: string
  createdAt?: string
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get auth headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
  })

  // Fetch all expenses
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.get('https://finfluenzz.lakshyapaliwal200.workers.dev/api/expense/all', {
        headers: getAuthHeaders()
      })
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch expenses')
      }
      
      const mappedExpenses = response.data.expenses?.map((expense: any) => ({
        id: expense.id.toString(),
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.createdAt,
        createdAt: expense.createdAt
      })) || []
      
      setExpenses(mappedExpenses)
      return mappedExpenses
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expenses'
      setError(errorMessage)
      console.error('Error fetching expenses:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get expenses from last N days
  const getRecentExpenses = useCallback((days: number = 7): Expense[] => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= cutoffDate
    })
  }, [expenses])

  // Get expenses by category
  const getExpensesByCategory = useCallback((category: string): Expense[] => {
    return expenses.filter(expense => 
      expense.category.toLowerCase() === category.toLowerCase()
    )
  }, [expenses])

  // Calculate total spending
  const getTotalSpending = useCallback((expenseList?: Expense[]): number => {
    const targetExpenses = expenseList || expenses
    return targetExpenses.reduce((total, expense) => total + expense.amount, 0)
  }, [expenses])

  // Get spending by category
  const getSpendingByCategory = useCallback(() => {
    const categoryTotals: Record<string, number> = {}
    
    expenses.forEach(expense => {
      const category = expense.category
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
    })
    
    return categoryTotals
  }, [expenses])

  return {
    // State
    expenses,
    isLoading,
    error,
    
    // Actions
    fetchExpenses,
    
    // Utilities
    getRecentExpenses,
    getExpensesByCategory,
    getTotalSpending,
    getSpendingByCategory,
  }
} 