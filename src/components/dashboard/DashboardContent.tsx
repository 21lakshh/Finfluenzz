import type { TabType } from '../../pages/Dashboard'
import ChallengesTab from './ChallengesTab'
import BudgetTracker from './BudgetTracker'
import FinanceAdvisorTab from './FinanceAdvisorTab'

interface DashboardContentProps {
  activeTab: TabType
  sidebarWidth: number
}

export default function DashboardContent({ activeTab, sidebarWidth }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'finance-advisor':
        return <FinanceAdvisorTab />
      
      case 'challenges':
        return <ChallengesTab />
      
      case 'investment':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#001F3F] mb-4">
              INVESTMENT ZONE
            </h2>
            <div className="bg-white/60 border-4 border-[#007FFF] p-8 max-w-2xl mx-auto" style={{ borderRadius: '0px' }}>
              <p className="text-[#001F3F] text-lg">
                📈 Investment Tools Coming Soon...
              </p>
              <p className="text-[#001F3F] opacity-70 mt-4">
                Track stocks, analyze market trends, and manage your portfolio
              </p>
            </div>
          </div>
        )
      
      case 'budget-tracker':
        return <BudgetTracker />
      
      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#001F3F] mb-4">
              WELCOME TO FINFLUENZZ
            </h2>
            <div className="bg-white/60 border-4 border-[#007FFF] p-8 max-w-2xl mx-auto" style={{ borderRadius: '0px' }}>
              <p className="text-[#001F3F] text-lg">
                Select a tab from the sidebar to get started!
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      className="flex-1 p-8 relative z-10"
      style={{ 
        width: `calc(100vw - ${sidebarWidth}px - 4px)` // Account for resizer width
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#001F3F] tracking-wider">
              DASHBOARD
            </h1>
            <div className="h-1 bg-gradient-to-r from-[#007FFF] to-[#001F3F] w-32 mt-2"></div>
          </div>
          
          {/* Stats Cards */}
          <div className="flex space-x-4">
            <div className="bg-white/60 border-2 border-[#007FFF] p-3" style={{ borderRadius: '0px' }}>
              <div className="text-xs text-[#001F3F] opacity-70">LEVEL</div>
              <div className="text-lg font-bold text-[#001F3F]">1</div>
            </div>
            <div className="bg-white/60 border-2 border-[#007FFF] p-3" style={{ borderRadius: '0px' }}>
              <div className="text-xs text-[#001F3F] opacity-70">XP</div>
              <div className="text-lg font-bold text-[#001F3F]">125</div>
            </div>
            <div className="bg-white/60 border-2 border-[#007FFF] p-3" style={{ borderRadius: '0px' }}>
              <div className="text-xs text-[#001F3F] opacity-70">STREAK</div>
              <div className="text-lg font-bold text-[#001F3F]">3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`min-h-[400px] ${activeTab === 'challenges' || activeTab === 'budget-tracker' || activeTab === 'finance-advisor' ? '' : 'flex items-center justify-center'}`}>
        {renderContent()}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-[#007FFF]/10 border border-[#007FFF] p-2 text-xs text-[#001F3F] font-mono" style={{ borderRadius: '0px' }}>
          FINFLUENZZ v1.0 | Active Tab: {activeTab.toUpperCase().replace('-', ' ')}
        </div>
      </div>
    </div>
  )
} 