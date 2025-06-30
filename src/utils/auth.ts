// Authentication utilities

export const logout = () => {
  // Clear authentication token
  localStorage.removeItem('Authorization')
  localStorage.removeItem('finfluenzz_global_user_cache')
  
  // Clear all Finfluenzz cache data
  const cacheKeys = [
    'finfluenzz_global_user_cache',
    'finfluenzz_user_cache',
    'finfluenzz_challenges_cache',
    'finfluenzz_expenses_cache',
    'finfluenzz-challenges-expenses-cache'
  ]
  
  cacheKeys.forEach(key => {
    localStorage.removeItem(key)
    console.log(`Cleared cache: ${key}`)
  })
  
  // Clear any other Finfluenzz related data
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('finfluenzz') || key.startsWith('finflue')) {
      localStorage.removeItem(key)
      console.log(`Cleared additional cache: ${key}`)
    }
  })
  
  console.log('All cache cleared - user logged out')

  // Redirect to login page
  window.location.href = '/signin'
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('Authorization')
  return !!token
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('Authorization')
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem('Authorization', token)
} 