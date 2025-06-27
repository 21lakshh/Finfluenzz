import { Button as RetroButton } from "pixel-retroui";
import {  TrendingUp } from "lucide-react";
import { RetroGrid } from "./magicui/retro-grid";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-b from-[#F0F8FF] to-white dark:from-gray-900 dark:to-black">
      {/* Overlay to blend white background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F0F8FF]/80 to-white/80 dark:from-gray-900/80 dark:to-black/80"></div>
      

      {/* RetroGrid Background */}
      <RetroGrid 
        className="opacity-60"
        darkLineColor="blue"
        lightLineColor="blue"
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-8 h-8 bg-[#007FFF] opacity-20 rounded-sm animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-[#001F3F] opacity-30 rounded-sm animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-10 h-10 bg-[#007FFF] opacity-15 rounded-sm animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-[#001F3F] opacity-25 rounded-sm animate-bounce delay-500"></div>
      </div>

      <div className="text-center max-w-4xl mx-auto relative z-10 bg-white/10 dark:bg-black/10 rounded-3xl p-8 border border-white/20">

        {/* Main Headline with Minecraft Font */}
        <h1 className="text-4xl md:text-6xl font-bold text-[#001F3F] mb-6 font-minecraft leading-tight">
          Empowering Gen Z with
          <br />
          <span className="text-[#007FFF] animate-pulse">Smart Finance</span>
          <br />
          One Pixel at a Time
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-[#001F3F] mb-8 font-minecraft opacity-80">
          Analyze stocks, budget better, and master investing — 
          <br className="hidden md:block" />
          all with AI and gamified simplicity.
        </p>

        {/* CTAs using RetroUI Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <RetroButton 
            className="bg-[#007FFF] hover:bg-[#001F3F] text-white px-8 py-4 text-lg font-minecraft border-4 border-[#001F3F] shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            Explore Features
            <TrendingUp className="w-5 h-5" />
          </RetroButton>
        
        </div>

        {/* Floating Coins Animation */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-yellow-400 rounded-full animate-bounce delay-300 opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce delay-700 opacity-60"></div>
        <div className="absolute bottom-1/4 left-1/3 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-1000 opacity-60"></div>
      </div>
    </section>
  );
};

export default HeroSection;