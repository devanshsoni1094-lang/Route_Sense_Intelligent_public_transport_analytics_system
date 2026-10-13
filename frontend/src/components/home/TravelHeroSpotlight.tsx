"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Ticket,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause
} from "lucide-react";
import { MultiModalOption } from "@/types";

interface TravelHeroSpotlightProps {
  recommendedOption: MultiModalOption | null;
  routeOptions?: MultiModalOption[];
  onGetPass: (option: MultiModalOption) => void;
}

const POSITIVE_TRAVEL_QUOTES = [
  {
    quote: "Safar khoobsurat hai manzil se bhi.",
    thought: "The true soul of Mumbai lives in the Sea Link breeze, the clatter of the local train tracks, and the golden dusk over Marine Drive.",
    tag: "SPIRIT OF AAMCHI MUMBAI",
    icon: "🌊",
    gradient: "from-indigo-950 via-purple-900 to-amber-700",
    locationMood: "Bandra-Worli Sea Link"
  },
  {
    quote: "Not all those who wander are lost.",
    thought: "Catch the fast local train from Churchgate, watch the Arabian coast shimmer at twilight, and feel the heartbeat of maximum city.",
    tag: "MUMBAI LOCAL VIBES",
    icon: "🚆",
    gradient: "from-blue-950 via-indigo-900 to-rose-700",
    locationMood: "Western Railway Fast Line"
  },
  {
    quote: "Travel is the only thing you buy that makes you richer.",
    thought: "Richest is the commuter who sips cutting chai at Dadar station, feels the cool wind at the window, and moves with millions in harmony.",
    tag: "PULSE OF THE CITY",
    icon: "☕",
    gradient: "from-purple-950 via-rose-900 to-amber-600",
    locationMood: "Dadar Central Junction"
  },
  {
    quote: "Wherever you go, go with all your heart.",
    thought: "Step aboard the red BEST electric bus or gliding Metro Line 3. In Mumbai, every commuter carries a universe of dreams.",
    tag: "HEART OF MUMBAI",
    icon: "💚",
    gradient: "from-slate-950 via-violet-900 to-orange-700",
    locationMood: "BEST Electric Corridor"
  },
  {
    quote: "A journey of a thousand miles begins with a single step.",
    thought: "From a ₹5 local train pass to an ocean bridge drive across Atal Setu, every journey across Mumbai takes you closer to your ambitions.",
    tag: "MAXIMUM DREAMS",
    icon: "🌟",
    gradient: "from-stone-950 via-purple-900 to-rose-600",
    locationMood: "Coastal Road & Atal Setu"
  },
  {
    quote: "Live with no excuses and travel with no regrets.",
    thought: "Take the window seat, watch the Victorian heritage arches of CSMT light up, and celebrate the daily resilience of Mumbai.",
    tag: "CITY OF DREAMS",
    icon: "🌇",
    gradient: "from-zinc-950 via-pink-900 to-amber-700",
    locationMood: "Historic CSMT Terminus"
  },
  {
    quote: "The world is a book, and those who do not travel read only one page.",
    thought: "From Colaba's historic docks to Borivali's green National Park forest, open a vibrant new chapter on every Mumbai route.",
    tag: "DISCOVER MUMBAI",
    icon: "📖",
    gradient: "from-violet-950 via-purple-900 to-orange-600",
    locationMood: "Sanjay Gandhi National Park Rail"
  },
  {
    quote: "Life is short and the world is wide.",
    thought: "Breathe in the Arabian ocean air at Bandstand, wave to fellow travelers, and let Mumbai's electric energy guide your path.",
    tag: "COASTAL HORIZONS",
    icon: "🌅",
    gradient: "from-indigo-950 via-rose-900 to-amber-600",
    locationMood: "Bandra Bandstand Promenade"
  }
];

