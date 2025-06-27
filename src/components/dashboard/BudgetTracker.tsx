import  { useState, useEffect } from 'react'
import { Plus, Trash2, PiggyBank, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'

export interface ExpenseItem {
  id: string
  category: string
  amount: number
  description: string
  date: string
}

interface BudgetTrackerProps {
  onExpensesChange?: (expenses: ExpenseItem[]) => void
}

export default function BudgetTracker({ onExpensesChange }: BudgetTrackerProps) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('finfluenzz-expenses')
    return saved ? JSON.parse(saved) : []
  })
  
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [newExpense, setNewExpense] = useState<Omit<ExpenseItem, 'id'>>({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Save to localStorage and notify parent whenever expenses change
  useEffect(() => {
    localStorage.setItem('finfluenzz-expenses', JSON.stringify(expenses))
    onExpensesChange?.(expenses)
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('expensesUpdated'))
  }, [expenses, onExpensesChange])

  const handleAddExpense = () => {
    if (newExpense.category && newExpense.amount > 0 && newExpense.description) {
      const expense: ExpenseItem = {
        id: Date.now().toString(),
        ...newExpense
      }
      setExpenses([...expenses, expense])
      setNewExpense({
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      setShowExpenseForm(false)
    }
  }

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id))
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Get this week's expenses
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const thisWeekExpenses = expenses.filter(expense => new Date(expense.date) >= oneWeekAgo)
  const thisWeekTotal = thisWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Get last week's expenses for comparison
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const lastWeekExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= twoWeeksAgo && expenseDate < oneWeekAgo
  })
  const lastWeekTotal = lastWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Calculate category breakdown for this week
  const categoryTotals = thisWeekExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const weekChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#001F3F] mb-2 tracking-wider">
          💰 SMART BUDGET TRACKER
        </h2>
        <p className="text-[#001F3F] opacity-70">
          Track your spending and optimize your financial habits!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* This Week Total */}
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-[#007FFF]" />
            <div>
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">THIS WEEK</p>
              <p className="text-2xl font-bold text-[#001F3F]">₹{thisWeekTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Weekly Change */}
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <div className="flex items-center space-x-3">
            {weekChange >= 0 ? (
              <TrendingUp className="w-8 h-8 text-red-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-green-500" />
            )}
            <div>
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">VS LAST WEEK</p>
              <p className={`text-2xl font-bold ${weekChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Total All Time */}
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-[#007FFF]" />
            <div>
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">TOTAL</p>
              <p className="text-2xl font-bold text-[#001F3F]">₹{totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown for This Week */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <h3 className="text-xl font-bold text-[#001F3F] mb-4 tracking-wide">
            📊 THIS WEEK BY CATEGORY
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="bg-blue-50/50 border-2 border-[#007FFF]/30 p-3">
                <p className="text-sm text-[#001F3F] opacity-70 font-bold">{category.toUpperCase()}</p>
                <p className="text-lg font-bold text-[#001F3F]">₹{amount.toFixed(2)}</p>
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
      <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#001F3F] tracking-wide">
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
          <div className="space-y-4 p-4 bg-blue-50/50 border-2 border-[#007FFF]/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className="px-3 py-2 border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono"
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
                className="px-3 py-2 border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono"
                style={{ borderRadius: '0px' }}
              />
            </div>
            
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              className="w-full px-3 py-2 border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono"
              style={{ borderRadius: '0px' }}
            />
            
            <div className="flex space-x-4">
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className="flex-1 px-3 py-2 border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none font-mono"
                style={{ borderRadius: '0px' }}
              />
              
              <button
                onClick={handleAddExpense}
                className="bg-green-500 text-white px-6 py-2 border-2 border-green-600 hover:bg-green-600 transition-colors font-bold"
                style={{ borderRadius: '0px' }}
              >
                ADD EXPENSE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Expenses List */}
      {expenses.length > 0 && (
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <h3 className="text-xl font-bold text-[#001F3F] mb-4 tracking-wide">
            📋 RECENT EXPENSES
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => (
              <div key={expense.id} className="flex items-center justify-between bg-white/80 p-3 border-2 border-[#007FFF]/30">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="inline-block px-2 py-1 bg-[#007FFF] text-white text-xs font-bold">
                      {expense.category}
                    </span>
                    <span className="font-bold text-[#001F3F]">{expense.description}</span>
                  </div>
                  <p className="text-sm text-[#001F3F] opacity-70 mt-1">
                    {formatDate(expense.date)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-[#001F3F] text-lg">₹{expense.amount.toFixed(2)}</span>
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
        <div className="text-center py-12">
          <PiggyBank className="w-16 h-16 text-[#007FFF] mx-auto mb-4 opacity-50" />
          <p className="text-[#001F3F] text-lg opacity-70">
            Start tracking your expenses to get insights into your spending habits!
          </p>
        </div>
      )}
    </div>
  )
} 