import React, { useState, useRef, useEffect } from 'react'
import { Send, Brain, MessageSquare, AlertTriangle, TrendingUp, Coins } from 'lucide-react'
import financeAdvisorAgent from '../../Agents/financeAdvisorAgent'
import ProfessionalStockChart from '../charts/ProfessionalStockChart'
import { stockAPI } from '../../services/stockAPI'
import { extractAssetSymbol } from '../../utils/symbolUtils'
import type { ChatMessage, AnalysisResponse } from '../../Agents/financeAdvisorAgent'
import type { AssetHistoricalData, AssetType } from '../../services/stockAPI'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  analysis?: AnalysisResponse
  chartData?: AssetHistoricalData[]
  symbol?: string
  assetType?: AssetType
}

function ChatBubble({ message, isUser, analysis, chartData, symbol, assetType }: ChatBubbleProps) {
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
          {symbol && assetType && (
            <div className="flex items-center space-x-2 ml-2">
              {assetType === 'crypto' ? (
                <Coins className="w-4 h-4 text-orange-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              <span className="text-xs text-[#001F3F] opacity-70 font-bold">
                {assetType === 'crypto' ? 'CRYPTO' : 'STOCK'}
              </span>
            </div>
          )}
          {analysis && (
            <div className="flex items-center space-x-2 ml-4">
              {symbol ? (
                <>
                  <div className={`px-2 py-1 text-xs font-bold ${
                    analysis.recommendation === 'BUY' ? 'bg-green-500 text-white' :
                    analysis.recommendation === 'SELL' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-black'
                  }`} style={{ borderRadius: '0px' }}>
                    {analysis.recommendation}
                  </div>
                  {analysis.isFinancialAdvice && (
                    <div className="text-xs text-[#001F3F] opacity-70">
                      {analysis.confidence}% confidence
                    </div>
                  )}
                </>
              ) : analysis.isFinancialAdvice ? (
                <div className="px-2 py-1 text-xs font-bold bg-blue-500 text-white" style={{ borderRadius: '0px' }}>
                  GENERAL ADVICE
                </div>
              ) : (
                <div className="px-2 py-1 text-xs font-bold bg-gray-500 text-white" style={{ borderRadius: '0px' }}>
                  CASUAL CHAT
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-[#001F3F] leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Analysis Summary Cards - Only show for financial advice */}
        {analysis && analysis.isFinancialAdvice && (
          <div className="mt-4">
            {symbol ? (
              // Asset-specific analysis (full details)
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                    <p className="text-sm font-bold text-[#001F3F]">
                      {assetType === 'crypto' ? '$' : '₹'}{analysis.priceTarget}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // General financial advice (simplified)
              <div className="grid grid-cols-2 gap-2 max-w-md">
                <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">RISK LEVEL</p>
                  <p className={`text-sm font-bold ${
                    analysis.riskLevel === 'LOW' ? 'text-green-600' :
                    analysis.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {analysis.riskLevel}
                  </p>
                </div>
                <div className="bg-blue-50 border-2 border-[#007FFF] p-2 text-center">
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">CONFIDENCE</p>
                  <p className="text-sm font-bold text-[#001F3F]">{analysis.confidence}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Asset Chart */}
        {chartData && symbol && (
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              {assetType === 'crypto' ? (
                <Coins className="w-5 h-5 text-orange-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-500" />
              )}
              <h3 className="text-lg font-bold text-[#001F3F]">
                {symbol} {assetType === 'crypto' ? 'Price Chart' : 'Stock Chart'}
              </h3>
            </div>
            <ProfessionalStockChart 
              data={chartData} 
              symbol={symbol}
              height={350}
              showVolume={false} // Hide volume for crypto since it's not always available
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
    chartData?: AssetHistoricalData[]
    symbol?: string
    assetType?: AssetType
  }>>([
    {
      text: "Yo! 👋 FinanceGuru here, ready to analyze stocks AND crypto with REAL data! 🚀\n\nI'm connected to live APIs for real-time prices, technical indicators, and market data. Just ask me about any stock or crypto!\n\n💡 Try:\n• \"How is TSLA doing?\"\n• \"Should I buy BTC?\"\n• \"Analyze AAPL stock\"\n• \"What's up with SOL?\"\n\nLet's make some money moves! 💰🔥",
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
      
      // Extract asset symbol and determine type
      const assetSymbol = extractAssetSymbol(userMessage)
      let chartData: AssetHistoricalData[] | undefined
      let assetType: AssetType | undefined
      
      if (assetSymbol) {
        try {
          assetType = stockAPI.getAssetType(assetSymbol)
          chartData = await stockAPI.getAssetHistoricalData(assetSymbol, 30)
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
        symbol: assetSymbol || undefined,
        assetType
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

  // Enhanced quick action buttons for both stocks and crypto
  const quickActions = [
    { label: "📈 AAPL Analysis", message: "Analyze AAPL stock for me", type: "stock" },
    { label: "₿ Bitcoin Vibes", message: "What's the deal with BTC?", type: "crypto" },
    { label: "🚗 Tesla Check", message: "Should I buy TSLA right now?", type: "stock" },
    { label: "⚡ Ethereum Deep Dive", message: "Give me an ETH analysis", type: "crypto" },
    { label: "🔥 NVDA Trends", message: "NVIDIA stock analysis", type: "stock" },
    { label: "🌟 Solana Surge", message: "How is SOL performing today?", type: "crypto" }
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
              Gen Z AI • Stocks & Crypto Analysis • Real-time data • No cap! 💯
            </p>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-[#001F3F]">STOCKS</span>
            <div className="flex-1 h-px bg-[#007FFF] opacity-30"></div>
            <Coins className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-[#001F3F]">CRYPTO</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputValue(action.message)}
                className={`px-3 py-1 border-2 border-[#007FFF] hover:bg-[#007FFF] hover:text-white transition-colors text-sm font-bold ${
                  action.type === 'crypto' 
                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-500' 
                    : 'bg-green-50 text-green-700 hover:bg-green-500'
                }`}
                style={{ borderRadius: '0px' }}
              >
                {action.label}
              </button>
            ))}
          </div>
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
              assetType={message.assetType}
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
            placeholder="Ask me about any stock or crypto! Try: 'How is Tesla doing?' or 'BTC analysis'"
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
        
        {/* Help Text & Disclaimer */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center space-x-2 text-xs text-[#007FFF] font-medium">
            <span>💡</span>
            <p>Pro tip: If I don't understand, try exact names like "TSLA", "BTC", "NVDA", "ETH" or "SOL"</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-[#001F3F] opacity-60">
            <AlertTriangle className="w-4 h-4" />
            <p>Not financial advice • DYOR • Stocks & crypto are risky AF • CoinGecko & stock APIs for data</p>
          </div>
        </div>
      </div>
    </div>
  )
}

 