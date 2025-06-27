import React from 'react'
import { 
  Home, 
  MessageSquare, 
  Trophy, 
  TrendingUp, 
  PiggyBank,
  LogOut 
} from 'lucide-react'
import type { TabType } from '../../pages/Dashboard'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  width: number
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

export default function Sidebar({ activeTab, onTabChange, width }: SidebarProps) {
  return (
    <div 
      className="bg-blue-100/80 border-r-4 border-[#007FFF] backdrop-blur-sm relative z-10 flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-6 border-b-2 border-[#007FFF]/30">
        <h1 className="text-2xl font-bold text-[#001F3F] tracking-wider">
          FINFLUENZZ
        </h1>
        <div className="h-0.5 bg-gradient-to-r from-[#007FFF] to-[#001F3F] w-full mt-2"></div>
        <p className="text-xs text-[#001F3F] opacity-70 mt-2 font-mono">
          DASHBOARD v1.0
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
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
                <div className="text-sm font-bold tracking-wide">
                  {item.label}
                </div>
                <div className={`text-xs opacity-70 ${
                  activeTab === item.id ? 'text-blue-100' : 'text-[#001F3F]'
                }`}>
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
          <div className="text-sm font-bold text-[#001F3F] tracking-wide">
            PLAYER: USER_001
          </div>
          <div className="text-xs text-[#001F3F] opacity-70">
            Level: Beginner
          </div>
          <div className="flex items-center mt-2">
            <div className="w-full bg-[#007FFF]/20 h-2 border border-[#007FFF]" style={{ borderRadius: '0px' }}>
              <div className="bg-[#007FFF] h-full w-1/3" style={{ borderRadius: '0px' }}></div>
            </div>
            <span className="text-xs text-[#001F3F] ml-2 font-mono">33%</span>
          </div>
        </div>
        
        <button 
          className="w-full bg-red-500/80 hover:bg-red-600 text-white border-2 border-red-600 p-2 transition-colors flex items-center justify-center space-x-2"
          style={{ borderRadius: '0px' }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">LOGOUT</span>
        </button>
      </div>
    </div>
  )
} 