import React, { useState, useRef, useEffect } from 'react'
import { Send, Brain, MessageSquare, AlertTriangle, TrendingUp, Coins } from 'lucide-react'
import financeAdvisorAgent from '../../Agents/financeAdvisorAgent'
import AdvancedStockChart from '../charts/AdvancedStockChart'
import ProfessionalStockChart from '../charts/ProfessionalStockChart'
import { stockAPI } from '../../services/stockAPI'
import { extractAssetSymbol } from '../../utils/symbolUtils'
import { useIsMobile } from '../../hooks/use-Mobile'
import type { ChatMessage, AnalysisResponse } from '../../Agents/financeAdvisorAgent'
import type { AssetHistoricalData, AssetType } from '../../services/stockAPI'
import type { ChartViewMode } from '../../types/chartTypes'
import type { PatternDetection } from '../../utils/candlestickPatterns'

interface ChatBubbleProps {
  message: string
  isUser: boolean
  analysis?: AnalysisResponse
  showChart?: boolean
  chartData?: AssetHistoricalData[] // For crypto charts
  symbol?: string
  assetType?: AssetType
  chartViewMode?: ChartViewMode
  isMobile?: boolean
}

function ChatBubble({ message, isUser, analysis, showChart, chartData, symbol, assetType, chartViewMode = 'line', isMobile = false }: ChatBubbleProps) {
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
        <div 
          className={`text-[#001F3F] leading-relaxed whitespace-pre-wrap ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}
          style={{ 
            fontFamily: 'inherit',
            wordBreak: 'break-word'
          }}
        >
          {(() => {
            // Convert message to string safely
            if (React.isValidElement(message)) {
              console.warn('React element detected in ChatBubble message:', message);
              return '[Invalid AI response: React element received]';
            }
            
            if (typeof message === 'string') {
              // Simple markdown-style formatting
              return message
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .split('\n')
                .map((line, index) => (
                  <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
                ));
            }
            
            if (message === null || message === undefined) {
              return '[Empty message]';
            }
            
            // For any other type, stringify it
            try {
              return JSON.stringify(message, null, 2);
            } catch (err) {
              console.error('Error stringifying message:', err);
              return '[Unable to display message]';
            }
          })()}
        </div>
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

        {/* Asset Charts - Advanced for Stocks, Original for Crypto */}
        {showChart && symbol && assetType === 'stock' && (
          <div className="mt-6">
            <AdvancedStockChart 
              symbol={symbol}
              initialViewMode={chartViewMode}
              isMobile={isMobile}
              config={{
                height: isMobile ? 300 : 400,
                showVolume: !isMobile,
                showPatterns: chartViewMode === 'candlestick'
              }}
              onPatternClick={(pattern: PatternDetection) => {
                console.log('Pattern clicked:', pattern);
              }}
            />
          </div>
        )}

        {/* Original Chart for Crypto */}
        {chartData && symbol && assetType === 'crypto' && (
          <div className="mt-6">
            <div className={`flex items-center mb-3 ${
              isMobile ? 'space-x-1' : 'space-x-2'
            }`}>
                <Coins className={`text-orange-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <h3 className={`font-bold text-[#001F3F] ${
                isMobile ? 'text-sm' : 'text-lg'
              }`}>
                {symbol} Crypto Chart
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
    showChart?: boolean
    chartData?: AssetHistoricalData[]
    symbol?: string
    assetType?: AssetType
    chartViewMode?: ChartViewMode
  }>>([
    {
      text: "Yo! 👋 FinanceGuru here, ready to analyze stocks AND crypto with REAL data! 🚀\n\nI'm now equipped with ADVANCED CHARTING for STOCKS:\n\n🔥 **REAL-TIME CANDLESTICKS** with pattern detection\n📈 **50-DAY TREND ANALYSIS** with key metrics\n⚡ **Live pattern alerts** for trading signals\n💰 **Crypto charts** using CoinGecko data\n\n💡 Try:\n• \"Show TSLA candlestick patterns\" (Advanced Stock Chart)\n• \"NVDA real-time signals\" (Pattern Detection)\n• \"BTC analysis\" (Crypto Chart)\n• \"ETH trends\" (Crypto Analysis)\n\nLet's make some money moves! 💰🔥📊",
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
      console.log(`🎯 Extracted symbol: ${assetSymbol} from message: "${userMessage}"`);
      
      let assetType: AssetType | undefined
      let showChart = false
      let chartData: AssetHistoricalData[] | undefined
      let chartViewMode: ChartViewMode = 'line'
      
      if (assetSymbol) {
        assetType = stockAPI.getAssetType(assetSymbol)
        console.log(`📊 Asset type for ${assetSymbol}: ${assetType}`);
        
        if (assetType === 'stock') {
          // For stocks, use advanced charting system
          showChart = true
          console.log(`🚀 Enabling stock chart for ${assetSymbol}`);
          
          // Determine chart view mode based on user request
          const lowerMessage = userMessage.toLowerCase()
          if (lowerMessage.includes('candlestick') || 
              lowerMessage.includes('pattern') || 
              lowerMessage.includes('real-time') ||
              lowerMessage.includes('signals') ||
              lowerMessage.includes('intraday')) {
            chartViewMode = 'candlestick'
            console.log(`📈 Using candlestick mode for ${assetSymbol}`);
          } else if (lowerMessage.includes('trend') || 
                     lowerMessage.includes('30 day') || 
                     lowerMessage.includes('50 day') || 
                     lowerMessage.includes('monthly') ||
                     lowerMessage.includes('history')) {
            chartViewMode = 'line'
            console.log(`📊 Using line mode for ${assetSymbol}`);
          } else {
            // Default to line chart for general stock analysis
            chartViewMode = 'line'
            console.log(`📊 Using default line mode for ${assetSymbol}`);
          }
        } else if (assetType === 'crypto') {
          // For crypto, use original chart system with CoinGecko data
          console.log(`₿ Fetching crypto chart data for ${assetSymbol}`);
          try {
            chartData = await stockAPI.getAssetHistoricalData(assetSymbol, 50)
            console.log(`✅ Got crypto chart data for ${assetSymbol}:`, chartData?.length, 'data points');
        } catch (error) {
            console.error('❌ Error fetching crypto chart data:', error)
          }
        }
      } else {
        console.log(`❌ No symbol extracted from: "${userMessage}"`);
      }

      // Add AI response with analysis and chart configuration
      setMessages(prev => [...prev, { 
        text: analysis.message, 
        isUser: false, 
        analysis,
        showChart,
        chartData,
        symbol: assetSymbol || undefined,
        assetType,
        chartViewMode
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

  // Enhanced quick action buttons - Advanced charts for stocks, CoinGecko for crypto
  const quickActions = [
    { label: "📈 AAPL Patterns", message: "Show AAPL candlestick patterns", type: "stock", mode: "candlestick" },
    { label: "₿ BTC Analysis", message: "Analyze BTC price and trends", type: "crypto", mode: "line" },
    { label: "🚗 TSLA Signals", message: "TSLA real-time signals", type: "stock", mode: "candlestick" },
    { label: "⚡ ETH Analysis", message: "How is ETH performing today?", type: "crypto", mode: "line" },
    { label: "🔥 NVDA Live", message: "NVDA live candlestick patterns", type: "stock", mode: "candlestick" },
    { label: "🌟 SOL Trends", message: "Analyze SOL crypto trends", type: "crypto", mode: "line" }
  ]

  return (
    <div className={`h-full flex flex-col ${isMobile ? 'max-w-full bg-white' : 'max-w-6xl mx-auto'}`}>
      {/* Header */}
      <div className={`bg-white/80 border-2 border-[#007FFF] mb-4 ${
        isMobile ? 'p-2 rounded-xl shadow-sm' : 'p-4 rounded-2xl'
      }`}>
        <div className={`flex items-center ${
          isMobile ? 'space-x-2' : 'space-x-3'
        }`}>
          <MessageSquare className={`text-[#007FFF] ${
            isMobile ? 'w-5 h-5' : 'w-8 h-8'
          }`} />
          <div>
            <h2 className={`font-bold text-[#001F3F] tracking-wider ${
              isMobile ? 'text-lg' : 'text-2xl'
            }`}>
              FINANCE ADVISOR
            </h2>
            <p className={`text-[#001F3F] opacity-70 ${
              isMobile ? 'text-xs' : ''
            }`}>
              Gen Z AI • Advanced Charts • Pattern Detection • Real-time Candlesticks • No cap! 💯
            </p>
          </div>
        </div>
        {/* Enhanced Quick Actions */}
        <div className="mt-3 space-y-2">
          <div className={`flex items-center mb-2 ${
            isMobile ? 'space-x-1' : 'space-x-2'
          }`}>
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="font-bold text-[#001F3F] text-xs">STOCKS</span>
            <div className="flex-1 h-px bg-[#007FFF] opacity-30"></div>
            <Coins className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-[#001F3F] text-xs">CRYPTO</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInputValue(action.message)}
                className={`border-2 border-[#007FFF] rounded-lg px-2 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FFF] ${
                  action.type === 'crypto' 
                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white' 
                    : 'bg-green-50 text-green-700 hover:bg-green-500 hover:text-white'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 bg-white border-2 border-[#007FFF] overflow-y-auto ${
        isMobile ? 'p-2 rounded-xl' : 'p-4 rounded-2xl'
      }`}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatBubble 
              key={index} 
              message={message.text} 
              isUser={message.isUser}
              analysis={message.analysis}
              showChart={message.showChart}
              chartData={message.chartData}
              symbol={message.symbol}
              assetType={message.assetType}
              chartViewMode={message.chartViewMode}
              isMobile={isMobile}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white/90 border-2 border-[#007FFF] p-3 rounded-xl">
                <div className="flex items-center space-x-1">
                  <Brain className="text-[#007FFF] animate-pulse w-4 h-4" />
                  <span className="font-bold text-[#001F3F] text-sm">FINANCE GURU</span>
                  <span className="text-[#001F3F] opacity-70 text-xs">is analyzing...</span>
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
      <div className={`bg-white border-2 border-[#007FFF] mt-3 ${
        isMobile ? 'p-2 rounded-xl' : 'p-4 rounded-2xl'
      }`}>
        <div className={`flex ${
          isMobile ? 'flex-col space-y-2' : 'space-x-3'
        }`}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about any stock or crypto! Try: 'How is Tesla doing?' or 'BTC analysis'"
            className={`border-2 border-[#007FFF] text-[#001F3F] focus:border-[#001F3F] focus:outline-none resize-none font-mono bg-white ${
              isMobile ? 'w-full p-2 text-sm rounded-lg' : 'flex-1 p-3 rounded-xl'
            }`}
            rows={isMobile ? 3 : 2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`bg-gradient-to-r from-[#007FFF] to-[#001F3F] text-white border-2 border-[#001F3F] hover:from-[#001F3F] hover:to-[#007FFF] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
              isMobile ? 'w-full px-4 py-3 rounded-lg mt-2' : 'px-6 py-3 rounded-xl'
            }`}
          >
            <Send className={`${isMobile ? 'w-4 h-4 mx-auto' : 'w-5 h-5'}`} />
          </button>
        </div>
        {/* Help Text & Disclaimer */}
        <div className={`space-y-2 ${isMobile ? 'mt-2' : 'mt-3'}`}>
          <div className="flex items-center space-x-2 text-[#007FFF] font-medium text-xs">
            <span>💡</span>
            <p>Pro tip: Ask for "candlestick patterns", "real-time signals", or "50-day trends" for advanced charts!</p>
          </div>
          <div className="flex items-center space-x-2 text-[#001F3F] opacity-60 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <p>Not financial advice • DYOR • Advanced charts with pattern detection • Alpha Vantage & CoinGecko APIs</p>
          </div>
        </div>
      </div>
    </div>
  )
}

 