import React from 'react'
import { 
  Home, 
  MessageSquare, 
  Trophy, 
  TrendingUp, 
  PiggyBank,
  LogOut,
  User,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { logout as authLogout } from '../../utils/auth'
import type { TabType } from '../../pages/Dashboard'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  width: number
  isMobile?: boolean
  onClose?: () => void
}

interface TabItem {
  id: TabType
  label: string
  icon: React.ReactNode
  description: string
}

const tabItems: TabItem[] = [
  {
    id: 'home',
    label: 'HOME',
    icon: <Home className="w-5 h-5" />,
    description: 'Back to Landing'
  },
  {
    id: 'finance-advisor',
    label: 'FINANCE ADVISOR',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'AI Chatbot'
  },
  {
    id: 'challenges',
    label: 'CHALLENGES',
    icon: <Trophy className="w-5 h-5" />,
    description: 'Gamified Tasks'
  },
  {
    id: 'investment',
    label: 'INVESTMENT ZONE',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Trading & Stocks'
  },
  {
    id: 'budget-tracker',
    label: 'BUDGET TRACKER',
    icon: <PiggyBank className="w-5 h-5" />,
    description: 'Smart Budgeting'
  }
]

export default function Sidebar({ activeTab, onTabChange, width, isMobile = false, onClose }: SidebarProps) {
  const { user, isLoading } = useAuth()
  
  // Handle logout with comprehensive cache clearing
  const handleLogout = () => {
    authLogout() // This clears all cache and redirects
  }


  return (
    <div 
      className={`bg-blue-100/80 border-r-4 border-[#007FFF] backdrop-blur-sm relative z-10 flex flex-col ${
        isMobile ? 'h-screen' : ''
      }`}
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-6 border-b-2 border-[#007FFF]/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className={`font-bold text-[#001F3F] tracking-wider ${
              isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              FINFLUENZZ
            </h1>
            <div className="h-0.5 bg-gradient-to-r from-[#007FFF] to-[#001F3F] w-full mt-2"></div>
            <p className="text-xs text-[#001F3F] opacity-70 mt-2 font-mono">
              DASHBOARD v1.0
            </p>
          </div>
          
          {/* Close button for mobile */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="ml-4 p-2 bg-red-500/80 hover:bg-red-600 text-white border-2 border-red-600 transition-colors"
              style={{ borderRadius: '0px' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        <h2 className="text-sm font-bold text-[#001F3F] mb-4 tracking-wide opacity-80">
          NAVIGATION
        </h2>
        
        {tabItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              w-full text-left p-3 border-2 transition-all duration-200 transform hover:scale-105
              ${activeTab === item.id 
                ? 'bg-[#007FFF] text-white border-[#001F3F] shadow-lg' 
                : 'bg-white/60 text-[#001F3F] border-[#007FFF] hover:bg-blue-50'
              }
            `}
            style={{ borderRadius: '0px' }}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <div className="flex-1 min-w-0">
                <div className={`font-bold tracking-wide ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  {item.label}
                </div>
                <div className={`text-xs opacity-70 ${
                  activeTab === item.id ? 'text-blue-100' : 'text-[#001F3F]'
                } ${isMobile ? 'text-xs' : ''}`}>
                  {item.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t-2 border-[#007FFF]/30">
        <div className="bg-white/60 border-2 border-[#007FFF] p-3 mb-3" style={{ borderRadius: '0px' }}>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-[#001F3F]" />
                <div className="h-3 bg-[#007FFF]/30 w-24"></div>
              </div>
              <div className="h-2 bg-[#007FFF]/20 w-16 mb-2"></div>
              <div className="h-2 bg-[#007FFF]/20 w-full"></div>
            </div>
          ) : user ? (
            <>
              <div className="flex items-center space-x-2 mb-1">
                <User className="w-4 h-4 text-[#001F3F]" />
                <div className={`font-bold text-[#001F3F] tracking-wide ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  {user.username.toUpperCase()}
                </div>
              </div>
              <div className="text-xs text-[#001F3F] opacity-70 mb-1">
                {user.age} years • {user.employmentType}
              </div>
            </>
          ) : (
            <div className="text-center">
              <User className="w-8 h-8 text-[#001F3F] mx-auto mb-2 opacity-50" />
              <div className="text-xs text-[#001F3F] opacity-70">Not logged in</div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleLogout}
          className={`w-full bg-red-500/80 hover:bg-red-600 text-white border-2 border-red-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 ${
            isMobile ? 'p-2' : 'p-2'
          }`}
          style={{ borderRadius: '0px' }}
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4" />
          <span className={`font-bold tracking-wide ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>LOGOUT</span>
        </button>
      </div>
    </div>
  )
} 