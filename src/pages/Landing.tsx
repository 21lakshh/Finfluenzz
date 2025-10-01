import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HeroSection from "../components/HeroSection"
import { MarqueeDemo } from "../components/reviews"
import { FinanceFeatures } from "../components/FinanceFeatures"
import { Button } from "../components/button"

export default function Landing() {
    const navigate = useNavigate()
    const { user } = useAuth()

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#F0F8FF] to-[#E6F3FF]">
            {/* Pixelated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        radial-gradient(circle at 25% 25%, #007FFF 2px, transparent 2px),
                        radial-gradient(circle at 75% 75%, #001F3F 2px, transparent 2px)
                    `,
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 20px 20px'
                }}></div>
            </div>

            {/* Hero content overlay */}
            <div className="relative z-10">
                <HeroSection />
            </div>

            {/* Features Bento Grid Section */}
            <section className="relative z-10 bg-gradient-to-b from-[#E6F3FF] to-[#CCE7FF] py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#001F3F] mb-6 tracking-wider">
                        🎮 POWER-UP YOUR FINANCES
                    </h2>
                    <div className="h-2 bg-gradient-to-r from-[#007FFF] to-[#001F3F] w-64 mx-auto mb-6"></div>
                    <p className="text-xl text-[#001F3F] opacity-80 max-w-2xl mx-auto">
                        Level up your money game with these epic features! No cap! 💯
                    </p>
                </div>
                <FinanceFeatures />
            </section>

            {/* Reviews Section */}
            <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-[#CCE7FF] to-[#B3DBFF]">
                {/* Floating retro elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 left-10 w-6 h-6 bg-[#007FFF] opacity-30 transform rotate-45 animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-8 h-8 bg-[#001F3F] opacity-20 animate-bounce"></div>
                    <div className="absolute bottom-40 left-20 w-4 h-4 bg-[#007FFF] opacity-40 transform rotate-45 animate-pulse delay-1000"></div>
                    <div className="absolute bottom-20 right-10 w-6 h-6 bg-[#001F3F] opacity-25 animate-bounce delay-500"></div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <MarqueeDemo />
                </div>
            </section>

            {/* Pricing Section */}
            <section className="relative z-10 py-20 bg-gradient-to-b from-[#B3DBFF] to-[#99CFFF]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#001F3F] mb-6 tracking-wider">
                            💰 PRICING PLANS
                        </h2>
                        <div className="h-2 bg-gradient-to-r from-[#007FFF] to-[#001F3F] w-64 mx-auto mb-6"></div>
                        <p className="text-xl text-[#001F3F] opacity-80 max-w-2xl mx-auto">
                            Choose the plan that best suits your financial goals and needs
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto items-stretch">
                        {/* Free Plan */}
                        <div className="relative bg-white/95 border-4 border-[#001F3F] p-10 pt-12 flex flex-col h-full min-h-[520px] shadow-[6px_6px_0_0_#001F3F] transition duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#001F3F] lg:p-12 lg:pt-14" style={{ borderRadius: '0px' }}>
                            <div className="absolute inset-x-0 top-3 flex justify-center">
                            </div>

                            <div className="text-center mb-8 mt-4">
                                <div className="inline-block bg-[#CCE7FF] border-2 border-[#001F3F] px-4 py-2 mb-4" style={{ borderRadius: '0px' }}>
                                    <span className="text-sm font-bold text-[#001F3F] tracking-wider">FREE TIER</span>
                                </div>
                                <h3 className="text-3xl font-bold text-[#001F3F] mb-2 tracking-wider">FREE</h3>
                                <p className="text-[#001F3F] opacity-70">No credit card required</p>
                            </div>

                            <div className="space-y-4 mb-8 flex-1 text-left">
                                <div className="flex items-start gap-3">
                                    <span className="text-[#007FFF] text-xl flex-shrink-0 mt-0.5">✓</span>
                                    <p className="text-[#001F3F] flex-1">
                                        <strong>AI-Powered Insights</strong> with Meta Llama 4
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#007FFF] text-xl flex-shrink-0 mt-0.5">✓</span>
                                    <p className="text-[#001F3F] flex-1">
                                        Portfolio tracking and performance monitoring
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#007FFF] text-xl flex-shrink-0 mt-0.5">✓</span>
                                    <p className="text-[#001F3F] flex-1">
                                        Expense categorization and budgeting tools
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#007FFF] text-xl flex-shrink-0 mt-0.5">✓</span>
                                    <p className="text-[#001F3F] flex-1">
                                        Access to financial challenges and rewards
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#007FFF] text-xl flex-shrink-0 mt-0.5">✓</span>
                                    <p className="text-[#001F3F] flex-1">
                                        Market data from external sources
                                    </p>
                                </div>
                            </div>

                            <button className="mt-auto w-full bg-white text-[#007FFF] border-2 border-[#007FFF] hover:bg-[#007FFF] hover:text-[#001F3F] font-minecraft text-lg py-6 tracking-wide" onClick={() => navigate('/signup')}>
                                Start Free
                            </button>
                        </div>

                        {/* Premium Plan */}
                        <div className="relative bg-gradient-to-br from-[#1E66FF] via-[#0057D6] to-[#001F3F] border-4 border-[#001F3F] p-10 pt-12 flex flex-col h-full min-h-[520px] transition duration-300 shadow-[6px_6px_0_0_#001F3F] hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#001F3F] lg:p-12 lg:pt-14" style={{ borderRadius: '0px' }}>
                            {/* Popular badge */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                <div className="bg-[#FFD700] border-2 border-[#001F3F] px-6 py-2" style={{ borderRadius: '0px' }}>
                                    <span className="text-sm font-bold text-[#001F3F] tracking-wider">⭐ MOST POPULAR</span>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <div className="inline-block bg-white/20 border-2 border-white px-4 py-2 mb-4" style={{ borderRadius: '0px' }}>
                                    <span className="text-sm font-bold text-white tracking-wider">PREMIUM</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2 tracking-wider">$20<span className="text-lg">/month</span></h3>
                                <p className="text-white/80">Advanced features and insights</p>
                            </div>

                            <div className="space-y-4 mb-8 flex-1 text-left">
                                <div className="flex items-start gap-3">
                                    <span className="text-[#FFD700] text-xl flex-shrink-0 mt-0.5">★</span>
                                    <p className="text-white flex-1">
                                        <strong>Premium AI Models:</strong> GPT-5, Gemini, or Grok for advanced analysis
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#FFD700] text-xl flex-shrink-0 mt-0.5">★</span>
                                    <p className="text-white flex-1">
                                        <strong>Real-Time Market Data</strong> from institutional-grade sources
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#FFD700] text-xl flex-shrink-0 mt-0.5">★</span>
                                    <p className="text-white flex-1">
                                        <strong>Unlimited Portfolio Analysis</strong> with deep insights and recommendations
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#FFD700] text-xl flex-shrink-0 mt-0.5">★</span>
                                    <p className="text-white flex-1">
                                        <strong>AI Financial Advisor</strong> with unlimited consultation access
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#FFD700] text-xl flex-shrink-0 mt-0.5">★</span>
                                    <p className="text-white flex-1">
                                        <strong>Market News Alerts</strong> delivered via personalized newsletters
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-[#FFD700] text-xl flex-shrink-0 mt-0.5">★</span>
                                    <p className="text-white flex-1">
                                        <strong>Complete Free Tier</strong> features included
                                    </p>
                                </div>
                            </div>

                            <button className="mt-auto w-full bg-white text-[#007FFF] border-2 border-[#007FFF] hover:bg-[#FFD700] hover:text-[#001F3F] font-minecraft text-lg py-6 tracking-wide" onClick={() => navigate('/signup')}>
                                Go Pro Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="relative z-10 py-20 bg-gradient-to-b from-[#99CFFF] to-[#007FFF]">
                <div className="text-center max-w-4xl mx-auto px-4">
                    <div className="bg-white/80 border-4 border-[#001F3F] p-12" style={{ borderRadius: '0px' }}>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#001F3F] mb-6 tracking-wider">
                            ⚡ READY TO LEVEL UP?
                        </h2>
                        <p className="text-xl text-[#001F3F] mb-8 opacity-80">
                            Join thousands of Gen Z investors already winning with Finfluenzz! 🚀
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            {user ? (
                                // Show dashboard button if user is logged in
                                <Button 
                                    variant="default"
                                    size="lg"
                                    className="bg-[#007FFF] hover:bg-[#001F3F] text-white border-[#001F3F] font-minecraft text-lg"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    🎮 GO TO DASHBOARD
                                </Button>
                            ) : (
                                // Show signup and signin buttons if user is not logged in
                                <>
                                    <Button 
                                        variant="default"
                                        size="lg"
                                        className="bg-[#007FFF] hover:bg-[#001F3F] text-white border-[#001F3F] font-minecraft text-lg"
                                        onClick={() => navigate('/signup')}
                                    >
                                        🎮 START YOUR JOURNEY
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        size="lg"
                                        className="bg-white text-[#007FFF] border-[#007FFF] hover:bg-[#007FFF] hover:text-white font-minecraft text-lg"
                                        onClick={() => navigate('/signin')}
                                    >
                                        📊 SIGN IN
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}