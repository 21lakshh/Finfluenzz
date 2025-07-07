import React, { useState, useRef } from 'react'
import { Upload, FileText, Image, BarChart3, AlertTriangle } from 'lucide-react'
import { useIsMobile } from '../../hooks/use-Mobile'
import portfolioAnalysisAgent from '../../Agents/portfolioAnalysisAgent'
import { processPortfolioFile, validatePortfolioContent } from '../../utils/fileProcessor'
import type { PortfolioAnalysisResult, StockAnalysis } from '../../Agents/portfolioAnalysisAgent'

export default function InvestmentZone() {
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [analysisResult, setAnalysisResult] = useState<PortfolioAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadedFile(file)
    setIsAnalyzing(true)

    try {
      // Process the uploaded file
      const processedFile = await processPortfolioFile(file)
      
      if (!processedFile.success) {
        throw new Error(processedFile.error || 'Failed to process file')
      }

      // Validate the extracted content
      const validation = validatePortfolioContent(processedFile.text)
      if (!validation.isValid) {
        throw new Error(validation.reason || 'Invalid portfolio content')
      }
      
      // Analyze the portfolio using AI
      const result = await portfolioAnalysisAgent(processedFile.text)
      setAnalysisResult(result)

    } catch (err) {
      console.error('Portfolio analysis error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setAnalysisResult(null)
    setUploadedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getRecommendationColor = (recommendation: StockAnalysis['recommendation']) => {
    switch (recommendation) {
      case 'STRONG_BUY': return 'text-green-600 bg-green-100'
      case 'BUY': return 'text-green-500 bg-green-50'
      case 'HOLD': return 'text-yellow-600 bg-yellow-100'
      case 'SELL': return 'text-red-500 bg-red-50'
      case 'STRONG_SELL': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'HIGH': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-bold text-[#001F3F] text-3xl mb-2">INVESTMENT ZONE</h1>
        <div className="w-24 h-1 bg-[#007FFF] mx-auto"></div>
      </div>

      {!analysisResult ? (
        <>
          {/* Portfolio Analysis Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/60 border-4 border-[#007FFF] p-8">
              <h2 className="font-bold text-[#001F3F] text-2xl mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Portfolio Analysis AI
              </h2>
              <p className="text-[#001F3F] opacity-70 text-lg mb-6">
                Upload your portfolio document (PDF, image, or text) and get detailed AI-powered insights about your holdings with real-time market data!
              </p>

              {/* Upload Section */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="border-2 border-dashed border-[#007FFF] p-8 text-center bg-white/30">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <FileText className="w-12 h-12 text-[#007FFF]" />
                      <Image className="w-12 h-12 text-[#007FFF]" />
                      <Upload className="w-12 h-12 text-[#007FFF]" />
                    </div>
                    
                    <h3 className="font-bold text-[#001F3F] text-xl">Upload Your Portfolio</h3>
                    <p className="text-[#001F3F] opacity-70">
                      Select your portfolio document to get AI-powered analysis with real-time market data
                    </p>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="bg-[#007FFF] hover:bg-[#005FBF] disabled:bg-gray-400 text-white px-8 py-4 font-bold transition-colors text-lg"
                    >
                      {isAnalyzing ? 'ANALYZING...' : 'UPLOAD PORTFOLIO'}
                    </button>
                    
                    <p className="text-xs text-[#001F3F] opacity-60">
                      Supports PDF, PNG, JPG, TXT, CSV files
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isAnalyzing && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007FFF]"></div>
                  <p className="text-[#001F3F] mt-4">Analyzing portfolio with real-time market data...</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border-2 border-red-400 p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold">Analysis Error</span>
                  </div>
                  <p className="text-red-600 mt-2">{error}</p>
                  <button
                    onClick={resetAnalysis}
                    className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-bold"
                  >
                    TRY AGAIN
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Analysis Results */
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Portfolio Analysis Header */}
          <div className="bg-gradient-to-br from-[#001F3F] to-[#003366] border-4 border-[#007FFF] p-6 relative overflow-hidden">
            <div className="absolute top-2 right-2 w-4 h-4 bg-[#007FFF] opacity-50"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#00FF00] opacity-60"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00FF00] flex items-center justify-center">
                  <span className="text-[#001F3F] font-bold text-sm">✓</span>
                </div>
                <h2 className="font-bold text-white text-2xl tracking-wider">AI PORTFOLIO ANALYSIS</h2>
              </div>
              <button
                onClick={resetAnalysis}
                className="bg-[#007FFF] hover:bg-[#005FBF] text-white px-4 py-2 text-sm font-bold border-2 border-white transition-colors"
              >
                NEW SCAN
              </button>
            </div>
            
            <div className="text-xs text-[#007FFF] mb-4 font-mono">
              Analyzed on {new Date().toLocaleDateString('en-GB')} • Real-time market data
            </div>

            {/* Score Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Portfolio Health Score */}
              <div className="bg-[#001F3F] border-2 border-[#007FFF] p-4 relative">
                <div className="text-xs text-[#007FFF] mb-1">PORTFOLIO HEALTH</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {Math.min(95, Math.max(60, 75 + (analysisResult.diversificationScore / 5)))}
                </div>
                <div className="text-xs text-gray-300">/100</div>
                <div className="w-full bg-[#003366] h-2 mt-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-[#007FFF] to-[#00FF00]" 
                    style={{ width: `${Math.min(95, Math.max(60, 75 + (analysisResult.diversificationScore / 5)))}%` }}
                  ></div>
                </div>
              </div>

              {/* Total Value */}
              <div className="bg-[#001F3F] border-2 border-[#00FF00] p-4 relative">
                <div className="text-xs text-[#00FF00] mb-1">TOTAL VALUE</div>
                <div className="text-2xl font-bold text-white mb-1">
                  ₹{(analysisResult.totalPortfolioValue / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-300">₹{analysisResult.totalPortfolioValue.toLocaleString()}</div>
                <div className="w-full bg-[#003366] h-2 mt-2">
                  <div className="h-2 bg-[#00FF00] w-full"></div>
                </div>
              </div>

              {/* Holdings Count */}
              <div className="bg-[#001F3F] border-2 border-[#FF6B00] p-4 relative">
                <div className="text-xs text-[#FF6B00] mb-1">HOLDINGS</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {analysisResult.individualAnalyses.length}
                </div>
                <div className="text-xs text-gray-300">stocks</div>
                <div className="w-full bg-[#003366] h-2 mt-2">
                  <div 
                    className="h-2 bg-[#FF6B00]" 
                    style={{ width: `${Math.min(100, (analysisResult.individualAnalyses.length / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Risk Level */}
              <div className="bg-[#001F3F] border-2 border-[#FF0080] p-4 relative">
                <div className="text-xs text-[#FF0080] mb-1">RISK SCORE</div>
                <div className="text-3xl font-bold text-white mb-2">
                  {analysisResult.individualAnalyses.some(s => s.riskLevel === 'HIGH') ? '72' : 
                   analysisResult.individualAnalyses.some(s => s.riskLevel === 'MEDIUM') ? '45' : '28'}
                </div>
                <div className="text-xs text-gray-300">/100</div>
                <div className="w-full bg-[#003366] h-2 mt-2">
                  <div 
                    className="h-2 bg-[#FF0080]" 
                    style={{ 
                      width: `${analysisResult.individualAnalyses.some(s => s.riskLevel === 'HIGH') ? '72' : 
                              analysisResult.individualAnalyses.some(s => s.riskLevel === 'MEDIUM') ? '45' : '28'}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Analysis Section */}
          <div className="bg-gradient-to-br from-[#001F3F] to-[#003366] border-4 border-[#007FFF] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#007FFF] text-xl">📊</span>
              <h3 className="font-bold text-white text-xl tracking-wider">INDIVIDUAL HOLDINGS ANALYSIS</h3>
            </div>

            {/* Holdings Analysis Table */}
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 text-xs text-[#007FFF] font-bold mb-3 px-4">
                <div className="col-span-3">STOCK</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-7">ANALYSIS & INSIGHTS</div>
              </div>

              {/* Stock Rows */}
              {analysisResult.individualAnalyses.map((stock, index) => {
                const getStatusIcon = (recommendation: string) => {
                  switch (recommendation) {
                    case 'STRONG_BUY':
                    case 'BUY':
                      return '✓'
                    case 'HOLD':
                      return '⚠'
                    case 'SELL':
                    case 'STRONG_SELL':
                      return '✗'
                    default:
                      return '●'
                  }
                }

                const getStatusColor = (recommendation: string) => {
                  switch (recommendation) {
                    case 'STRONG_BUY':
                    case 'BUY':
                      return 'text-[#00FF00] bg-green-900/30 border-[#00FF00]'
                    case 'HOLD':
                      return 'text-[#FFD700] bg-yellow-900/30 border-[#FFD700]'
                    case 'SELL':
                    case 'STRONG_SELL':
                      return 'text-[#FF4444] bg-red-900/30 border-[#FF4444]'
                    default:
                      return 'text-gray-400 bg-gray-900/30 border-gray-400'
                  }
                }

                const getRSIStatus = (rsi: number) => {
                  if (rsi < 30) return { text: 'Oversold', color: 'text-[#00FF00]' }
                  if (rsi > 70) return { text: 'Overbought', color: 'text-[#FF4444]' }
                  return { text: 'Neutral', color: 'text-[#FFD700]' }
                }

                const rsiStatus = getRSIStatus(stock.technicalIndicators.rsi)

                return (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-white/5 transition-colors border-b border-[#007FFF]/20">
                    {/* Stock Info */}
                    <div className="col-span-3">
                      <div className="font-bold text-white text-sm">{stock.symbol}</div>
                      <div className="text-[#007FFF] text-xs">₹{stock.currentPrice.toFixed(2)}</div>
                      <div className={`text-xs flex items-center gap-1 ${stock.priceChangePercent >= 0 ? 'text-[#00FF00]' : 'text-[#FF4444]'}`}>
                        {stock.priceChangePercent >= 0 ? '▲' : '▼'}
                        {stock.priceChangePercent > 0 ? '+' : ''}{stock.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className={`w-6 h-6 flex items-center justify-center border-2 text-xs font-bold ${getStatusColor(stock.recommendation)}`}>
                        {getStatusIcon(stock.recommendation)}
                      </div>
                      <div className="text-xs text-white mt-1">
                        {stock.recommendation.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Analysis */}
                    <div className="col-span-7">
                      <div className="text-sm text-gray-300 leading-relaxed">
                        <span className="font-bold text-white">{stock.recommendation.replace('_', ' ')} recommendation</span> with {stock.confidence}% confidence. 
                        RSI at {stock.technicalIndicators.rsi.toFixed(1)} indicates <span className={rsiStatus.color}>{rsiStatus.text}</span> conditions. 
                        Price {stock.currentPrice > stock.technicalIndicators.sma20 ? 'above' : 'below'} 20-day SMA (₹{stock.technicalIndicators.sma20.toFixed(2)}), 
                        suggesting {stock.currentPrice > stock.technicalIndicators.sma20 ? 'bullish' : 'bearish'} momentum. 
                        <span className={getRiskColor(stock.riskLevel).split(' ')[0]}>{stock.riskLevel} risk</span> profile for {stock.timeHorizon.toLowerCase()}-term outlook.
                      </div>
                      
                      {/* Technical Indicators Pills */}
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-[#007FFF]/20 text-[#007FFF] text-xs border border-[#007FFF]/50">
                          RSI: {stock.technicalIndicators.rsi.toFixed(1)}
                        </span>
                        <span className="px-2 py-1 bg-[#FF6B00]/20 text-[#FF6B00] text-xs border border-[#FF6B00]/50">
                          SMA20: ₹{stock.technicalIndicators.sma20.toFixed(1)}
                        </span>
                        <span className="px-2 py-1 bg-[#FF0080]/20 text-[#FF0080] text-xs border border-[#FF0080]/50">
                          Risk: {stock.riskLevel}
                        </span>
                        <span className="px-2 py-1 bg-[#00FF00]/20 text-[#00FF00] text-xs border border-[#00FF00]/50">
                          Conf: {stock.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#007FFF]/30">
              <div className="text-center">
                <div className="text-xl font-bold text-[#00FF00]">
                  {analysisResult.individualAnalyses.filter(s => s.recommendation.includes('BUY')).length}
                </div>
                <div className="text-xs text-gray-300">BUY SIGNALS</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#FFD700]">
                  {analysisResult.individualAnalyses.filter(s => s.recommendation === 'HOLD').length}
                </div>
                <div className="text-xs text-gray-300">HOLD POSITIONS</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#FF4444]">
                  {analysisResult.individualAnalyses.filter(s => s.recommendation.includes('SELL')).length}
                </div>
                <div className="text-xs text-gray-300">SELL SIGNALS</div>
              </div>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="bg-gradient-to-br from-[#001F3F] to-[#003366] border-4 border-[#00FF00] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#00FF00] text-xl">🤖</span>
              <h3 className="font-bold text-white text-xl tracking-wider">AI PORTFOLIO RECOMMENDATIONS</h3>
            </div>

            {/* AI Analysis Content */}
            <div className="bg-black/30 border-2 border-[#00FF00]/50 p-4 font-mono text-sm">
              <div className="text-[#00FF00] mb-2">
                &gt; ANALYZING PORTFOLIO PERFORMANCE...
              </div>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {analysisResult.overallRecommendation}
              </div>
            </div>

            {/* Action Items */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#001F3F] border-2 border-[#00FF00] p-4">
                <div className="text-[#00FF00] font-bold mb-2">💡 KEY INSIGHTS</div>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Total portfolio value: ₹{analysisResult.totalPortfolioValue.toLocaleString()}</li>
                  <li>• {analysisResult.individualAnalyses.filter(s => s.recommendation.includes('BUY')).length} stocks with buy signals</li>
                  <li>• Diversification score: {Math.round(analysisResult.diversificationScore)}%</li>
                  <li>• Average confidence: {Math.round(analysisResult.individualAnalyses.reduce((acc, s) => acc + s.confidence, 0) / analysisResult.individualAnalyses.length)}%</li>
                </ul>
              </div>

              <div className="bg-[#001F3F] border-2 border-[#FFD700] p-4">
                <div className="text-[#FFD700] font-bold mb-2">⚡ ACTION ITEMS</div>
                <ul className="text-gray-300 text-sm space-y-1">
                  {analysisResult.individualAnalyses.filter(s => s.recommendation.includes('BUY')).length > 0 && (
                    <li>• Consider accumulating BUY-rated stocks</li>
                  )}
                  {analysisResult.individualAnalyses.filter(s => s.recommendation.includes('SELL')).length > 0 && (
                    <li>• Review SELL-rated positions</li>
                  )}
                  <li>• Monitor RSI levels for entry/exit points</li>
                  <li>• Rebalance if concentration risk exists</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Risk Assessment Dashboard */}
          <div className="bg-gradient-to-br from-[#001F3F] to-[#003366] border-4 border-[#FF4444] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#FF4444] text-xl">⚠️</span>
              <h3 className="font-bold text-white text-xl tracking-wider">RISK ASSESSMENT MATRIX</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Overall Risk */}
              <div className="bg-[#001F3F] border-2 border-[#FF4444] p-4">
                <div className="text-[#FF4444] text-xs mb-1">PORTFOLIO RISK</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analysisResult.individualAnalyses.some(s => s.riskLevel === 'HIGH') ? 'HIGH' : 
                   analysisResult.individualAnalyses.some(s => s.riskLevel === 'MEDIUM') ? 'MEDIUM' : 'LOW'}
                </div>
                <div className="w-full bg-[#003366] h-2">
                  <div 
                    className="h-2 bg-[#FF4444]" 
                    style={{ 
                      width: `${analysisResult.individualAnalyses.some(s => s.riskLevel === 'HIGH') ? '75' : 
                              analysisResult.individualAnalyses.some(s => s.riskLevel === 'MEDIUM') ? '50' : '25'}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Volatility */}
              <div className="bg-[#001F3F] border-2 border-[#FF6B00] p-4">
                <div className="text-[#FF6B00] text-xs mb-1">VOLATILITY</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {Math.round(analysisResult.individualAnalyses.reduce((acc, s) => acc + Math.abs(s.priceChangePercent), 0) / analysisResult.individualAnalyses.length)}%
                </div>
                <div className="w-full bg-[#003366] h-2">
                  <div className="h-2 bg-[#FF6B00] w-3/5"></div>
                </div>
              </div>

              {/* Concentration */}
              <div className="bg-[#001F3F] border-2 border-[#FFD700] p-4">
                <div className="text-[#FFD700] text-xs mb-1">CONCENTRATION</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analysisResult.individualAnalyses.length > 8 ? 'LOW' : analysisResult.individualAnalyses.length > 5 ? 'MEDIUM' : 'HIGH'}
                </div>
                <div className="w-full bg-[#003366] h-2">
                  <div 
                    className="h-2 bg-[#FFD700]" 
                    style={{ 
                      width: `${analysisResult.individualAnalyses.length > 8 ? '30' : 
                              analysisResult.individualAnalyses.length > 5 ? '60' : '90'}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="bg-black/30 border-2 border-[#FF4444]/50 p-4">
              <div className="text-[#FF4444] font-bold mb-2">🔍 RISK ANALYSIS</div>
              <div className="text-gray-300 text-sm">
                {analysisResult.riskAssessment}
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#FF4444]">
                    {analysisResult.individualAnalyses.filter(s => s.riskLevel === 'HIGH').length}
                  </div>
                  <div className="text-xs text-gray-400">HIGH RISK</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#FFD700]">
                    {analysisResult.individualAnalyses.filter(s => s.riskLevel === 'MEDIUM').length}
                  </div>
                  <div className="text-xs text-gray-400">MEDIUM RISK</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#00FF00]">
                    {analysisResult.individualAnalyses.filter(s => s.riskLevel === 'LOW').length}
                  </div>
                  <div className="text-xs text-gray-400">LOW RISK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 