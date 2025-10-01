import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

export interface User {
  id: string
  email: string
  username: string
  age: number
  goal: string
  employmentType: string
  financeKnowledge: string
  earn: number
  earnedXp: number
  completedChallenges: number
  currentLevel: number
}

export interface LevelInfo {
  currentLevel: number
  currentXp: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  xpProgress: number
  progressPercentage: number
  canLevelUp: boolean
}

interface CachedUser {
  data: User
  timestamp: number
  userId: string
}

// Global cache configuration
const USER_CACHE_KEY = 'finfluenzz_global_user_cache'
const USER_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes - longer for global use

// Global user state for sharing across tabs
let globalUserState: {
  user: User | null
  isLoading: boolean
  error: string | null
  lastFetch: number
} = {
  user: null,
  isLoading: false,
  error: null,
  lastFetch: 0
}

// Global listeners for user state changes
const globalListeners = new Set<() => void>()

// XP requirements for each level (exponential growth)
export const XP_REQUIREMENTS = [
  0,    // Level 1 (starting level)
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
  3250, // Level 11
  3850, // Level 12
  4500, // Level 13
  5200, // Level 14
  5950, // Level 15
  6750, // Level 16
  7600, // Level 17
  8500, // Level 18
  9450, // Level 19
  10450, // Level 20
]

// Global cache utilities
const getCurrentUserId = () => {
  const token = localStorage.getItem('Authorization')
  if (!token) return null
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.userId || payload.id || 'anonymous'
  } catch {
    return 'anonymous'
  }
}

const loadUserFromCache = (): User | null => {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    if (!cached) return null

    const cachedData: CachedUser = JSON.parse(cached)
    const currentUserId = getCurrentUserId()
    const now = Date.now()

    if (
      cachedData.timestamp &&
      (now - cachedData.timestamp) < USER_CACHE_DURATION &&
      cachedData.userId === currentUserId &&
      cachedData.data
    ) {
      console.log('Loading user from global cache')
      return cachedData.data
    }

    localStorage.removeItem(USER_CACHE_KEY)
    return null
  } catch (error) {
    console.error('Error loading user from cache:', error)
    localStorage.removeItem(USER_CACHE_KEY)
    return null
  }
}

const saveUserToCache = (userData: User): void => {
  try {
    const currentUserId = getCurrentUserId()
    if (!currentUserId) return

    const cacheData: CachedUser = {
      data: userData,
      timestamp: Date.now(),
      userId: currentUserId
    }

    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData))
    console.log('User data saved to global cache')
  } catch (error) {
    console.error('Error saving user to cache:', error)
  }
}

const clearUserCache = (): void => {
  localStorage.removeItem(USER_CACHE_KEY)
  console.log('Global user cache cleared')
}

const notifyGlobalListeners = () => {
  globalListeners.forEach(callback => callback())
}

const updateGlobalUserState = (updates: Partial<typeof globalUserState>) => {
  globalUserState = { ...globalUserState, ...updates }
  notifyGlobalListeners()
}

