import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'

// User interface matching the backend response
export interface User {
  id: string
  email: string
  username: string
  age: number
  goal: string
  employmentType: string
  financeKnowledge: string
  earn: boolean
}

// Auth context interface
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  refreshUser: () => Promise<void>
  logout: () => void
  clearError: () => void
}

// Cache configuration
const USER_CACHE_KEY = 'finfluenzz-user-data'
const USER_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

interface CachedUser {
  data: User
  timestamp: number
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if cached user data is valid
  const isCacheValid = (): boolean => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY)
      if (!cached) return false
      
      const { timestamp }: CachedUser = JSON.parse(cached)
      const now = Date.now()
      return (now - timestamp) < USER_CACHE_DURATION
    } catch {
      return false
    }
  }

  // Get cached user data
  const getCachedUser = (): User | null => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY)
      if (!cached) return null
      
      const { data }: CachedUser = JSON.parse(cached)
      return data
    } catch {
      return null
    }
  }

  // Cache user data
  const cacheUser = (userData: User) => {
    try {
      const cacheData: CachedUser = {
        data: userData,
        timestamp: Date.now()
      }
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache user data:', error)
    }
  }

  // Clear cached user data
  const clearUserCache = () => {
    try {
      localStorage.removeItem(USER_CACHE_KEY)
    } catch (error) {
      console.warn('Failed to clear user cache:', error)
    }
  }

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('Authorization')
    return !!token && !!user
  }

  // Fetch user data from API
  const fetchUser = async (forceRefresh = false): Promise<void> => {
    const token = localStorage.getItem('Authorization')
    
    if (!token) {
      setUser(null)
      setIsLoading(false)
      clearUserCache()
      return
    }

    // Use cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      const cachedData = getCachedUser()
      if (cachedData) {
        setUser(cachedData)
        setIsLoading(false)
        return
      }
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await axios.get('https://finfluenzz.lakshyapaliwal200.workers.dev/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data && response.data.user) {
        const userData = response.data.user
        setUser(userData)
        cacheUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token is invalid, clear everything
          logout()
          setError('Session expired. Please sign in again.')
        } else {
          setError('Failed to load user data.')
        }
      } else {
        setError('Network error. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    await fetchUser(true)
  }

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('Authorization')
    clearUserCache()
    setUser(null)
    setError(null)
  }

  // Clear error
  const clearError = (): void => {
    setError(null)
  }

  // Load user data on mount
  useEffect(() => {
    fetchUser()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: isAuthenticated(),
    error,
    refreshUser,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext 