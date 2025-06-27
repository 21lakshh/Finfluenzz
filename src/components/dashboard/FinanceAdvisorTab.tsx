import React, { useState, useRef, useEffect } from 'react'
import { Send, Brain, MessageSquare, AlertTriangle } from 'lucide-react'
import financeAdvisorAgent from '../../Agents/financeAdvisorAgent'
import ProfessionalStockChart from '../charts/ProfessionalStockChart'
import { stockAPI } from '../../services/stockAPI'
import type { ChatMessage, AnalysisResponse } from '../../Agents/financeAdvisorAgent'
import type { StockHistoricalData } from '../../services/stockAPI'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  analysis?: AnalysisResponse
  chartData?: StockHistoricalData[]
  symbol?: string
}

function ChatBubble({ message, isUser, analysis, chartData, symbol }: ChatBubbleProps) {
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-[#007FFF] text-white p-4 max-w-lg border-2 border-[#001F3F]" style={{ borderRadius: '0px' }}>
          <p className="font-mono text-sm">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white/90 border-4 border-[#007FFF] p-4 max-w-4xl" style={{ borderRadius: '0px' }}>
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-5 h-5 text-[#007FFF]" />
          <span className="font-bold text-[#001F3F] tracking-wide">FINANCE GURU</span>
          {analysis && (
            <div className="flex items-center space-x-2 ml-4">
              <div className={`px-2 py-1 text-xs font-bold ${
                analysis.recommendation === 'BUY' ? 'bg-green-500 text-white' :
                analysis.recommendation === 'SELL' ? 'bg-red-500 text-white' :
                'bg-yellow-500 text-black'
              }`} style={{ borderRadius: '0px' }}>
                {analysis.recommendation}
              </div>
              <div className="text-xs text-[#001F3F] opacity-70">
                {analysis.confidence}% confidence
              </div>
            </div>
          )}
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-[#001F3F] leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Analysis Summary Cards */}
        {analysis && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
              <p className="text-xs text-[#001F3F] opacity-70 font-bold">RISK</p>
              <p className={`text-sm font-bold ${
                analysis.riskLevel === 'LOW' ? 'text-green-600' :
                analysis.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {analysis.riskLevel}
              </p>
            </div>
            <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
              <p className="text-xs text-[#001F3F] opacity-70 font-bold">HORIZON</p>
              <p className="text-sm font-bold text-[#001F3F]">{analysis.timeHorizon}</p>
            </div>
            <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
              <p className="text-xs text-[#001F3F] opacity-70 font-bold">CONFIDENCE</p>
              <p className="text-sm font-bold text-[#001F3F]">{analysis.confidence}%</p>
            </div>
            {analysis.priceTarget && (
              <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                <p className="text-xs text-[#001F3F] opacity-70 font-bold">TARGET</p>
                <p className="text-sm font-bold text-[#001F3F]">₹{analysis.priceTarget}</p>
              </div>
            )}
          </div>
        )}

        {/* Stock Chart */}
        {chartData && symbol && (
          <div className="mt-6">
            <ProfessionalStockChart 
              data={chartData} 
              symbol={symbol}
              height={350}
              showVolume={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinanceAdvisorTab() {
  const [messages, setMessages] = useState<Array<{
    text: string
    isUser: boolean
    analysis?: AnalysisResponse
    chartData?: StockHistoricalData[]
    symbol?: string
  }>>([
    {
      text: "Yo yo yo! 👋 FinanceGuru here, ready to help you navigate these markets! 📈\n\nI'm your Gen Z finance friend who actually knows what they're talking about (no cap! 💯). Ask me about any stock, get real-time analysis, or just vibe about your investment goals!\n\nTry asking me:\n• \"What's the deal with AAPL stock?\"\n• \"Should I buy Tesla right now?\"\n• \"NVDA price prediction?\"\n• \"Analyze GOOGL chart\"\n\nLet's make some money moves! 🚀💰",
      isUser: false
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message
    setMessages(prev => [...prev, { text: userMessage, isUser: true }])

    try {
      // Get AI response
      const analysis = await financeAdvisorAgent(userMessage, chatHistory)
      
      // Extract stock symbol to get chart data
      const stockSymbol = extractStockSymbol(userMessage)
      let chartData: StockHistoricalData[] | undefined
      
      if (stockSymbol) {
        try {
          chartData = await stockAPI.getHistoricalData(stockSymbol, 30)
        } catch (error) {
          console.error('Error fetching chart data:', error)
        }
      }

      // Add AI response with analysis and chart
      setMessages(prev => [...prev, { 
        text: analysis.message, 
        isUser: false, 
        analysis,
        chartData,
        symbol: stockSymbol || undefined
      }])

      // Update chat history
      setChatHistory(prev => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: analysis.message }
      ])

    } catch (error) {
      console.error('Error getting AI response:', error)
      setMessages(prev => [...prev, { 
        text: "Yo, my bad! 😅 Something went wrong on my end. The servers are being a bit sus right now. Try asking me again in a sec! 🔄", 
        isUser: false 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Quick action buttons
  const quickActions = [
    { label: "📈 AAPL Analysis", message: "Analyze AAPL stock for me" },
    { label: "🚗 Tesla Vibes", message: "What's the deal with TSLA stock?" },
    { label: "🔥 NVDA Check", message: "Should I buy NVIDIA right now?" },
    { label: "📊 Market Pulse", message: "How are the markets looking today?" }
  ]

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white/60 border-4 border-[#007FFF] p-4 mb-4" style={{ borderRadius: '0px' }}>
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-8 h-8 text-[#007FFF]" />
          <div>
            <h2 className="text-2xl font-bold text-[#001F3F] tracking-wider">
              🤖 FINANCE ADVISOR
            </h2>
            <p className="text-[#001F3F] opacity-70">
              Gen Z AI that knows finance • Real-time stock analysis • No cap! 💯
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setInputValue(action.message)}
              className="bg-blue-50 text-[#001F3F] px-3 py-1 border-2 border-[#007FFF] hover:bg-[#007FFF] hover:text-white transition-colors text-sm font-bold"
              style={{ borderRadius: '0px' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white/40 border-4 border-[#007FFF] p-4 overflow-y-auto" style={{ borderRadius: '0px' }}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatBubble 
              key={index} 
              message={message.text} 
              isUser={message.isUser}
              analysis={message.analysis}
              chartData={message.chartData}
              symbol={message.symbol}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white/80 border-4 border-[#007FFF] p-4" style={{ borderRadius: '0px' }}>
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-[#007FFF] animate-pulse" />
                  <span className="font-bold text-[#001F3F]">FINANCE GURU</span>
                  <span className="text-[#001F3F] opacity-70">is analyzing...</span>
                </div>
                <div className="flex space-x-2 mt-2">
                  <div className="w-2 h-2 bg-[#007FFF] animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#007FFF] animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-[#007FFF] animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/60 border-4 border-[#007FFF] p-4 mt-4" style={{ borderRadius: '0px' }}>
        <div className="flex space-x-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about any stock! (e.g., 'What's happening with AAPL?')"
            className="flex-1 p-3 border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none resize-none font-mono"
            style={{ borderRadius: '0px' }}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white px-6 py-3 border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '0px' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-3 flex items-center space-x-2 text-xs text-[#001F3F] opacity-60">
          <AlertTriangle className="w-4 h-4" />
          <p>Not financial advice • Do your own research • Markets are risky fr fr</p>
        </div>
      </div>
    </div>
  )
}

// Helper function to extract stock symbol
function extractStockSymbol(message: string): string | null {
  const patterns = [
    /\$([A-Z]{1,5})\b/g,
    /\b([A-Z]{2,5})\s+stock/gi,
    /\b([A-Z]{2,5})\s+price/gi,
    /about\s+([A-Z]{2,5})\b/gi,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(message)
    if (match) {
      return match[1].toUpperCase()
    }
  }

  const companyMap: Record<string, string> = {
    'apple': 'AAPL',
    'google': 'GOOGL',
    'microsoft': 'MSFT',
    'tesla': 'TSLA',
    'nvidia': 'NVDA',
    'amazon': 'AMZN',
    'meta': 'META'
  }

  const lowerMessage = message.toLowerCase()
  for (const [company, symbol] of Object.entries(companyMap)) {
    if (lowerMessage.includes(company)) {
      return symbol
    }
  }

  return null
} 