// Global user fetching function
const fetchUserGlobally = async (forceRefresh = false): Promise<User | null> => {
  // If already loading, wait for the current request
  if (globalUserState.isLoading && !forceRefresh) {
    return new Promise((resolve) => {
      const checkLoading = () => {
        if (!globalUserState.isLoading) {
          resolve(globalUserState.user)
        } else {
          setTimeout(checkLoading, 100)
        }
      }
      checkLoading()
    })
  }

  // Check if we have recent data and don't need to refresh
  const now = Date.now()
  if (!forceRefresh && 
      globalUserState.user && 
      (now - globalUserState.lastFetch) < USER_CACHE_DURATION) {
    console.log('Using recent global user data')
    return globalUserState.user
  }

  // Try cache first
  if (!forceRefresh) {
    const cachedUser = loadUserFromCache()
    if (cachedUser) {
      updateGlobalUserState({
        user: cachedUser,
        error: null,
        lastFetch: now
      })
      return cachedUser
    }
  }

  // Fetch from API
  updateGlobalUserState({ isLoading: true, error: null })

  try {
    console.log('Fetching user from API (global)')
    const response = await axios.get('https://finfluenzz.lakshyapaliwal200.workers.dev/api/user/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
      }
    })

    if (response.status !== 200) {
      throw new Error('Failed to fetch user data')
    }

    const userData = response.data.user
    saveUserToCache(userData)
    
    updateGlobalUserState({
      user: userData,
      isLoading: false,
      error: null,
      lastFetch: now
    })

    return userData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user data'
    console.error('Error fetching user:', error)
    
    updateGlobalUserState({
      isLoading: false,
      error: errorMessage
    })
    
    return null
  }
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(globalUserState.user)
  const [isLoading, setIsLoading] = useState(globalUserState.isLoading)
  const [error, setError] = useState<string | null>(globalUserState.error)
  const hasFetchedRef = useRef(false)

  // Subscribe to global state changes
  useEffect(() => {
    const updateLocalState = () => {
      setUser(globalUserState.user)
      setIsLoading(globalUserState.isLoading)
      setError(globalUserState.error)
    }

    globalListeners.add(updateLocalState)

    // Initial load if not already done
    if (!hasFetchedRef.current && !globalUserState.user) {
      fetchUserGlobally()
      hasFetchedRef.current = true
    } else if (globalUserState.user) {
      // Use existing global data
      updateLocalState()
    }

    return () => {
      globalListeners.delete(updateLocalState)
    }
  }, [])

  // Get auth headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
  })

  // Fetch user data (uses global cache)
  const fetchUser = useCallback(async (forceRefresh = false) => {
    await fetchUserGlobally(forceRefresh)
  }, [])

  // Calculate level information
  const getLevelInfo = useCallback((): LevelInfo => {
    if (!user) {
      return {
        currentLevel: 1,
        currentXp: 0,
        xpForCurrentLevel: 0,
        xpForNextLevel: XP_REQUIREMENTS[1],
        xpProgress: 0,
        progressPercentage: 0,
        canLevelUp: false
      }
    }

    const currentLevel = user.currentLevel
    const currentXp = user.earnedXp
    const xpForCurrentLevel = XP_REQUIREMENTS[currentLevel - 1] || 0
    const xpForNextLevel = XP_REQUIREMENTS[currentLevel] || XP_REQUIREMENTS[XP_REQUIREMENTS.length - 1]
    
    const xpProgress = currentXp - xpForCurrentLevel
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel
    const progressPercentage = xpNeededForNext > 0 ? (xpProgress / xpNeededForNext) * 100 : 100
    
    const canLevelUp = currentXp >= xpForNextLevel && currentLevel < XP_REQUIREMENTS.length

    return {
      currentLevel,
      currentXp,
      xpForCurrentLevel,
      xpForNextLevel,
      xpProgress,
      progressPercentage: Math.min(progressPercentage, 100),
      canLevelUp
    }
  }, [user])

  // Level up user
  const levelUp = async () => {
    if (!user) return

    updateGlobalUserState({ isLoading: true, error: null })

    try {
      const response = await axios.post('https://finfluenzz.lakshyapaliwal200.workers.dev/api/user/levelup', {}, {
        headers: getAuthHeaders()
      })

      if (response.status !== 200) {
        throw new Error('Failed to level up')
      }

      const userData = response.data.user
      saveUserToCache(userData)
      
      updateGlobalUserState({
        user: userData,
        isLoading: false,
        lastFetch: Date.now()
      })

      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to level up'
      updateGlobalUserState({
        isLoading: false,
        error: errorMessage
      })
      throw err
    }
  }

  // Fix user level based on current XP
  const fixUserLevel = async () => {
    if (!user) return

    updateGlobalUserState({ isLoading: true, error: null })

    try {
      const response = await axios.post('https://finfluenzz.lakshyapaliwal200.workers.dev/api/user/fix-level', {}, {
        headers: getAuthHeaders()
      })

      if (response.status !== 200) {
        throw new Error('Failed to fix user level')
      }

      const userData = response.data.user
      saveUserToCache(userData)
      
      updateGlobalUserState({
        user: userData,
        isLoading: false,
        lastFetch: Date.now()
      })

      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fix user level'
      updateGlobalUserState({
        isLoading: false,
        error: errorMessage
      })
      throw err
    }
  }

  // Get level name based on level number
  const getLevelName = useCallback((level: number): string => {
    const levelNames = [
      'Novice',      // 1
      'Learner',     // 2
      'Explorer',    // 3
      'Achiever',    // 4
      'Challenger',  // 5
      'Expert',      // 6
      'Master',      // 7
      'Champion',    // 8
      'Legend',      // 9
      'Mythic',      // 10
      'Immortal',    // 11
      'Godlike',     // 12
      'Transcendent', // 13
      'Omnipotent',  // 14
      'Ultimate',    // 15
      'Supreme',     // 16
      'Divine',      // 17
      'Cosmic',      // 18
      'Universal',   // 19
      'Infinite'     // 20
    ]
    
    return levelNames[level - 1] || 'Max Level'
  }, [])

  // Get level color based on level number
  const getLevelColor = useCallback((level: number): string => {
    if (level <= 3) return 'text-gray-500'        // Gray for beginners
    if (level <= 6) return 'text-green-500'       // Green for intermediate
    if (level <= 9) return 'text-blue-500'        // Blue for advanced
    if (level <= 12) return 'text-purple-500'     // Purple for expert
    if (level <= 15) return 'text-yellow-500'     // Gold for master
    if (level <= 18) return 'text-red-500'        // Red for legend
    return 'text-gradient-to-r from-purple-500 to-pink-500' // Rainbow for max
  }, [])

  // Refresh user data after completing challenges (force refresh and clear cache)
  const refreshUserData = useCallback(async () => {
    clearUserCache()
    await fetchUserGlobally(true)
  }, [])

  // Force refresh user data (clears cache)
  const forceRefreshUser = useCallback(async () => {
    clearUserCache()
    await fetchUserGlobally(true)
  }, [])

  // Update user data in global state
  const updateUserData = useCallback((userData: User) => {
    saveUserToCache(userData)
    updateGlobalUserState({
      user: userData,
      lastFetch: Date.now()
    })
  }, [])

  // Clear global cache
  const clearGlobalUserCache = useCallback(() => {
    clearUserCache()
    updateGlobalUserState({
      user: null,
      lastFetch: 0
    })
  }, [])

  return {
    // State
    user,
    isLoading,
    error,
    
    // Actions
    fetchUser,
    refreshUserData,
    forceRefreshUser,
    updateUserData,
    levelUp,
    fixUserLevel,
    clearGlobalUserCache,
    
    // Computed data
    levelInfo: getLevelInfo(),
    
    // Utilities
    getLevelName,
    getLevelColor,
    XP_REQUIREMENTS
  }
} 