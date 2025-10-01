import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, PiggyBank, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, FileText, Loader2, Download } from 'lucide-react'
import { useIsMobile } from '../../hooks/use-Mobile'
import expenseSummarizerAgent from '../../Agents/expenseSummarizerAgent'
import type { SummaryRequest } from '../../Agents/expenseSummarizerAgent'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
} from 'chart.js'
import { jsPDF } from 'jspdf'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
)

type SummaryNode =
  | { type: 'heading'; content: string }
  | { type: 'text'; content: string }
  | { type: 'list'; items: string[] }

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
  
  // Summary states
  const [showSummary, setShowSummary] = useState(false)
  const [summaryContent, setSummaryContent] = useState<string>('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryType, setSummaryType] = useState<'week' | 'month'>('week')
  
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [newExpense, setNewExpense] = useState<Omit<ExpenseItem, 'id'>>({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString()
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/expenses/all`, {
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
          date: expense.createdAt.split('T')[0]
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

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/expenses/add`, expenseData, {
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
          date: newExpense.date
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
          date: new Date().toISOString()  
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
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/expenses/delete/${id}`, {
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

  const expenseTotalsByDate = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const dateKey = expense.date ?? new Date().toISOString().split('T')[0]
      acc[dateKey] = (acc[dateKey] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }, [expenses])

  const weeklyTrendData = useMemo(() => {
    const labels: string[] = []
    const dataPoints: number[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const current = new Date(today)
      current.setDate(today.getDate() - i)
      const key = current.toISOString().split('T')[0]
      labels.push(current.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric'
      }))
      dataPoints.push(expenseTotalsByDate[key] ?? 0)
    }

    return {
      labels,
      datasets: [
        {
          label: 'Daily Spend',
          data: dataPoints,
          borderColor: '#001F3F',
          backgroundColor: 'rgba(0, 127, 255, 0.25)',
          pointBackgroundColor: '#FFD700',
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 5
        }
      ]
    }
  }, [expenseTotalsByDate])

  const weeklyTrendOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `₹${context.parsed.y?.toFixed(2) ?? 0}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#001F3F',
          font: {
            family: 'inherit',
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 31, 63, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#001F3F',
          font: {
            family: 'inherit',
            weight: 'bold'
          },
          callback: (value: number | string) => `₹${value}`
        },
        grid: {
          color: 'rgba(0, 31, 63, 0.1)'
        }
      }
    }
  }), [])

  const categoryChartData = useMemo(() => {
    const entries = Object.entries(categoryTotals)
    const colors = [
      '#007FFF',
      '#001F3F',
      '#33A1FF',
      '#99CFFF',
      '#FFD700',
      '#FF7A00',
      '#8E44AD',
      '#2ECC71'
    ]

    return {
      labels: entries.map(([category]) => category),
      datasets: [
        {
          data: entries.map(([, amount]) => amount),
          backgroundColor: entries.map((_, index) => colors[index % colors.length]),
          borderColor: '#001F3F',
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    }
  }, [categoryTotals])

  const categoryChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#001F3F',
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `₹${context.parsed.toFixed(2)}`
        }
      }
    },
    cutout: '55%'
  }), [])

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    // Parse as local date (YYYY-MM-DD) to avoid timezone shift
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    // JS Date: month is 0-indexed
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  }

  const weekChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0

  // Get expenses for a specific period
  const getExpensesForPeriod = (period: 'week' | 'month'): ExpenseItem[] => {
    const now = new Date()
    const daysBack = period === 'week' ? 7 : 30
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
    
    return expenses.filter(expense => {
      const expenseDate = expense.date ? new Date(expense.date) : new Date()
      return expenseDate >= cutoffDate
    })
  }

  // Generate expense summary
  const generateSummary = async (period: 'week' | 'month') => {
    setSummaryLoading(true)
    setSummaryType(period)
    setError('')
    
    try {
      const periodExpenses = getExpensesForPeriod(period)
      const periodLabel = period === 'week' ? 'Past Week' : 'Past Month'
      
      if (periodExpenses.length === 0) {
        setSummaryContent(`## ${periodLabel} Summary

No expenses found for the ${period === 'week' ? 'past week' : 'past month'}. Start tracking your expenses to get detailed insights!

Tip: Add some expenses using the form above to generate meaningful summaries.`)
        setShowSummary(true)
        return
      }
      
      const summaryRequest: SummaryRequest = {
        expenses: periodExpenses,
        period,
        periodLabel
      }
      
      const summary = await expenseSummarizerAgent(summaryRequest)
      setSummaryContent(summary)
      setShowSummary(true)
    } catch (error) {
      console.error('Error generating summary:', error)
      setError('Failed to generate expense summary. Please try again.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const summaryNodes = useMemo<SummaryNode[]>(() => {
    if (!summaryContent) return []

    const lines = summaryContent.split('\n')
    const nodes: SummaryNode[] = []
    let currentList: string[] = []

    const stripMarkdown = (value: string) => value
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`+/g, '')
      .trim()

    const flushList = () => {
      if (currentList.length === 0) return
      nodes.push({ type: 'list', items: currentList })
      currentList = []
    }

    lines.forEach((line: string) => {
      const trimmed = line.trim()

      if (!trimmed) {
        flushList()
        return
      }

      if (/^#{1,6}\s+/.test(trimmed)) {
        flushList()
        const heading = stripMarkdown(trimmed.replace(/^#{1,6}\s+/, ''))
        if (heading) {
          nodes.push({ type: 'heading', content: heading })
        }
        return
      }

      if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        const item = stripMarkdown(trimmed.replace(/^([-*•]|\d+\.)\s+/, ''))
        if (item) {
          currentList.push(item)
        }
        return
      }

      flushList()
      const text = stripMarkdown(trimmed)
      if (text) {
        nodes.push({ type: 'text', content: text })
      }
    })

    flushList()
    return nodes
  }, [summaryContent])

  const handleExportSummary = useCallback(() => {
    if (!summaryNodes.length) return

    const doc = new jsPDF()
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let cursorY = margin + 10

    const ensureSpace = (lineHeight: number) => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage()
        cursorY = margin
      }
    }

    const addParagraph = (text: string, options: { bold?: boolean; extraSpace?: number } = {}) => {
      const { bold = false, extraSpace = 6 } = options
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(bold ? 14 : 11)
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
      lines.forEach((line: string) => {
        ensureSpace(14)
        doc.text(line, margin, cursorY)
        cursorY += 14
      })
      cursorY += extraSpace
    }

    const addListItem = (text: string) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const lines = doc.splitTextToSize(`• ${text}`, pageWidth - margin * 2)
      lines.forEach((line: string) => {
        ensureSpace(12)
        doc.text(line, margin, cursorY)
        cursorY += 12
      })
      cursorY += 4
    }

    addParagraph(`${summaryType === 'week' ? 'Weekly' : 'Monthly'} Expense Summary`, { bold: true, extraSpace: 10 })

    summaryNodes.forEach((node: SummaryNode) => {
      if (node.type === 'heading') {
        addParagraph(node.content.toUpperCase(), { bold: true, extraSpace: 4 })
      } else if (node.type === 'text') {
        addParagraph(node.content)
      } else if (node.type === 'list') {
        node.items.forEach(addListItem)
        cursorY += 4
      }
    })

    doc.save(`finfluenzz-${summaryType}-summary.pdf`)
  }, [summaryNodes, summaryType])

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

      {/* AI Summary Section */}
      <div className={`bg-gradient-to-r from-purple-100 to-blue-100 border-4 border-purple-500 ${
        isMobile ? 'p-4' : 'p-6'
      }`} style={{ borderRadius: '0px' }}>
        <div className={`flex items-center justify-between mb-4 ${
          isMobile ? 'flex-col space-y-3' : ''
        }`}>
          <h3 className={`font-bold text-purple-800 tracking-wide flex items-center space-x-2 ${
            isMobile ? 'text-lg text-center' : 'text-xl'
          }`}>
            <BarChart3 className={`text-purple-600 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            <span>🤖 AI EXPENSE SUMMARY</span>
          </h3>
          
          <div className={`flex space-x-2 ${
            isMobile ? 'w-full' : ''
          }`}>
            <button
              onClick={() => generateSummary('week')}
              disabled={summaryLoading || expenses.length === 0}
              className={`bg-purple-500 text-white border-2 border-purple-600 hover:bg-purple-600 transition-colors font-bold disabled:opacity-50 flex items-center space-x-2 ${
                isMobile ? 'flex-1 px-3 py-2 text-sm' : 'px-4 py-2'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {summaryLoading && summaryType === 'week' ? (
                <Loader2 className={`animate-spin ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              ) : (
                <Calendar className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              )}
              <span>WEEK SUMMARY</span>
            </button>
            
            <button
              onClick={() => generateSummary('month')}
              disabled={summaryLoading || expenses.length === 0}
              className={`bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 transition-colors font-bold disabled:opacity-50 flex items-center space-x-2 ${
                isMobile ? 'flex-1 px-3 py-2 text-sm' : 'px-4 py-2'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {summaryLoading && summaryType === 'month' ? (
                <Loader2 className={`animate-spin ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              ) : (
                <FileText className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              )}
              <span>MONTH SUMMARY</span>
            </button>

            <button
              onClick={handleExportSummary}
              disabled={!summaryNodes.length}
              className={`bg-white text-purple-600 border-2 border-purple-400 hover:bg-purple-100 transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 ${
                isMobile ? 'flex-1 px-3 py-2 text-sm' : 'px-4 py-2'
              }`}
              style={{ borderRadius: '0px' }}
            >
              <Download className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
              <span>EXPORT PDF</span>
            </button>
          </div>
        </div>
        
        {expenses.length === 0 && (
          <div className="text-center py-4">
            <p className={`text-purple-700 opacity-80 ${
              isMobile ? 'text-sm' : ''
            }`}>
              Add some expenses to generate AI-powered summaries and insights! 🚀
            </p>
          </div>
        )}
        
        {showSummary && summaryContent && (
          <div className="mt-4">
            <div className={`bg-white/80 border-2 border-purple-300 ${
              isMobile ? 'p-3' : 'p-4'
            }`} style={{ borderRadius: '0px' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-bold text-purple-800 ${
                  isMobile ? 'text-sm' : 'text-base'
                }`}>
                  📊 {summaryType === 'week' ? 'Weekly' : 'Monthly'} Analysis
                </h4>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-purple-600 hover:text-purple-800 transition-colors text-sm"
                >
                  ✕ Close
                </button>
              </div>
              <div 
                className={`text-[#001F3F] leading-relaxed space-y-3 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}
              >
                {summaryNodes.length === 0 ? (
                  <p>No summary content available.</p>
                ) : (
                  summaryNodes.map((node, index) => {
                    if (node.type === 'heading') {
                      return (
                        <p key={`heading-${index}`} className="font-bold text-purple-700 uppercase tracking-wide">
                          {node.content}
                        </p>
                      )
                    }

                    if (node.type === 'list') {
                      return (
                <ul key={`list-${index}`} className="list-disc pl-5 space-y-1 marker:text-purple-500">
                          {node.items.map((item, itemIndex) => (
                            <li key={`list-${index}-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      )
                    }

                    return (
                      <p key={`text-${index}`}>{node.content}</p>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Visual Analytics */}
      {(Object.keys(categoryTotals).length > 0 || expenses.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-[#001F3F] tracking-wide ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}>
              📈 Visual Analytics
            </h3>
            <span className="text-xs font-mono text-[#001F3F]/60 uppercase tracking-[0.2em]">
              last updated {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>

          <div className={`grid gap-4 ${
            isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {/* Weekly Trend Chart */}
            {expenses.length > 0 && (
              <div className={`bg-white/80 border-4 border-[#001F3F] shadow-[6px_6px_0_0_#001F3F] ${
                isMobile ? 'p-4' : 'p-6'
              }`} style={{ borderRadius: '0px', boxShadow: 'inset 0 0 0 2px #007FFF' }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-bold text-[#001F3F] tracking-wide flex items-center gap-2 ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>
                    <TrendingUp className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[#007FFF]`} />
                    Weekly Spend Trend
                  </h4>
                  <span className="text-sm font-mono text-[#001F3F]/70">Last 7 days</span>
                </div>
                <div className="h-64">
                  <Line data={weeklyTrendData} options={weeklyTrendOptions as any} />
                </div>
              </div>
            )}

            {/* Category Doughnut Chart */}
            {Object.keys(categoryTotals).length > 0 && (
              <div className={`bg-white/80 border-4 border-[#001F3F] shadow-[6px_6px_0_0_#001F3F] ${
                isMobile ? 'p-4' : 'p-6'
              }`} style={{ borderRadius: '0px', boxShadow: 'inset 0 0 0 2px #007FFF' }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-bold text-[#001F3F] tracking-wide flex items-center gap-2 ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>
                    <BarChart3 className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[#007FFF]`} />
                    Category Allocation
                  </h4>
                  <span className="text-sm font-mono text-[#001F3F]/70">This week</span>
                </div>
                <div className={`${isMobile ? 'h-64' : 'h-72'} flex items-center justify-center`}>
                  <Doughnut data={categoryChartData} options={categoryChartOptions} />
                </div>
              </div>
            )}
          </div>
        </section>
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