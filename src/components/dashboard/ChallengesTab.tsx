import  { useState, useEffect } from 'react'
import { Trophy, CheckCircle, Star, Clock, Calendar, RefreshCw, Bug } from 'lucide-react'
import challengeAgent from '../../Agents/challengeAgent'
import type { UserProfile, ExpenseItem, Challenge } from '../../Agents/challengeAgent'

interface ChallengesTabProps {
  userProfile?: Partial<UserProfile>
}

export default function ChallengesTab({ userProfile }: ChallengesTabProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(false)
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([])

  // Mock user profile data - in real app this would come from signup/profile
  const defaultProfile: UserProfile = {
    currentlyEarn: 'yes',
    employmentType: 'student',
    mainPurpose: 'saving',
    financeKnowledge: 'beginner',
    weeklyExpenses: []
  }

  // Get expenses from localStorage (from Budget Tracker)
  useEffect(() => {
    const loadExpenses = () => {
      const saved = localStorage.getItem('finfluenzz-expenses')
      const expenses = saved ? JSON.parse(saved) : []
      setAllExpenses(expenses)
    }

    loadExpenses()
    
    // Listen for storage changes (when expenses are updated in Budget Tracker)
    const handleStorageChange = () => {
      loadExpenses()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event when localStorage is updated in same tab
    window.addEventListener('expensesUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('expensesUpdated', handleStorageChange)
    }
  }, [])

  // Filter expenses to last week only
  const getLastWeekExpenses = (): ExpenseItem[] => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    return allExpenses.filter(expense => new Date(expense.date) >= oneWeekAgo)
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
    } catch (error) {
      console.error('Failed to generate challenges:', error)
      // Fallback to some default challenges based on expenses
      setChallenges(getDefaultChallenges())
    } finally {
      setLoading(false)
    }
  }

  // Test function with dummy data
  const testChallengeGeneration = async () => {
    setLoading(true)
    try {
      const dummyProfile: UserProfile = {
        currentlyEarn: 'yes',
        employmentType: 'student',
        mainPurpose: 'saving',
        financeKnowledge: 'beginner',
        weeklyExpenses: [
          { category: 'Food', amount: 450, description: 'Lunch at cafeteria' },
          { category: 'Transport', amount: 120, description: 'Bus fare' },
          { category: 'Entertainment', amount: 500, description: 'Movie tickets' },
          { category: 'Food', amount: 85, description: 'Coffee' }
        ]
      }
      
      console.log('Testing with dummy profile:', dummyProfile)
      const newChallenges = await challengeAgent(dummyProfile)
      setChallenges(newChallenges)
    } catch (error) {
      console.error('Failed to generate test challenges:', error)
      setChallenges(getDefaultChallenges())
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
    setChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, completed: true }
          : challenge
      )
    )
  }

  const removeCompletedChallenge = (challengeId: string) => {
    setChallenges(prev => prev.filter(challenge => challenge.id !== challengeId))
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
        
        {lastWeekExpenses.length > 0 ? (
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
              disabled={loading}
              className="bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white px-8 py-3 border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] transition-all font-bold tracking-wider disabled:opacity-50 flex items-center space-x-2"
              style={{ borderRadius: '0px' }}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '🎮 GENERATING...' : '🎮 GENERATE CHALLENGES'}</span>
            </button>
            
            <button
              onClick={testChallengeGeneration}
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-3 border-2 border-orange-600 hover:bg-orange-600 transition-all font-bold tracking-wider disabled:opacity-50 flex items-center space-x-2"
              style={{ borderRadius: '0px' }}
            >
              <Bug className="w-5 h-5" />
              <span>TEST WITH DUMMY DATA</span>
            </button>
          </div>
          
          {lastWeekExpenses.length === 0 && (
            <p className="text-sm text-[#001F3F] opacity-70">
              Will generate basic challenges without expense data
            </p>
          )}
        </div>
      </div>

      {/* Challenges Display */}
      {challenges.length > 0 && (
        <div className="bg-white/60 border-4 border-[#007FFF] p-6" style={{ borderRadius: '0px' }}>
          <h3 className="text-2xl font-bold text-[#001F3F] mb-6 tracking-wide text-center">
            🎯 YOUR PERSONALIZED CHALLENGES
          </h3>
          
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