import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { ReactNode } from 'react'

interface PublicRouteProps {
  children: ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
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

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // Render public content if not authenticated
  return <>{children}</>
} 