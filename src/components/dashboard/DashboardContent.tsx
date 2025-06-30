import type { TabType } from '../../pages/Dashboard'
import ChallengesTab from './ChallengesTab'
import BudgetTracker from './BudgetTracker'
import FinanceAdvisorTab from './FinanceAdvisorTab'

interface DashboardContentProps {
  activeTab: TabType
  sidebarWidth: number
  isMobile?: boolean
}

export default function DashboardContent({ activeTab, sidebarWidth, isMobile = false }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'finance-advisor':
        return <FinanceAdvisorTab />
      
      case 'challenges':
        return <ChallengesTab />
      
      case 'investment':
        return (
          <div className="text-center">
            <h2 className={`font-bold text-[#001F3F] mb-4 ${
              isMobile ? 'text-2xl' : 'text-3xl'
            }`}>
              INVESTMENT ZONE
            </h2>
            <div className={`bg-white/60 border-4 border-[#007FFF] max-w-2xl mx-auto ${
              isMobile ? 'p-4' : 'p-8'
            }`} style={{ borderRadius: '0px' }}>
              <p className={`text-[#001F3F] ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>
                📈 Investment Tools Coming Soon...
              </p>
              <p className={`text-[#001F3F] opacity-70 mt-4 ${
                isMobile ? 'text-sm' : ''
              }`}>
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
            <h2 className={`font-bold text-[#001F3F] mb-4 ${
              isMobile ? 'text-2xl' : 'text-3xl'
            }`}>
              WELCOME TO FINFLUENZZ
            </h2>
            <div className={`bg-white/60 border-4 border-[#007FFF] max-w-2xl mx-auto ${
              isMobile ? 'p-4' : 'p-8'
            }`} style={{ borderRadius: '0px' }}>
              <p className={`text-[#001F3F] ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>
                Select a tab from the sidebar to get started!
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      className={`flex-1 relative z-10 ${
        isMobile ? 'p-4 pt-16' : 'p-8'
      }`}
      style={!isMobile ? { 
        width: `calc(100vw - ${sidebarWidth}px - 4px)` // Account for resizer width
      } : undefined}
    >
      {/* Header */}
      <div className={`mb-8 ${isMobile ? 'mb-4' : ''}`}>
        <div className={`flex items-center justify-between ${
          isMobile ? 'flex-col space-y-4' : ''
        }`}>
          <div className={isMobile ? 'text-center' : ''}>
            <h1 className={`font-bold text-[#001F3F] tracking-wider ${
              isMobile ? 'text-2xl' : 'text-4xl'
            }`}>
              DASHBOARD
            </h1>
            <div className={`h-1 bg-gradient-to-r from-[#007FFF] to-[#001F3F] mt-2 ${
              isMobile ? 'w-20 mx-auto' : 'w-32'
            }`}></div>
          </div>
          
          {/* Stats Cards */}
          <div className={`flex space-x-4 ${
            isMobile ? 'justify-center' : ''
          }`}>
            <div className={`bg-white/60 border-2 border-[#007FFF] ${
              isMobile ? 'p-2' : 'p-3'
            }`} style={{ borderRadius: '0px' }}>
              <div className="text-xs text-[#001F3F] opacity-70">LEVEL</div>
              <div className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>1</div>
            </div>
            <div className={`bg-white/60 border-2 border-[#007FFF] ${
              isMobile ? 'p-2' : 'p-3'
            }`} style={{ borderRadius: '0px' }}>
              <div className="text-xs text-[#001F3F] opacity-70">XP</div>
              <div className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>125</div>
            </div>
            <div className={`bg-white/60 border-2 border-[#007FFF] ${
              isMobile ? 'p-2' : 'p-3'
            }`} style={{ borderRadius: '0px' }}>
              <div className="text-xs text-[#001F3F] opacity-70">STREAK</div>
              <div className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-base' : 'text-lg'
              }`}>3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`min-h-[400px] ${activeTab === 'challenges' || activeTab === 'budget-tracker' || activeTab === 'finance-advisor' ? '' : 'flex items-center justify-center'}`}>
        {renderContent()}
      </div>

      {/* Footer Info - Hide on mobile or make smaller */}
      {!isMobile && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-[#007FFF]/10 border border-[#007FFF] p-2 text-xs text-[#001F3F] font-mono" style={{ borderRadius: '0px' }}>
            FINFLUENZZ v1.0 | Active Tab: {activeTab.toUpperCase().replace('-', ' ')}
          </div>
        </div>
      )}
    </div>
  )
} 