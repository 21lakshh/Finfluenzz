import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F0F8FF] to-white flex items-center justify-center font-pixel-retroui">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#001F3F] mb-4 tracking-wider animate-pulse">
            FINFLUENZZ
          </div>
          <div className="text-[#007FFF] font-bold tracking-wide">
            [LOADING...]
          </div>
        </div>
      </div>
    )
  }

  // Redirect to signin if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Render protected content if authenticated
  return <>{children}</>
} 