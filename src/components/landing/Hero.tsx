import React, { useEffect, useRef } from 'react';
import { animateHeroReveal, animateFloatingBlobs } from '../../lib/gsap.ts';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LearningJourneyAnimation } from './LearningJourneyAnimation.tsx';

interface HeroProps {
  onExploreRoleCards: () => void;
  onActivateAccount: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreRoleCards, onActivateAccount }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      animateHeroReveal(heroRef.current);
    }
    if (blobsRef.current) {
      const blobElements = blobsRef.current.querySelectorAll('.floating-blob');
      animateFloatingBlobs(blobElements);
    }
  }, []);

  return (
    <section ref={heroRef} className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
      {/* Subtle Floating Gradient Blobs */}
      <div ref={blobsRef} className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="floating-blob absolute -top-16 left-1/4 w-80 h-80 rounded-full bg-[#DDD5F2]/40 blur-3xl" />
        <div className="floating-blob absolute top-32 right-12 w-96 h-96 rounded-full bg-[#F9DED0]/50 blur-3xl" />
        <div className="floating-blob absolute bottom-0 left-10 w-72 h-72 rounded-full bg-[#8FAF9A]/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Small Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF2ED] border border-[#8FAF9A]/40 text-[#527564] text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles className="w-4 h-4 text-[#8FAF9A]" />
              <span>Better Learning • Brighter Future</span>
            </div>

            {/* Main Heading */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#263238] leading-[1.12]">
              Your Learning Journey <br className="hidden sm:inline" />
              <span className="text-[#527564] relative inline-block">
                Starts Here
                <span className="absolute bottom-1.5 left-0 w-full h-2.5 bg-[#DDD5F2]/60 -z-10 rounded-sm" />
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="hero-subtitle text-lg sm:text-xl text-[#687477] max-w-2xl font-normal leading-relaxed">
              A simple and modern platform for students and teachers to learn, teach and achieve more — together.
            </p>

            {/* CTAs */}
            <div className="hero-cta flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreRoleCards}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-semibold text-base shadow-sm hover:shadow-md transition transform active:scale-98 cursor-pointer"
              >
                <span>Access Your Portal</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onActivateAccount}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F4EFE6] border border-[#DDD5F2] text-[#263238] font-semibold text-base transition cursor-pointer"
              >
                <span>Activate Student Account</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-[#DDD5F2]/40 grid grid-cols-3 gap-4 text-xs sm:text-sm text-[#687477]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A] shrink-0" />
                <span>Verified Admissions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A] shrink-0" />
                <span>Live Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A] shrink-0" />
                <span>Real-time Quizzes</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Animated Learning Journey */}
          <div className="lg:col-span-5 relative flex justify-center">
            <LearningJourneyAnimation className="hero-illustration" />
          </div>

        </div>
      </div>
    </section>
  );
};
