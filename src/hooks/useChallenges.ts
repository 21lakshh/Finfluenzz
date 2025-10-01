import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'

export interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  xpReward: number
  deadline: string;
  emoji: string
  completed?: boolean
  createdAt?: string
}

export interface ChallengeStats {
  totalChallenges: number
  completedChallenges: number
  totalXpEarned: number
  activeChallenges: number
}

interface CachedChallenges {
  data: Challenge[]
  timestamp: number
  userId: string
}

// Cache configuration
const CHALLENGES_CACHE_KEY = 'finfluenzz_challenges_cache'
const CHALLENGES_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get current user ID for cache validation
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

  // Check if cached data is still valid
  const isCacheValid = (): boolean => {
    try {
      const cached = localStorage.getItem(CHALLENGES_CACHE_KEY)
      if (!cached) return false
      
      const cachedData: CachedChallenges = JSON.parse(cached)
      const currentUserId = getCurrentUserId()
      const now = Date.now()
      
      return !!(
        cachedData.timestamp &&
        (now - cachedData.timestamp) < CHALLENGES_CACHE_DURATION &&
        cachedData.userId === currentUserId &&
        cachedData.data
      )
    } catch {
      return false
    }
  }

  // Get cached data
  const getCachedChallenges = (): Challenge[] | null => {
    try {
      const cached = localStorage.getItem(CHALLENGES_CACHE_KEY)
      if (!cached) return null
      
      const { data }: CachedChallenges = JSON.parse(cached)
      return data
    } catch {
      return null
    }
  }

  // Cache challenges data
  const cacheChallenges = (challengesData: Challenge[]) => {
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) return

      const cacheData: CachedChallenges = {
        data: challengesData,
        timestamp: Date.now(),
        userId: currentUserId
      }
      localStorage.setItem(CHALLENGES_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache challenges:', error)
    }
  }

  // Clear challenges cache
  const clearChallengesCache = () => {
    localStorage.removeItem(CHALLENGES_CACHE_KEY)
  }

  // Get auth headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('Authorization')}`
  })

  // Fetch all challenges with caching
  const fetchChallenges = useCallback(async (forceRefresh = false) => {
    // Use cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      const cachedData = getCachedChallenges()
      if (cachedData) {
        setChallenges(cachedData)
        return
      }
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/challenges/all`, {
        headers: getAuthHeaders()
      })
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch challenges')
      }
      
      const data = response.data
      const challengesData = data.challenges || []
      setChallenges(challengesData)
      cacheChallenges(challengesData) // Cache the fresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch challenges'
      setError(errorMessage)
      console.error('Error fetching challenges:', err)
      
      // Clear cache on auth errors
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        clearChallengesCache()
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh challenges (force refresh)
  const refreshChallenges = useCallback(async () => {
    clearChallengesCache()
    await fetchChallenges(true)
  }, [fetchChallenges])

  // Add multiple challenges
  const addMultipleChallenges = async (challengesData: Omit<Challenge, 'id' | 'createdAt'>[]) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Send the array directly - backend expects array, not { challenges: array }
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/challenges/add`, challengesData, {
        headers: getAuthHeaders()
      })
      
      if (response.status !== 200) {
        throw new Error('Failed to add challenges')
      }
      
      // Refresh challenges after adding multiple
      await fetchChallenges(true)
      
      return response.data.challenges
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add challenges'
      setError(errorMessage)
      
      // Log API errors for debugging
      if (axios.isAxiosError(err)) {
        console.error('Failed to add challenges:', err.response?.status, err.response?.data)
      }
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Complete a challenge (deletes challenge and awards XP)
  const completeChallenge = async (challengeId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Backend handles challenge completion via DELETE which awards XP
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/challenges/delete/${challengeId}`, {
        headers: getAuthHeaders()
      })
      
      if (response.status !== 200) {
        throw new Error('Failed to complete challenge')
      }
      
      // Remove completed challenge from local state and cache
      const updatedChallenges = challenges.filter(challenge => challenge.id !== challengeId)
      setChallenges(updatedChallenges)
      cacheChallenges(updatedChallenges)
      
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete challenge'
      setError(errorMessage)
      
      // Log API errors for debugging
      if (axios.isAxiosError(err)) {
        console.error('Failed to complete challenge:', err.response?.status, err.response?.data)
      }
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Delete all challenges
  const deleteAllChallenges = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/challenges/delete/all`, {
        headers: getAuthHeaders()
      })
      
      if (response.status !== 200) {
        throw new Error('Failed to delete challenges')
      }
      
      // Clear local state and cache
      setChallenges([])
      clearChallengesCache()
      
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete challenges'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate challenge stats
  const getChallengeStats = useCallback((): ChallengeStats => {
    const totalChallenges = challenges.length
    const completedChallenges = challenges.filter(c => c.completed).length
    const activeChallenges = challenges.filter(c => !c.completed).length
    const totalXpEarned = challenges
      .filter(c => c.completed)
      .reduce((total, challenge) => total + challenge.xpReward, 0)

    return {
      totalChallenges,
      completedChallenges,
      totalXpEarned,
      activeChallenges
    }
  }, [challenges])

  // Filter challenges by difficulty
  const getChallengesByDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    return challenges.filter(challenge => challenge.difficulty === difficulty)
  }, [challenges])

  // Get active (incomplete) challenges
  const getActiveChallenges = useCallback(() => {
    return challenges.filter(challenge => !challenge.completed)
  }, [challenges])

  // Get completed challenges
  const getCompletedChallenges = useCallback(() => {
    return challenges.filter(challenge => challenge.completed)
  }, [challenges])

  // Load challenges on mount with caching
  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  return {
    // State
    challenges,
    isLoading,
    error,
    
    // Actions
    fetchChallenges,
    refreshChallenges,
    addMultipleChallenges,
    completeChallenge,
    deleteAllChallenges,
    clearChallengesCache,
    
    // Computed data
    stats: getChallengeStats(),
    activeChallenges: getActiveChallenges(),
    completedChallenges: getCompletedChallenges(),
    
    // Filters
    getChallengesByDifficulty,
  }
} 