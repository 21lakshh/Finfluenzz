import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardContent from '../components/dashboard/DashboardContent'

export type TabType = 'home' | 'finance-advisor' | 'challenges' | 'investment' | 'budget-tracker'

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('finance-advisor')
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)

  const handleTabChange = (tab: TabType) => {
    if (tab === 'home') {
      navigate('/')
      return
    }
    setActiveTab(tab)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = e.clientX
    if (newWidth >= 200 && newWidth <= 400) {
      setSidebarWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F8FF] to-blue-50 font-pixel-retroui flex">
      {/* Retro Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#007FFF_1px,transparent_1px),linear-gradient(to_bottom,#007FFF_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
      
      {/* Floating Pixels */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-6 h-6 bg-[#007FFF] opacity-15 rounded-sm animate-pulse"></div>
        <div className="absolute top-60 right-32 w-4 h-4 bg-[#001F3F] opacity-20 rounded-sm animate-bounce"></div>
        <div className="absolute bottom-40 left-16 w-8 h-8 bg-[#007FFF] opacity-10 rounded-sm animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-5 h-5 bg-[#001F3F] opacity-15 rounded-sm animate-bounce delay-500"></div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        width={sidebarWidth}
      />

      {/* Resizer */}
      <div
        className="w-1 bg-[#007FFF]/30 hover:bg-[#007FFF]/50 cursor-col-resize relative z-20 transition-colors"
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      >
        <div className="absolute inset-0 w-3 -ml-1"></div>
      </div>

      {/* Main Content */}
      <DashboardContent 
        activeTab={activeTab}
        sidebarWidth={sidebarWidth}
      />
    </div>
  )
}