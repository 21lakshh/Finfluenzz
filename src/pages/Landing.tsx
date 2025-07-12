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

            {/* Call to Action Section */}
            <section className="relative z-10 py-20 bg-gradient-to-b from-[#B3DBFF] to-[#007FFF]">
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