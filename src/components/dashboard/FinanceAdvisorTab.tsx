import React, { useState, useRef, useEffect } from 'react'
import { Send, Brain, MessageSquare, AlertTriangle, TrendingUp, Coins } from 'lucide-react'
import financeAdvisorAgent from '../../Agents/financeAdvisorAgent'
import ProfessionalStockChart from '../charts/ProfessionalStockChart'
import { stockAPI } from '../../services/stockAPI'
import { extractAssetSymbol } from '../../utils/symbolUtils'
import { useIsMobile } from '../../hooks/use-Mobile'
import type { ChatMessage, AnalysisResponse } from '../../Agents/financeAdvisorAgent'
import type { AssetHistoricalData, AssetType } from '../../services/stockAPI'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  analysis?: AnalysisResponse
  chartData?: AssetHistoricalData[]
  symbol?: string
  assetType?: AssetType
  isMobile?: boolean
}

function ChatBubble({ message, isUser, analysis, chartData, symbol, assetType, isMobile = false }: ChatBubbleProps) {
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className={`bg-[#007FFF] text-white border-2 border-[#001F3F] ${
          isMobile ? 'p-3 max-w-xs' : 'p-4 max-w-lg'
        }`} style={{ borderRadius: '0px' }}>
          <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-4">
      <div className={`bg-white/90 border-4 border-[#007FFF] ${
        isMobile ? 'p-3 max-w-full' : 'p-4 max-w-4xl'
      }`} style={{ borderRadius: '0px' }}>
        <div className={`flex items-center mb-3 ${
          isMobile ? 'flex-wrap space-x-1 space-y-1' : 'space-x-2'
        }`}>
          <Brain className={`text-[#007FFF] ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span className={`font-bold text-[#001F3F] tracking-wide ${
            isMobile ? 'text-sm' : ''
          }`}>FINANCE GURU</span>
          {symbol && assetType && (
            <div className={`flex items-center space-x-2 ${isMobile ? 'ml-0' : 'ml-2'}`}>
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
            <div className={`flex items-center space-x-2 ${
              isMobile ? 'ml-0 mt-1 w-full' : 'ml-4'
            }`}>
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
          <p className={`text-[#001F3F] leading-relaxed whitespace-pre-wrap ${
            isMobile ? 'text-sm' : ''
          }`}>{message}</p>
        </div>

        {/* Analysis Summary Cards - Only show for financial advice */}
        {analysis && analysis.isFinancialAdvice && (
          <div className="mt-4">
            {symbol ? (
              // Asset-specific analysis (full details)
              <div className={`grid gap-2 ${
                isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
              }`}>
                <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${
                  isMobile ? 'p-1' : 'p-2'
                }`}>
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">RISK</p>
                  <p className={`font-bold ${
                    analysis.riskLevel === 'LOW' ? 'text-green-600' :
                    analysis.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
                  } ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {analysis.riskLevel}
                  </p>
                </div>
                <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${
                  isMobile ? 'p-1' : 'p-2'
                }`}>
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">HORIZON</p>
                  <p className={`font-bold text-[#001F3F] ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>{analysis.timeHorizon}</p>
                </div>
                <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${
                  isMobile ? 'p-1' : 'p-2'
                }`}>
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">CONFIDENCE</p>
                  <p className={`font-bold text-[#001F3F] ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>{analysis.confidence}%</p>
                </div>
                {analysis.priceTarget && (
                  <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${
                    isMobile ? 'p-1' : 'p-2'
                  }`}>
                    <p className="text-xs text-[#001F3F] opacity-70 font-bold">TARGET</p>
                    <p className={`font-bold text-[#001F3F] ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {assetType === 'crypto' ? '$' : '₹'}{analysis.priceTarget}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // General financial advice (simplified)
              <div className={`grid gap-2 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-2'
              } max-w-md`}>
                <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${
                  isMobile ? 'p-2' : 'p-2'
                }`}>
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">RISK LEVEL</p>
                  <p className={`font-bold ${
                    analysis.riskLevel === 'LOW' ? 'text-green-600' :
                    analysis.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
                  } ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {analysis.riskLevel}
                  </p>
                </div>
                <div className={`bg-blue-50 border-2 border-[#007FFF] text-center ${
                  isMobile ? 'p-2' : 'p-2'
                }`}>
                  <p className="text-xs text-[#001F3F] opacity-70 font-bold">CONFIDENCE</p>
                  <p className={`font-bold text-[#001F3F] ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>{analysis.confidence}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Asset Chart */}
        {chartData && symbol && (
          <div className="mt-6">
            <div className={`flex items-center mb-3 ${
              isMobile ? 'space-x-1' : 'space-x-2'
            }`}>
              {assetType === 'crypto' ? (
                <Coins className={`text-orange-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              ) : (
                <TrendingUp className={`text-green-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              )}
              <h3 className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-sm' : 'text-lg'
              }`}>
                {symbol} {assetType === 'crypto' ? 'Price Chart' : 'Stock Chart'}
              </h3>
            </div>
            <ProfessionalStockChart 
              data={chartData} 
              symbol={symbol}
              height={isMobile ? 250 : 350}
              showVolume={false} // Hide volume for crypto since it's not always available
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinanceAdvisorTab() {
  const isMobile = useIsMobile()
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
    <div className={`h-full flex flex-col ${isMobile ? 'max-w-full' : 'max-w-6xl mx-auto'}`}>
      {/* Header */}
      <div className={`bg-white/60 border-4 border-[#007FFF] mb-4 ${
        isMobile ? 'p-3' : 'p-4'
      }`} style={{ borderRadius: '0px' }}>
        <div className={`flex items-center ${
          isMobile ? 'space-x-2' : 'space-x-3'
        }`}>
          <MessageSquare className={`text-[#007FFF] ${
            isMobile ? 'w-6 h-6' : 'w-8 h-8'
          }`} />
          <div>
            <h2 className={`font-bold text-[#001F3F] tracking-wider ${
              isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              🤖 FINANCE ADVISOR
            </h2>
            <p className={`text-[#001F3F] opacity-70 ${
              isMobile ? 'text-xs' : ''
            }`}>
              Gen Z AI • Stocks & Crypto Analysis • Real-time data • No cap! 💯
            </p>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mt-4 space-y-2">
          <div className={`flex items-center mb-2 ${
            isMobile ? 'space-x-1' : 'space-x-2'
          }`}>
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className={`font-bold text-[#001F3F] ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>STOCKS</span>
            <div className="flex-1 h-px bg-[#007FFF] opacity-30"></div>
            <Coins className="w-4 h-4 text-orange-500" />
            <span className={`font-bold text-[#001F3F] ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>CRYPTO</span>
          </div>
          <div className={`flex flex-wrap gap-2 ${
            isMobile ? 'gap-1' : ''
          }`}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputValue(action.message)}
                className={`border-2 border-[#007FFF] hover:bg-[#007FFF] hover:text-white transition-colors font-bold ${
                  action.type === 'crypto' 
                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-500' 
                    : 'bg-green-50 text-green-700 hover:bg-green-500'
                } ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'}`}
                style={{ borderRadius: '0px' }}
              >
                {isMobile ? action.label.split(' ')[0] : action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 bg-white/40 border-4 border-[#007FFF] overflow-y-auto ${
        isMobile ? 'p-2' : 'p-4'
      }`} style={{ borderRadius: '0px' }}>
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
              isMobile={isMobile}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className={`bg-white/80 border-4 border-[#007FFF] ${
                isMobile ? 'p-3' : 'p-4'
              }`} style={{ borderRadius: '0px' }}>
                <div className={`flex items-center ${
                  isMobile ? 'space-x-1' : 'space-x-2'
                }`}>
                  <Brain className={`text-[#007FFF] animate-pulse ${
                    isMobile ? 'w-4 h-4' : 'w-5 h-5'
                  }`} />
                  <span className={`font-bold text-[#001F3F] ${
                    isMobile ? 'text-sm' : ''
                  }`}>FINANCE GURU</span>
                  <span className={`text-[#001F3F] opacity-70 ${
                    isMobile ? 'text-xs' : ''
                  }`}>is analyzing...</span>
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
      <div className={`bg-white/60 border-4 border-[#007FFF] mt-4 ${
        isMobile ? 'p-3' : 'p-4'
      }`} style={{ borderRadius: '0px' }}>
        <div className={`flex ${
          isMobile ? 'flex-col space-y-2' : 'space-x-3'
        }`}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about any stock or crypto! Try: 'How is Tesla doing?' or 'BTC analysis'"
            className={`border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none resize-none font-mono ${
              isMobile ? 'w-full p-2 text-sm' : 'flex-1 p-3'
            }`}
            style={{ borderRadius: '0px' }}
            rows={isMobile ? 3 : 2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
              isMobile ? 'w-full px-4 py-3' : 'px-6 py-3'
            }`}
            style={{ borderRadius: '0px' }}
          >
            <Send className={`${isMobile ? 'w-4 h-4 mx-auto' : 'w-5 h-5'}`} />
          </button>
        </div>
        
        {/* Help Text & Disclaimer */}
        <div className={`space-y-2 ${isMobile ? 'mt-2' : 'mt-3'}`}>
          <div className={`flex items-center space-x-2 text-[#007FFF] font-medium ${
            isMobile ? 'text-xs' : 'text-xs'
          }`}>
            <span>💡</span>
            <p>Pro tip: If I don't understand, try exact names like "TSLA", "BTC", "NVDA", "ETH" or "SOL"</p>
          </div>
          <div className={`flex items-center space-x-2 text-[#001F3F] opacity-60 ${
            isMobile ? 'text-xs' : 'text-xs'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <p>Not financial advice • DYOR • Stocks & crypto are risky AF • CoinGecko & stock APIs for data</p>
          </div>
        </div>
      </div>
    </div>
  )
}

 