export const TravelHeroSpotlight: React.FC<TravelHeroSpotlightProps> = ({
  recommendedOption,
  routeOptions = [],
  onGetPass
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeAnim, setFadeAnim] = useState(true);

  // Cycle quote every 5000ms
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % POSITIVE_TRAVEL_QUOTES.length);
        setFadeAnim(true);
      }, 250);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const activeQuote = POSITIVE_TRAVEL_QUOTES[currentQuoteIndex];

  // Manual navigation handlers
  const handlePrev = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => (prev === 0 ? POSITIVE_TRAVEL_QUOTES.length - 1 : prev - 1));
      setFadeAnim(true);
    }, 200);
  };

  const handleNext = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % POSITIVE_TRAVEL_QUOTES.length);
      setFadeAnim(true);
    }, 200);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`lg:col-span-8 rounded-[32px] bg-gradient-to-r ${activeQuote.gradient} p-6 sm:p-7 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[290px] border border-white/15 transition-all duration-700`}
    >
      {/* 1. SCENIC BACKGROUND AMBIENT GLOWS */}
      <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-900/40 blur-3xl pointer-events-none" />

      {/* 2. THE ANIMATED TRAVELING BOY SCENERY (Right Side Floating Canvas) */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[52%] pointer-events-none overflow-hidden select-none z-0">
        
        {/* Drifting Birds across dusk sky */}
        <div className="absolute top-4 left-6 anim-birds-glide">
          <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
            <path d="M0 8 Q7 3 14 8 Q21 3 28 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M22 14 Q28 10 34 14 Q40 10 46 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Slow Drifting Clouds */}
        <div className="absolute top-3 right-0 anim-cloud-slow opacity-60">
          <svg width="120" height="32" viewBox="0 0 120 32" fill="none">
            <path
              d="M10 24 Q18 8 36 12 Q48 2 64 8 Q78 0 94 10 Q112 14 116 24 Z"
              fill="rgba(255, 255, 255, 0.25)"
            />
          </svg>
        </div>
        <div className="absolute top-10 right-20 anim-cloud-fast opacity-40">
          <svg width="90" height="24" viewBox="0 0 90 24" fill="none">
            <path
              d="M8 18 Q14 6 28 9 Q38 1 50 6 Q62 0 74 8 Q86 11 88 18 Z"
              fill="rgba(255, 255, 255, 0.2)"
            />
          </svg>
        </div>

        {/* Distant Rolling Hills Silhouette */}
        <div className="absolute bottom-16 right-0 left-0 h-28 opacity-30">
          <svg viewBox="0 0 500 120" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0 80 Q100 40 220 70 T440 50 Q480 60 500 80 L500 120 L0 120 Z"
              fill="rgba(15, 23, 42, 0.85)"
            />
          </svg>
        </div>

        {/* Rapidly Zipping Trees / Poles along the Track */}
        <div className="absolute bottom-12 right-0 anim-tree-zip-1">
          <svg width="34" height="65" viewBox="0 0 34 65" fill="none">
            <line x1="17" y1="20" x2="17" y2="65" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
            <polygon points="17,5 6,24 28,24" fill="rgba(34, 197, 94, 0.55)" />
            <polygon points="17,16 9,32 25,32" fill="rgba(34, 197, 94, 0.45)" />
          </svg>
        </div>
        <div className="absolute bottom-12 right-12 anim-tree-zip-2">
          <svg width="28" height="58" viewBox="0 0 28 58" fill="none">
            <line x1="14" y1="18" x2="14" y2="58" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <polygon points="14,4 5,20 23,20" fill="rgba(16, 185, 129, 0.5)" />
          </svg>
        </div>

        {/* Moving Railway Track / Road Speed Stripes underneath */}
        <div className="absolute bottom-0 right-0 left-0 h-10 bg-gradient-to-t from-black/60 to-transparent">
          <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 400 30">
            {/* Rails */}
            <line x1="0" y1="14" x2="400" y2="14" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <line x1="0" y1="22" x2="400" y2="22" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            {/* Animated Sleepers */}
            <line
              x1="0"
              y1="18"
              x2="400"
              y2="18"
              stroke="rgba(251, 146, 60, 0.85)"
              strokeWidth="5"
              strokeDasharray="8 24"
              className="anim-track-scroll"
            />
          </svg>
        </div>

        {/* THE TRAVELING BOY ILLUSTRATION (Window Passenger Bobbing Motion) */}
        <div className="absolute right-6 sm:right-10 bottom-6 anim-traveler-sway">
          <svg width="190" height="210" viewBox="0 0 190 210" fill="none" className="drop-shadow-2xl">
            {/* Window Glass Glare Diagonal Highlights */}
            <rect x="10" y="8" width="170" height="185" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
            <line x1="28" y1="16" x2="72" y2="180" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
            <line x1="42" y1="16" x2="86" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" />

            {/* Travel Backpack on shoulders */}
            <path d="M42 120 Q32 140 45 185 Q75 190 90 175 Z" fill="#9a3412" stroke="#ea580c" strokeWidth="2" />
            <circle cx="56" cy="148" r="4" fill="#fbbf24" />

            {/* Boy Body: Denim / Royal Blue Travel Jacket */}
            <path
              d="M62 135 Q78 116 110 118 Q140 120 152 145 Q158 178 150 198 L60 198 Z"
              fill="#1e3a8a"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            {/* Jacket Collar & Zipper */}
            <path d="M96 130 L108 198" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3 3" />

            {/* Traveler's Cozy Crimson Scarf with Blowing Ends */}
            <path
              d="M84 122 Q105 136 128 124 Q135 138 118 142 Q96 142 84 122 Z"
              fill="#e11d48"
              stroke="#be123c"
              strokeWidth="2"
            />
            {/* Scarf Blowing Ends in the Breeze */}
            <g className="anim-scarf-breeze">
              <path
                d="M122 132 Q144 135 158 126 Q162 136 142 144 Q130 142 122 132 Z"
                fill="#f43f5e"
                stroke="#e11d48"
                strokeWidth="1.5"
              />
              <path
                d="M128 138 Q152 146 166 140 Q168 148 148 152 Q136 148 128 138 Z"
                fill="#fda4af"
              />
            </g>

            {/* Boy Neck */}
            <rect x="96" y="106" width="18" height="20" rx="4" fill="#fed7aa" />

            {/* Boy Head (Looking peaceful, gazing out the window) */}
            <ellipse cx="106" cy="85" rx="22" ry="24" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1.5" />

            {/* Boy's Warm Cheerful Expression */}
            {/* Ear */}
            <circle cx="85" cy="88" r="5.5" fill="#fecdd3" stroke="#f43f5e" strokeWidth="1" />
            {/* Eye (Smiling, focused on the horizon) */}
            <path d="M112 82 Q117 78 122 83" stroke="#1c1917" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="117" cy="84" r="1.5" fill="#1c1917" />
            {/* Cute Rosy Cheek */}
            <ellipse cx="118" cy="91" rx="5" ry="3" fill="rgba(244, 63, 94, 0.45)" />
            {/* Smile */}
            <path d="M112 96 Q118 102 124 96" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <path d="M123 87 Q126 90 123 92" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Wind-blown Hair Tuft */}
            <g className="anim-hair-breeze">
              <path
                d="M86 78 Q74 65 92 60 Q112 55 126 62 Q132 72 130 82 Q125 74 116 72 Q100 70 86 78 Z"
                fill="#451a03"
              />
            </g>

            {/* Traveler's Yellow / Amber Beanie Hat */}
            <path
              d="M84 72 Q104 46 128 66 Q134 78 128 84 Q106 72 84 72 Z"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="2"
            />
            {/* Beanie Pom-Pom at the Tip */}
            <circle cx="86" cy="62" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            {/* Beanie Ribbed Fold */}
            <path d="M88 74 Q106 68 126 78" stroke="#b45309" strokeWidth="2" fill="none" />

            {/* Boy's Hand Resting on Window Sill */}
            <path
              d="M136 168 Q150 162 165 174 Q162 186 142 186 Z"
              fill="#ffedd5"
              stroke="#fed7aa"
              strokeWidth="2"
            />

            {/* Train Window Ledge / Interior Armrest */}
            <rect x="2" y="186" width="186" height="18" rx="6" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle cx="168" cy="195" r="3" fill="#fbbf24" />
          </svg>
        </div>

      </div>

      {/* 3. FOREGROUND CONTENT: DYNAMIC TRAVEL QUOTES + PASS BINDING */}
      <div className="relative z-10 max-w-xl flex flex-col justify-between h-full">
        
        {/* Top Tag & Category Badge */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-amber-200 flex items-center gap-1.5 shadow-md">
              <span>{activeQuote.icon}</span>
              <span>{activeQuote.tag}</span>
            </span>

            <span className="text-[10px] font-semibold text-rose-200/90 hidden sm:inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
              <Compass className="w-3 h-3 text-amber-300" />
              <span>{activeQuote.locationMood}</span>
            </span>
          </div>

          {/* Changing Positive Quote & Thought */}
          <div
            className={`transition-all duration-300 transform ${
              fadeAnim ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {/* Main Inspiring Quote */}
            <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-lg leading-tight font-sans">
              &ldquo;{activeQuote.quote}&rdquo;
            </h3>

            {/* Soulful Thought */}
            <p className="text-xs sm:text-sm text-stone-100/95 max-w-md mt-2 drop-shadow-sm font-medium leading-relaxed">
              {activeQuote.thought}
            </p>
          </div>
        </div>

        {/* 4. BOTTOM ACTION & RECOMMENDATION ROW */}
        <div className="mt-6 pt-4 border-t border-white/15 relative z-10 flex flex-wrap items-center justify-between gap-3">
          
          {/* Action Button: Get the Pass */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (recommendedOption) {
                  onGetPass(recommendedOption);
                }
              }}
              className="px-5 py-2.5 rounded-full bg-[#881337] hover:bg-[#9f1239] text-white font-extrabold text-xs tracking-wide shadow-xl shadow-black/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-rose-400/30"
            >
              <Ticket className="w-3.5 h-3.5 text-rose-200" />
              <span>
                Get the pass &bull; ₹{recommendedOption?.quoted_price_inr ?? recommendedOption?.fare_inr ?? 15}
              </span>
            </button>

            {/* Eco Metric Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-rose-100 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              <span>{recommendedOption?.co2_emissions_g ?? 70}g CO₂</span>
            </div>
          </div>

          {/* Controls: Prev/Next Carousel arrows & 5s Timer indicator */}
          <div className="flex items-center gap-2 self-center">
            
            {/* Dots navigation */}
            <div className="hidden sm:flex items-center gap-1">
              {POSITIVE_TRAVEL_QUOTES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuoteIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    currentQuoteIndex === idx
                      ? "bg-amber-400 w-4 shadow-sm"
                      : "bg-white/30 hover:bg-white/60"
                  }`}
                  title={`Quote ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full p-0.5 border border-white/10">
              <button
                onClick={handlePrev}
                title="Previous Quote"
                className="p-1 rounded-full hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                title="Next Quote"
                className="p-1 rounded-full hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 5. SMOOTH 5-SECOND DURATION PROGRESS BAR (Bottom Border) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          key={currentQuoteIndex}
          className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-orange-400"
          style={{
            animation: isPaused ? "none" : "quoteProgressBar 5s linear forwards"
          }}
        />
      </div>
    </div>
  );
};
