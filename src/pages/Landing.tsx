import HeroSection from "../components/HeroSection"
import { MarqueeDemo } from "../components/reviews"
import { FinanceFeatures } from "../components/FinanceFeatures"

export default function Landing() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#F0F8FF] to-white dark:from-gray-900 dark:to-black">

            {/* Hero content overlay */}
            <div className="relative z-10">
                <HeroSection />
            </div>

            {/* Features Bento Grid Section */}
            <section className="relative z-10 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/50 dark:to-black">
                <FinanceFeatures />
            </section>

            {/* Reviews Section */}
            <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-white/30 to-blue-50/30 dark:from-black/30 dark:to-slate-900/30">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#001F3F] dark:text-white mb-4 font-minecraft">
                        What Our Users Say
                    </h2>
                    <p className="text-xl text-[#001F3F] dark:text-gray-300 font-minecraft opacity-80">
                        Real feedback from Gen Z investors who love Finfluenzz
                    </p>
                </div>
                <div className="max-w-7xl mx-auto">
                    <MarqueeDemo />
                </div>
            </section>
        </div>
    )
}