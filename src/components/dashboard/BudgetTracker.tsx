import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, PiggyBank, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { useIsMobile } from '../../hooks/use-Mobile'

export interface ExpenseItem {
  id: string
  category: string
  amount: number
  description: string
  date?: string // Make date optional since backend might not have it
}

interface BudgetTrackerProps {
  onExpensesChange?: (expenses: ExpenseItem[]) => void
}

// Cache configuration (shared with ChallengesTab)
const CACHE_KEY = 'finfluenzz-challenges-expenses-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

interface CachedExpenses {
  data: ExpenseItem[]
  timestamp: number
}

export default function BudgetTracker({ onExpensesChange }: BudgetTrackerProps) {
  const isMobile = useIsMobile()
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [error, setError] = useState<string>('')
  
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [newExpense, setNewExpense] = useState<Omit<ExpenseItem, 'id'>>({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Check if cached data is still valid
  const isCacheValid = (): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return false
      
      const { timestamp }: CachedExpenses = JSON.parse(cached)
      const now = Date.now()
      return (now - timestamp) < CACHE_DURATION
    } catch {
      return false
    }
  }

  // Get cached data
  const getCachedExpenses = (): ExpenseItem[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null
      
      const { data }: CachedExpenses = JSON.parse(cached)
      return data
    } catch {
      return null
    }
  }

  // Cache expenses data
  const cacheExpenses = (expenseData: ExpenseItem[]) => {
    try {
      const cacheData: CachedExpenses = {
        data: expenseData,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache expenses:', error)
    }
  }

  // Load expenses from API on component mount
  useEffect(() => {
    fetchExpenses()
  }, [])

  // Notify parent whenever expenses change
  useEffect(() => {
    onExpensesChange?.(expenses)
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('expensesUpdated'))
  }, [expenses, onExpensesChange])

  const fetchExpenses = async (forceRefresh = false) => {
    // Use cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      const cachedData = getCachedExpenses()
      if (cachedData) {
        setExpenses(cachedData)
        setIsLoading(false)
        return
      }
    }

    try {
      setIsLoading(true)
      setError('')
      const response = await axios.get("https://finfluenzz.lakshyapaliwal200.workers.dev/api/expense/all", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
        }
      })
      
      if (response.data && response.data.expenses) {
        // Map backend response to frontend format
        const mappedExpenses = response.data.expenses.map((expense: any) => ({
          id: expense.id.toString(),
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date || new Date().toISOString().split('T')[0] // Use current date if not provided
        }))
        setExpenses(mappedExpenses)
        cacheExpenses(mappedExpenses) // Cache the fresh data
        console.log('Successfully loaded', mappedExpenses.length, 'expenses')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      
      // Clear cache on auth errors to prevent data leakage
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem(CACHE_KEY)
      }
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const errorMsg = error.response?.data?.msg || error.response?.data?.error || error.message
        
        console.error('API Error:', { status, errorMsg, fullResponse: error.response?.data })
        
        if (status === 401) {
          setError('Authentication failed. Please sign in again.')
        } else if (status === 500) {
          setError(`Server error (500): ${errorMsg}. Check console for details.`)
        } else {
          setError(`API error (${status}): ${errorMsg}`)
        }
      } else {
        setError('Network error. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount || newExpense.amount <= 0 || !newExpense.description) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsAddingExpense(true)
      setError('')
      
      // Prepare data for backend (exclude date since backend doesn't expect it)
      const expenseData = {
        amount: Math.round(newExpense.amount), // Convert to integer for database
        category: newExpense.category,
        description: newExpense.description
      }

      const response = await axios.post("https://finfluenzz.lakshyapaliwal200.workers.dev/api/expense/add", expenseData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
        }
      })
      
      if (response.data && response.data.expense) {
        // Add the new expense to local state
        const addedExpense: ExpenseItem = {
          id: response.data.expense.id.toString(),
          category: response.data.expense.category,
          amount: response.data.expense.amount,
          description: response.data.expense.description,
          date: newExpense.date // Use the date from the form
        }
        
        // Update local state
        const updatedExpenses = [...expenses, addedExpense]
        setExpenses(updatedExpenses)
        
        // Update cache with new expense
        cacheExpenses(updatedExpenses)
        
        // Reset form
        setNewExpense({
          category: '',
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        setShowExpenseForm(false)
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setError('Please log in to add expenses')
        } else if (error.response.status === 400) {
          setError(error.response.data?.error || 'Invalid expense data')
        } else {
          setError('Failed to add expense. Please try again.')
        }
      } else {
        setError('Network error. Please check your connection.')
      }
    } finally {
      setIsAddingExpense(false)
    }
  }

  const handleRemoveExpense = async (id: string) => {
    try {
      setError('')
      await axios.delete(`https://finfluenzz.lakshyapaliwal200.workers.dev/api/expense/delete/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
        }
      })
      
      // Update local state
      const updatedExpenses = expenses.filter(expense => expense.id !== id)
      setExpenses(updatedExpenses)
      
      // Update cache with removed expense
      cacheExpenses(updatedExpenses)
    } catch (error) {
      console.error('Error deleting expense:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Please log in to delete expenses')
      } else {
        setError('Failed to delete expense. Please try again.')
      }
    }
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Get this week's expenses
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const thisWeekExpenses = expenses.filter(expense => {
    const expenseDate = expense.date ? new Date(expense.date) : new Date()
    return expenseDate >= oneWeekAgo
  })
  const thisWeekTotal = thisWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Get last week's expenses for comparison
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const lastWeekExpenses = expenses.filter(expense => {
    const expenseDate = expense.date ? new Date(expense.date) : new Date()
    return expenseDate >= twoWeeksAgo && expenseDate < oneWeekAgo
  })
  const lastWeekTotal = lastWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Calculate category breakdown for this week
  const categoryTotals = thisWeekExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']

  const formatDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : new Date()
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const weekChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#001F3F] mb-2 tracking-wider">
            💰 SMART BUDGET TRACKER
          </h2>
          <p className="text-[#001F3F] opacity-70">Loading your expenses...</p>
        </div>
        <div className="bg-white/60 border-4 border-[#007FFF] p-8 text-center" style={{ borderRadius: '0px' }}>
          <div className="animate-spin w-8 h-8 border-4 border-[#007FFF] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[#001F3F] mt-4 font-bold">LOADING...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`font-bold text-[#001F3F] mb-2 tracking-wider ${
          isMobile ? 'text-2xl' : 'text-3xl'
        }`}>
          💰 SMART BUDGET TRACKER
        </h2>
        <p className={`text-[#001F3F] opacity-70 ${
          isMobile ? 'text-sm' : ''
        }`}>
          Track your spending and optimize your financial habits!
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`bg-red-100 border-4 border-red-500 text-center ${
          isMobile ? 'p-3' : 'p-4'
        }`} style={{ borderRadius: '0px' }}>
          <p className={`text-red-700 font-bold ${
            isMobile ? 'text-sm' : ''
          }`}>{error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid gap-4 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
      }`}>
        {/* This Week Total */}
        <div className={`bg-white/60 border-4 border-[#007FFF] ${
          isMobile ? 'p-4' : 'p-6'
        }`} style={{ borderRadius: '0px' }}>
          <div className="flex items-center space-x-3">
            <Calendar className={`text-[#007FFF] ${
              isMobile ? 'w-6 h-6' : 'w-8 h-8'
            }`} />
            <div>
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">THIS WEEK</p>
              <p className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>₹{thisWeekTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Weekly Change */}
        <div className={`bg-white/60 border-4 border-[#007FFF] ${
          isMobile ? 'p-4' : 'p-6'
        }`} style={{ borderRadius: '0px' }}>
          <div className="flex items-center space-x-3">
            {weekChange >= 0 ? (
              <TrendingUp className={`text-red-500 ${
                isMobile ? 'w-6 h-6' : 'w-8 h-8'
              }`} />
            ) : (
              <TrendingDown className={`text-green-500 ${
                isMobile ? 'w-6 h-6' : 'w-8 h-8'
              }`} />
            )}
            <div>
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">VS LAST WEEK</p>
              <p className={`font-bold ${weekChange >= 0 ? 'text-red-500' : 'text-green-500'} ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Total All Time */}
        <div className={`bg-white/60 border-4 border-[#007FFF] ${
          isMobile ? 'p-4' : 'p-6'
        }`} style={{ borderRadius: '0px' }}>
          <div className="flex items-center space-x-3">
            <DollarSign className={`text-[#007FFF] ${
              isMobile ? 'w-6 h-6' : 'w-8 h-8'
            }`} />
            <div>
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">TOTAL</p>
              <p className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>₹{totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown for This Week */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className={`bg-white/60 border-4 border-[#007FFF] ${
          isMobile ? 'p-4' : 'p-6'
        }`} style={{ borderRadius: '0px' }}>
          <h3 className={`font-bold text-[#001F3F] mb-4 tracking-wide ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            📊 THIS WEEK BY CATEGORY
          </h3>
          <div className={`grid gap-4 ${
            isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'
          }`}>
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className={`bg-blue-50/50 border-2 border-[#007FFF]/30 ${
                isMobile ? 'p-2' : 'p-3'
              }`}>
                <p className="text-sm text-[#001F3F] opacity-70 font-bold">{category.toUpperCase()}</p>
                <p className={`font-bold text-[#001F3F] ${
                  isMobile ? 'text-base' : 'text-lg'
                }`}>₹{amount.toFixed(2)}</p>
                <div className="w-full bg-[#007FFF]/20 h-2 mt-2">
                  <div 
                    className="bg-[#007FFF] h-full transition-all duration-300"
                    style={{ width: `${(amount / thisWeekTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Section */}
      <div className={`bg-white/60 border-4 border-[#007FFF] ${
        isMobile ? 'p-4' : 'p-6'
      }`} style={{ borderRadius: '0px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-[#001F3F] tracking-wide ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            ➕ ADD EXPENSE
          </h3>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="bg-[#007FFF] text-white p-2 border-2 border-[#001F3F] hover:bg-[#001F3F] transition-colors"
            style={{ borderRadius: '0px' }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showExpenseForm && (
          <div className={`space-y-4 bg-blue-50/50 border-2 border-[#007FFF]/30 ${
            isMobile ? 'p-3' : 'p-4'
          }`}>
            <div className={`grid gap-4 ${
              isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
            }`}>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className={`border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono ${
                  isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <input
                type="number"
                step="0.01"
                placeholder="Amount (₹)"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                className={`border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono ${
                  isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'
                }`}
                style={{ borderRadius: '0px' }}
              />
            </div>
            
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              className={`w-full border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono ${
                isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'
              }`}
              style={{ borderRadius: '0px' }}
            />
            
            <div className={`flex ${
              isMobile ? 'flex-col space-y-3' : 'space-x-4'
            }`}>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className={`${isMobile ? 'w-full' : 'flex-1'} border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono ${
                  isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2'
                }`}
                style={{ borderRadius: '0px' }}
              />
              
              <button
                onClick={handleAddExpense}
                disabled={isAddingExpense}
                className={`bg-green-500 text-white border-2 border-green-600 hover:bg-green-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                  isMobile ? 'w-full px-4 py-2 text-sm' : 'px-6 py-2'
                }`}
                style={{ borderRadius: '0px' }}
              >
                {isAddingExpense ? 'ADDING...' : 'ADD EXPENSE'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Expenses List */}
      {expenses.length > 0 && (
        <div className={`bg-white/60 border-4 border-[#007FFF] ${
          isMobile ? 'p-4' : 'p-6'
        }`} style={{ borderRadius: '0px' }}>
          <h3 className={`font-bold text-[#001F3F] mb-4 tracking-wide ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            📋 RECENT EXPENSES
          </h3>
          
          <div className={`space-y-2 overflow-y-auto ${
            isMobile ? 'max-h-48' : 'max-h-64'
          }`}>
            {expenses
              .sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : new Date().getTime()
                const dateB = b.date ? new Date(b.date).getTime() : new Date().getTime()
                return dateB - dateA
              })
              .map((expense) => (
              <div key={expense.id} className={`flex items-center justify-between bg-white/80 border-2 border-[#007FFF]/30 ${
                isMobile ? 'p-2 flex-col space-y-2' : 'p-3'
              }`}>
                <div className={`${isMobile ? 'w-full text-center' : 'flex-1'}`}>
                  <div className={`flex items-center ${
                    isMobile ? 'flex-col space-y-2' : 'space-x-3'
                  }`}>
                    <span className={`inline-block bg-[#007FFF] text-white font-bold ${
                      isMobile ? 'px-2 py-1 text-xs' : 'px-2 py-1 text-xs'
                    }`}>
                      {expense.category}
                    </span>
                    <span className={`font-bold text-[#001F3F] ${
                      isMobile ? 'text-sm' : ''
                    }`}>{expense.description}</span>
                  </div>
                  <p className={`text-[#001F3F] opacity-70 mt-1 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    {formatDate(expense.date)}
                  </p>
                </div>
                <div className={`flex items-center ${
                  isMobile ? 'justify-center space-x-4' : 'space-x-3'
                }`}>
                  <span className={`font-bold text-[#001F3F] ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>₹{expense.amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleRemoveExpense(expense.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {expenses.length === 0 && (
        <div className={`text-center ${
          isMobile ? 'py-8' : 'py-12'
        }`}>
          <PiggyBank className={`text-[#007FFF] mx-auto mb-4 opacity-50 ${
            isMobile ? 'w-12 h-12' : 'w-16 h-16'
          }`} />
          <p className={`text-[#001F3F] opacity-70 ${
            isMobile ? 'text-base' : 'text-lg'
          }`}>
            Start tracking your expenses to get insights into your spending habits!
          </p>
        </div>
      )}
    </div>
  )
} 