import { useState, useEffect } from 'react'
import axios from 'axios'
import { Trophy, CheckCircle, Star, Clock, Calendar, RefreshCw } from 'lucide-react'
import challengeAgent from '../../Agents/challengeAgent'
import type { UserProfile, ExpenseItem, Challenge } from '../../Agents/challengeAgent'

interface ChallengesTabProps {
  userProfile?: Partial<UserProfile>
}

// Cache configuration
const CACHE_KEY = 'finfluenzz-challenges-expenses-cache'
const CHALLENGES_CACHE_KEY = 'finfluenzz-generated-challenges'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

interface CachedExpenses {
  data: ExpenseItem[]
  timestamp: number
}

interface CachedChallenges {
  challenges: Challenge[]
  generatedAt: number
}

export default function ChallengesTab({ userProfile }: ChallengesTabProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(false)
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)

  // Mock user profile data - in real app this would come from signup/profile
  const defaultProfile: UserProfile = {
    currentlyEarn: 'yes',
    employmentType: 'student',
    mainPurpose: 'saving',
    financeKnowledge: 'beginner',
    weeklyExpenses: []
  }

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
  const cacheExpenses = (expenses: ExpenseItem[]) => {
    try {
      const cacheData: CachedExpenses = {
        data: expenses,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache expenses:', error)
    }
  }

  // Save challenges to localStorage
  const saveChallenges = (challengeList: Challenge[]) => {
    try {
      const challengeData: CachedChallenges = {
        challenges: challengeList,
        generatedAt: Date.now()
      }
      localStorage.setItem(CHALLENGES_CACHE_KEY, JSON.stringify(challengeData))
    } catch (error) {
      console.warn('Failed to save challenges:', error)
    }
  }

  // Load challenges from localStorage
  const loadSavedChallenges = (): Challenge[] => {
    try {
      const saved = localStorage.getItem(CHALLENGES_CACHE_KEY)
      if (!saved) return []
      
      const { challenges }: CachedChallenges = JSON.parse(saved)
      return challenges || []
    } catch (error) {
      console.warn('Failed to load saved challenges:', error)
      return []
    }
  }

  // Clear saved challenges
  const clearSavedChallenges = () => {
    try {
      localStorage.removeItem(CHALLENGES_CACHE_KEY)
    } catch (error) {
      console.warn('Failed to clear saved challenges:', error)
    }
  }

  // Get when challenges were generated
  const getChallengeGenerationTime = (): string | null => {
    try {
      const saved = localStorage.getItem(CHALLENGES_CACHE_KEY)
      if (!saved) return null
      
      const { generatedAt }: CachedChallenges = JSON.parse(saved)
      const date = new Date(generatedAt)
      return date.toLocaleString()
    } catch {
      return null
    }
  }

  // Load expenses with caching
  const loadExpenses = async (forceRefresh = false) => {
    // Use cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      const cachedData = getCachedExpenses()
      if (cachedData) {
        setAllExpenses(cachedData)
        setLoadingExpenses(false)
        return
      }
    }

    try {
      setLoadingExpenses(true)
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
          date: expense.createdAt // Use createdAt from backend
        }))
        
        setAllExpenses(mappedExpenses)
        cacheExpenses(mappedExpenses) // Cache the data
      }
    } catch (error) {
      console.error('Error fetching expenses for challenges:', error)
      
      // Clear cache on auth errors to prevent data leakage
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem(CACHE_KEY)
        clearSavedChallenges() // Also clear saved challenges on auth error
      }
      
      setAllExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    // Load expenses with smart caching
    loadExpenses() // This will use cache if valid
    
    // Load saved challenges
    const savedChallenges = loadSavedChallenges()
    if (savedChallenges.length > 0) {
      setChallenges(savedChallenges)
    }
    
    // Listen for expense updates from Budget Tracker
    const handleExpenseUpdate = () => {
      loadExpenses(true) // Force refresh when expenses are updated
    }
    
    window.addEventListener('expensesUpdated', handleExpenseUpdate)
    
    return () => {
      window.removeEventListener('expensesUpdated', handleExpenseUpdate)
    }
  }, [])

  // Filter expenses to last week only using createdAt field
  const getLastWeekExpenses = (): ExpenseItem[] => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    return allExpenses.filter(expense => {
      // Parse the ISO date string from createdAt field
      const expenseDate = new Date(expense.date) // expense.date now contains createdAt from API
      return expenseDate >= oneWeekAgo
    })
  }

  const lastWeekExpenses = getLastWeekExpenses()
  const finalProfile = { 
    ...defaultProfile, 
    ...userProfile, 
    weeklyExpenses: lastWeekExpenses.map(expense => ({
      category: expense.category,
      amount: expense.amount,
      description: expense.description
    }))
  }

  const generateChallenges = async () => {
    setLoading(true)
    try {
      const newChallenges = await challengeAgent(finalProfile)
      setChallenges(newChallenges)
      saveChallenges(newChallenges) // Persist the generated challenges
    } catch (error) {
      console.error('Failed to generate challenges:', error)
      // Fallback to some default challenges based on expenses
      const defaultChallenges = getDefaultChallenges()
      setChallenges(defaultChallenges)
      saveChallenges(defaultChallenges) // Persist the default challenges too
    } finally {
      setLoading(false)
    }
  }



  const getDefaultChallenges = (): Challenge[] => {
    const weeklyTotal = lastWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const topCategory = getTopSpendingCategory()
    
    const baseChallenges: Challenge[] = [
      {
        id: "save_quest_1",
        title: "🎮 THE PENNY COLLECTOR",
        description: `Save ₹${Math.max(50, Math.round(weeklyTotal * 0.1))} this week by finding deals or skipping purchases`,
        category: "SAVING_QUEST",
        difficulty: "NOOB",
        xpReward: 50,
        deadline: "7 days",
        emoji: "💰",
        completed: false
      },
      {
        id: "budget_battle_1",
        title: "🎯 EXPENSE TRACKER PRO",
        description: "Continue tracking your expenses - you're doing great! Add 5 more expenses this week.",
        category: "BUDGET_BATTLE",
        difficulty: "PLAYER",
        xpReward: 75,
        deadline: "7 days",
        emoji: "📊",
        completed: false
      }
    ]

    if (topCategory) {
      baseChallenges.push({
        id: "category_challenge",
        title: `🏹 ${topCategory.toUpperCase()} MASTER`,
        description: `Reduce your ${topCategory.toLowerCase()} spending by 15% this week. Your current weekly average is ₹${Math.round(weeklyTotal * 0.3)}.`,
        category: "SAVING_QUEST",
        difficulty: "PLAYER",
        xpReward: 100,
        deadline: "7 days",
        emoji: "🎯",
        completed: false
      })
    }

    if (finalProfile.mainPurpose === 'investing') {
      baseChallenges.push({
        id: "investment_mission_1",
        title: "🚀 ROOKIE INVESTOR",
        description: "Research 3 beginner-friendly stocks and write down what you learned about each one",
        category: "INVESTMENT_MISSION",
        difficulty: finalProfile.financeKnowledge === 'beginner' ? "NOOB" : "PLAYER",
        xpReward: 125,
        deadline: "7 days",
        emoji: "📈",
        completed: false
      })
    }

    return baseChallenges
  }

  const getTopSpendingCategory = (): string | null => {
    const categoryTotals = lastWeekExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    const entries = Object.entries(categoryTotals)
    if (entries.length === 0) return null

    return entries.reduce((top, [category, amount]) => 
      amount > (categoryTotals[top] || 0) ? category : top
    , entries[0][0])
  }

  const completeChallenge = (challengeId: string) => {
    const updatedChallenges = challenges.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, completed: true }
        : challenge
    )
    setChallenges(updatedChallenges)
    saveChallenges(updatedChallenges) // Persist the completion
  }

  const removeCompletedChallenge = (challengeId: string) => {
    const updatedChallenges = challenges.filter(challenge => challenge.id !== challengeId)
    setChallenges(updatedChallenges)
    saveChallenges(updatedChallenges) // Persist the removal
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SAVING_QUEST': return 'bg-green-500'
      case 'INVESTMENT_MISSION': return 'bg-blue-500'
      case 'BUDGET_BATTLE': return 'bg-purple-500'
      case 'KNOWLEDGE_RAID': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'NOOB': return 'text-green-600'
      case 'PLAYER': return 'text-yellow-600'
      case 'PRO': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const totalLastWeekExpenses = lastWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#001F3F] mb-2 tracking-wider">
          🏆 GAMIFIED CHALLENGES
        </h2>
        <p className="text-[#001F3F] opacity-70">
          Complete financial challenges to level up your money skills!
        </p>
      </div>

      {/* Expense Summary from Last Week */}
      <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
        <h3 className="text-xl font-bold text-[#001F3F] mb-4 tracking-wide flex items-center space-x-2">
          <Calendar className="w-6 h-6" />
          <span>📊 LAST WEEK ANALYSIS</span>
        </h3>
        
        {loadingExpenses ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-[#007FFF] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#001F3F] font-bold">LOADING EXPENSES...</p>
          </div>
        ) : lastWeekExpenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/50 border-2 border-[#007FFF]/30 p-4 text-center">
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">TOTAL SPENT</p>
              <p className="text-2xl font-bold text-[#001F3F]">₹{totalLastWeekExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50/50 border-2 border-[#007FFF]/30 p-4 text-center">
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">TRANSACTIONS</p>
              <p className="text-2xl font-bold text-[#001F3F]">{lastWeekExpenses.length}</p>
            </div>
            <div className="bg-blue-50/50 border-2 border-[#007FFF]/30 p-4 text-center">
              <p className="text-sm text-[#001F3F] opacity-70 font-bold">TOP CATEGORY</p>
              <p className="text-lg font-bold text-[#001F3F]">{getTopSpendingCategory() || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#001F3F] opacity-70 mb-4">
              No expenses found for the last week. Add some expenses in the Budget Tracker to generate personalized challenges!
            </p>
            <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-none">
              <p className="text-yellow-800 font-bold">
                💡 Tip: Go to Budget Tracker → Add your weekly expenses → Come back here to generate challenges!
              </p>
            </div>
          </div>
        )}

        {/* Generate Challenges Button */}
        <div className="text-center mt-6 space-y-3">
          <div className="flex justify-center space-x-4">
            <button
              onClick={generateChallenges}
              disabled={loading || loadingExpenses}
              className="bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white px-8 py-3 border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] transition-all font-bold tracking-wider disabled:opacity-50 flex items-center space-x-2"
              style={{ borderRadius: '0px' }}
            >
              <RefreshCw className={`w-5 h-5 ${(loading || loadingExpenses) ? 'animate-spin' : ''}`} />
              <span>
                {loadingExpenses ? '📊 LOADING DATA...' : loading ? '🎮 GENERATING...' : '🎮 GENERATE CHALLENGES'}
              </span>
            </button>
            
            <button
              onClick={() => loadExpenses(true)}
              disabled={loadingExpenses}
              className="bg-gray-600 text-white px-4 py-3 border-2 border-gray-700 hover:bg-gray-700 transition-all font-bold tracking-wider disabled:opacity-50 flex items-center space-x-2"
              style={{ borderRadius: '0px' }}
              title="Refresh expense data from server"
            >
              <RefreshCw className={`w-4 h-4 ${loadingExpenses ? 'animate-spin' : ''}`} />
              <span>REFRESH DATA</span>
            </button>
          </div>
          
          {!loadingExpenses && (
            <div className="text-xs text-[#001F3F] opacity-60">
              {isCacheValid() ? (
                <span>📋 Using cached data (refreshes every 5 minutes)</span>
              ) : (
                <span>🔄 Data loaded from server</span>
              )}
            </div>
          )}
          
          {!loadingExpenses && lastWeekExpenses.length === 0 && (
            <p className="text-sm text-[#001F3F] opacity-70">
              Will generate basic challenges without expense data
            </p>
          )}
        </div>
      </div>

      {/* Challenges Display */}
      {challenges.length > 0 && (
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-[#001F3F] tracking-wide">
              🎯 YOUR PERSONALIZED CHALLENGES
            </h3>
            <button
              onClick={() => {
                setChallenges([])
                clearSavedChallenges()
              }}
              className="bg-red-500 text-white px-4 py-2 border-2 border-red-600 hover:bg-red-600 transition-colors font-bold text-sm"
              style={{ borderRadius: '0px' }}
              title="Clear all challenges and start fresh"
            >
              CLEAR ALL
            </button>
          </div>
          
          {getChallengeGenerationTime() && (
            <div className="text-center mb-4">
              <p className="text-xs text-[#001F3F] opacity-60">
                Generated: {getChallengeGenerationTime()}
              </p>
            </div>
          )}
          
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`bg-white/80 border-4 p-6 transition-all hover:shadow-lg ${
                  challenge.completed ? 'border-green-500 bg-green-50/50' : 'border-[#007FFF]'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{challenge.emoji}</span>
                      <div>
                        <h4 className="text-lg font-bold text-[#001F3F] tracking-wide">
                          {challenge.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`inline-block px-2 py-1 ${getCategoryColor(challenge.category)} text-white font-bold`}>
                            {challenge.category.replace('_', ' ')}
                          </span>
                          <span className={`font-bold ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[#001F3F] mb-4 leading-relaxed">
                      {challenge.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-[#001F3F] opacity-70">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>{challenge.xpReward} XP</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{challenge.deadline}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {!challenge.completed ? (
                      <button
                        onClick={() => completeChallenge(challenge.id)}
                        className="bg-green-500 text-white px-4 py-2 border-2 border-green-600 hover:bg-green-600 transition-colors font-bold flex items-center space-x-2"
                        style={{ borderRadius: '0px' }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>COMPLETE</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-green-500 text-white px-4 py-2 border-2 border-green-600 font-bold text-center">
                          ✅ COMPLETED!
                        </div>
                        <button
                          onClick={() => removeCompletedChallenge(challenge.id)}
                          className="bg-red-500 text-white px-4 py-2 border-2 border-red-600 hover:bg-red-600 transition-colors font-bold text-sm"
                          style={{ borderRadius: '0px' }}
                        >
                          REMOVE
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-[#007FFF] mx-auto mb-4 opacity-50" />
          <p className="text-[#001F3F] text-lg opacity-70 mb-4">
            Ready to start your financial journey?
          </p>
          <p className="text-[#001F3F] opacity-60">
            Click "Generate Challenges" to get personalized tasks based on your spending patterns!
          </p>
        </div>
      )}
    </div>
  )
} 