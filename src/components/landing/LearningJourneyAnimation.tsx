import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookMarked, Brain, Check, Code2, Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface LearningJourneyAnimationProps {
  className?: string;
}

export const LearningJourneyAnimation: React.FC<LearningJourneyAnimationProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Element refs for GSAP orchestration
  const bookRef = useRef<SVGSVGElement>(null);
  const bookGroupRef = useRef<SVGGElement>(null);
  const leftPageRef = useRef<SVGGElement>(null);
  const rightPageRef = useRef<SVGGElement>(null);
  const ribbonRef = useRef<SVGPathElement>(null);
  
  // Floating element refs
  const capRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLDivElement>(null);
  const pencilRef = useRef<HTMLDivElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  
  // Blobs
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  
  // Progress counter state and ring ref
  const [progressValue, setProgressValue] = useState<number>(0);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  
  // Mouse parallax refs
  const parallaxElements = useRef<{
    book: SVGSVGElement | null;
    cap: HTMLDivElement | null;
    chart: HTMLDivElement | null;
    code: HTMLDivElement | null;
    check: HTMLDivElement | null;
    quiz: HTMLDivElement | null;
    pencil: HTMLDivElement | null;
    blob1: HTMLDivElement | null;
    blob2: HTMLDivElement | null;
  }>({
    book: null,
    cap: null,
    chart: null,
    code: null,
    check: null,
    quiz: null,
    pencil: null,
    blob1: null,
    blob2: null,
  });

  useEffect(() => {
    // Populate parallax refs
    parallaxElements.current = {
      book: bookRef.current,
      cap: capRef.current,
      chart: chartRef.current,
      code: codeRef.current,
      check: checkRef.current,
      quiz: quizRef.current,
      pencil: pencilRef.current,
      blob1: blob1Ref.current,
      blob2: blob2Ref.current,
    };

    const isReduced = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (isReduced) {
        // Fallback for reduced motion: show everything instantly at rest
        setProgressValue(73);
        if (progressCircleRef.current) {
          const circumference = 2 * Math.PI * 18;
          progressCircleRef.current.style.strokeDashoffset = `${circumference * (1 - 0.73)}`;
        }
        return;
      }

      // Initial state setup before entrance timeline runs
      gsap.set(bookRef.current, { opacity: 0, scale: 0.92, transformOrigin: 'center center' });
      gsap.set(capRef.current, { opacity: 0, y: 18, scale: 0.85 });
      gsap.set(chartRef.current, { opacity: 0, x: -16, scale: 0.85 });
      gsap.set('.chart-bar', { scaleY: 0, transformOrigin: 'bottom' });
      gsap.set(codeRef.current, { opacity: 0, x: 16, scale: 0.85 });
      gsap.set(checkRef.current, { opacity: 0, y: 16, scale: 0.75 });
      gsap.set(pencilRef.current, { opacity: 0, x: -20, y: -10, rotate: -25 });
      gsap.set(quizRef.current, { opacity: 0, y: -14, scale: 0.85 });
      gsap.set('.orbit-label', { opacity: 0 });

      // Circular progress bar circumference
      const circumference = 2 * Math.PI * 18;
      if (progressCircleRef.current) {
        progressCircleRef.current.style.strokeDasharray = `${circumference}`;
        progressCircleRef.current.style.strokeDashoffset = `${circumference}`;
      }

      // Master Entrance Timeline
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power3.out' },
      });

      // STEP 1: Book fades in and scales from ~0.92 to 1
      masterTl.to(bookRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.75,
        ease: 'power2.out',
      });

      // STEP 2: Book gently opens / tilts into final position with page reveal
      masterTl.fromTo(
        [leftPageRef.current, rightPageRef.current],
        { scaleY: 0.94, opacity: 0.8 },
        { scaleY: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' },
        '-=0.2'
      );

      // STEP 3: Graduation cap appears with subtle upward movement
      masterTl.to(
        capRef.current,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: 'back.out(1.6)',
        },
        '-=0.25'
      );

      // STEP 4: Progress chart appears and its bars animate upward
      masterTl.to(
        chartRef.current,
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4'
      );
      masterTl.to(
        '.chart-bar',
        {
          scaleY: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power2.out',
        },
        '-=0.3'
      );

      // STEP 5: Coding </> element and Quiz element fade in
      masterTl.to(
        [codeRef.current, quizRef.current],
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'back.out(1.5)',
        },
        '-=0.35'
      );

      // STEP 6: Assignment check mark appears with subtle bounce
      masterTl.to(
        checkRef.current,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: 'back.out(2)',
        },
        '-=0.3'
      );

      // STEP 7: Pencil gently moves across the book in writing gesture
      masterTl.to(
        pencilRef.current,
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          duration: 0.75,
          ease: 'power2.out',
        },
        '-=0.35'
      );
      // Small writing trace movement
      masterTl.to(
        pencilRef.current,
        {
          x: 8,
          y: 3,
          duration: 0.45,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        },
        '-=0.1'
      );

      // Floating Labels gentle fade-in
      masterTl.to(
        '.orbit-label',
        {
          opacity: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power1.out',
        },
        '-=0.4'
      );

      // STEP 8: 73% Progress indicator counter & ring animation
      const progressObj = { value: 0 };
      masterTl.to(
        progressObj,
        {
          value: 73,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => {
            const currentVal = Math.round(progressObj.value);
            setProgressValue(currentVal);
            if (progressCircleRef.current) {
              const offset = circumference * (1 - currentVal / 100);
              progressCircleRef.current.style.strokeDashoffset = `${offset}`;
            }
          },
        },
        '-=0.6'
      );

      // CONTINUOUS ORGANIC ANIMATIONS (after entrance finishes)
      masterTl.call(() => {
        // Book subtle breathing motion (4.5s)
        gsap.to(bookGroupRef.current, {
          y: -4,
          duration: 4.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // Graduation cap vertical floating (3.8s)
        gsap.to(capRef.current, {
          y: -7,
          rotate: 1.5,
          duration: 3.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.3,
        });

        // Progress chart subtle movement (5.0s)
        gsap.to(chartRef.current, {
          y: -5,
          x: -2,
          duration: 5.0,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.6,
        });

        // Coding icon tiny floating movement (4.2s)
        gsap.to(codeRef.current, {
          y: -6,
          x: 2,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.8,
        });

        // Assignment check subtle pulse (3.5s)
        gsap.to(checkRef.current, {
          scale: 1.05,
          y: -3,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.2,
        });

        // Pencil occasional small writing gesture (4.0s)
        gsap.to(pencilRef.current, {
          x: 4,
          y: -4,
          rotate: -2,
          duration: 4.0,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.0,
        });

        // Quiz element gentle floating (4.6s)
        gsap.to(quizRef.current, {
          y: -5,
          rotate: -1,
          duration: 4.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.5,
        });

        // Background blobs breathing
        if (blob1Ref.current && blob2Ref.current && blob3Ref.current) {
          gsap.to(blob1Ref.current, {
            scale: 1.1,
            x: 8,
            y: -6,
            duration: 5.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
          gsap.to(blob2Ref.current, {
            scale: 1.12,
            x: -10,
            y: 8,
            duration: 6.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.0,
          });
          gsap.to(blob3Ref.current, {
            scale: 1.08,
            x: 6,
            y: 6,
            duration: 5.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.5,
          });
        }
      });
    }, cardRef);

    return () => {
      ctx.revert();
    };
  }, []);

  // Smooth Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Normalized coordinates (-1 to 1) from card center
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const { book, cap, chart, code, check, quiz, pencil, blob1, blob2 } = parallaxElements.current;

    // Subtle 5px - 15px max movement
    if (book) gsap.to(book, { x: x * 6, y: y * 5, duration: 0.6, ease: 'power2.out' });
    if (cap) gsap.to(cap, { x: -x * 12, y: -y * 10, duration: 0.7, ease: 'power2.out' });
    if (chart) gsap.to(chart, { x: -x * 10, y: y * 8, duration: 0.7, ease: 'power2.out' });
    if (code) gsap.to(code, { x: x * 11, y: -y * 9, duration: 0.7, ease: 'power2.out' });
    if (check) gsap.to(check, { x: -x * 8, y: -y * 8, duration: 0.75, ease: 'power2.out' });
    if (quiz) gsap.to(quiz, { x: x * 10, y: -y * 10, duration: 0.7, ease: 'power2.out' });
    if (pencil) gsap.to(pencil, { x: x * 7, y: y * 6, duration: 0.65, ease: 'power2.out' });
    if (blob1) gsap.to(blob1, { x: x * 14, y: y * 12, duration: 0.9, ease: 'power2.out' });
    if (blob2) gsap.to(blob2, { x: -x * 12, y: -y * 10, duration: 0.9, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    const { book, cap, chart, code, check, quiz, pencil, blob1, blob2 } = parallaxElements.current;
    const targets = [book, cap, chart, code, check, quiz, pencil, blob1, blob2].filter(Boolean);
    gsap.to(targets, {
      x: 0,
      y: 0,
      duration: 0.85,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-md aspect-square select-none ${className}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="Interactive Learning Journey Visualization"
        className="relative w-full h-full rounded-3xl bg-gradient-to-br from-white/95 via-[#FDFBF7]/95 to-[#FAF7F0] border border-[#DDD5F2]/60 p-5 sm:p-6 shadow-sm flex flex-col justify-between overflow-hidden"
      >
        {/* Subtle Decorative Background Gradient Blobs (Sage, Lavender, Peach) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div
            ref={blob1Ref}
            className="absolute -top-12 -left-8 w-44 h-44 rounded-full bg-[#8FAF9A]/20 blur-2xl"
          />
          <div
            ref={blob2Ref}
            className="absolute top-1/4 -right-10 w-48 h-48 rounded-full bg-[#DDD5F2]/30 blur-2xl"
          />
          <div
            ref={blob3Ref}
            className="absolute -bottom-8 left-1/3 w-40 h-40 rounded-full bg-[#F9DED0]/35 blur-2xl"
          />
        </div>

        {/* Top Badges (Preserved & refined spacing) */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EBF2ED] border border-[#8FAF9A]/40 text-[#527564] text-xs font-semibold shadow-2xs transition-colors hover:border-[#8FAF9A]">
            <BookMarked className="w-3.5 h-3.5 text-[#527564]" />
            <span>Curriculum v4.2</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F1FB] border border-[#DDD5F2] text-[#A99AD9] text-xs font-semibold shadow-2xs">
            <Brain className="w-3.5 h-3.5 text-[#A99AD9]" />
            <span>Interactive LMS</span>
          </div>
        </div>

        {/* Central Educational Composition (Open 3D Book & Orbiting Elements) */}
        <div className="relative z-10 my-auto py-2 flex items-center justify-center min-h-[220px]">
          
          {/* ORBIT ELEMENT 1: Graduation Cap (Top-Center / Achievement) */}
          <div
            ref={capRef}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 flex flex-col items-center z-20 pointer-events-none"
          >
            <div className="p-2 rounded-2xl bg-white/95 border border-[#F3BFA5]/60 shadow-xs flex items-center justify-center">
              <svg
                width="28"
                height="24"
                viewBox="0 0 32 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="transform -rotate-6"
              >
                {/* Mortarboard Cap */}
                <path
                  d="M16 2L30 8L16 14L2 8L16 2Z"
                  fill="#527564"
                />
                <path
                  d="M16 3.5L27 8L16 12.5L5 8L16 3.5Z"
                  fill="#8FAF9A"
                />
                <path
                  d="M7 11V18C7 21 11 23 16 23C21 23 25 21 25 18V11"
                  stroke="#527564"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Tassel */}
                <path
                  d="M26 8.5V17"
                  stroke="#F3BFA5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="26" cy="18" r="1.8" fill="#F3BFA5" />
              </svg>
            </div>
            <span className="orbit-label mt-1 text-[9px] font-semibold text-[#527564] bg-white/90 px-2 py-0.5 rounded-full border border-[#8FAF9A]/30 shadow-2xs">
              Achievement
            </span>
          </div>

          {/* ORBIT ELEMENT 2: Progress Chart (Upper-Left / Progress) */}
          <div
            ref={chartRef}
            className="absolute top-3 left-2 sm:left-4 flex flex-col items-start z-20 pointer-events-none"
          >
            <div className="p-2.5 rounded-2xl bg-white/95 border border-[#DDD5F2] shadow-xs flex items-end gap-1.5 h-12 w-14 justify-center">
              <div className="chart-bar w-1.5 h-5 bg-[#8FAF9A] rounded-t-sm" />
              <div className="chart-bar w-1.5 h-8 bg-[#527564] rounded-t-sm" />
              <div className="chart-bar w-1.5 h-6 bg-[#A99AD9] rounded-t-sm" />
              <div className="chart-bar w-1.5 h-9 bg-[#F3BFA5] rounded-t-sm" />
            </div>
            <span className="orbit-label mt-1 text-[9px] font-semibold text-[#687477] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#DDD5F2]/60 shadow-2xs">
              Progress
            </span>
          </div>

          {/* ORBIT ELEMENT 3: Quiz / Question Element (Upper-Right / Quiz) */}
          <div
            ref={quizRef}
            className="absolute top-2 right-2 sm:right-4 flex flex-col items-end z-20 pointer-events-none"
          >
            <div className="p-2 rounded-2xl bg-white/95 border border-[#DDD5F2] shadow-xs flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-[#DDD5F2]/50 flex items-center justify-center text-[#A99AD9] font-bold text-xs">
                ?
              </div>
              <div className="space-y-1">
                <div className="w-6 h-1 bg-[#8FAF9A] rounded-full" />
                <div className="w-4 h-1 bg-[#A99AD9] rounded-full" />
              </div>
            </div>
            <span className="orbit-label mt-1 text-[9px] font-semibold text-[#A99AD9] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#DDD5F2] shadow-2xs">
              Quiz
            </span>
          </div>

          {/* ORBIT ELEMENT 4: Coding </> Element (Mid-Right / Technology) */}
          <div
            ref={codeRef}
            className="absolute top-1/2 -translate-y-1/2 right-1 sm:right-2 flex flex-col items-center z-20 pointer-events-none"
          >
            <div className="p-2.5 rounded-2xl bg-[#263238] border border-[#DDD5F2]/40 shadow-xs flex items-center justify-center">
              <Code2 className="w-4 h-4 text-[#8FAF9A]" />
            </div>
            <span className="orbit-label mt-1 text-[9px] font-mono font-medium text-[#263238] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#DDD5F2]/60 shadow-2xs">
              Course
            </span>
          </div>

          {/* ORBIT ELEMENT 5: Assignment Check Mark (Lower-Left / Assignment) */}
          <div
            ref={checkRef}
            className="absolute bottom-1 left-3 sm:left-6 flex flex-col items-start z-20 pointer-events-none"
          >
            <div className="px-2.5 py-1.5 rounded-xl bg-white/95 border border-[#F3BFA5]/70 shadow-xs flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#527564] flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="text-[10px] font-bold text-[#263238]">Assignment</span>
            </div>
          </div>

          {/* ORBIT ELEMENT 6: Pencil (Writing across the book) */}
          <div
            ref={pencilRef}
            className="absolute bottom-6 right-8 sm:right-12 z-30 pointer-events-none"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="drop-shadow-sm"
            >
              {/* Pencil Body with eraser, ferrule, wood body, and graphite tip */}
              <g transform="rotate(-35 18 18)">
                {/* Eraser */}
                <rect x="14" y="2" width="8" height="6" rx="2" fill="#F3BFA5" />
                {/* Ferrule band */}
                <rect x="14" y="8" width="8" height="3" fill="#DDD5F2" />
                {/* Wooden body */}
                <rect x="14" y="11" width="8" height="15" fill="#8FAF9A" />
                {/* Wooden stripe */}
                <line x1="18" y1="11" x2="18" y2="26" stroke="#527564" strokeWidth="1" />
                {/* Wood cone tip */}
                <polygon points="14,26 22,26 18,32" fill="#FAF7F0" />
                {/* Graphite lead */}
                <polygon points="16.5,29.8 19.5,29.8 18,33" fill="#263238" />
              </g>
            </svg>
          </div>

          {/* CENTER OBJECT: Layered 3D-Style Open Learning Book */}
          <svg
            ref={bookRef}
            width="230"
            height="150"
            viewBox="0 0 230 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="w-48 sm:w-56 h-auto drop-shadow-md z-10"
          >
            <defs>
              <linearGradient id="bookCoverGrad" x1="15" y1="30" x2="215" y2="135" gradientUnits="userSpaceOnUse">
                <stop stopColor="#527564" />
                <stop offset="1" stopColor="#3F5A4D" />
              </linearGradient>

              <linearGradient id="leftPageGrad" x1="25" y1="35" x2="110" y2="115" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.85" stopColor="#FAF7F0" />
                <stop offset="1" stopColor="#E6E0D4" />
              </linearGradient>

              <linearGradient id="rightPageGrad" x1="120" y1="35" x2="205" y2="115" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#E6E0D4" />
                <stop offset="0.15" stopColor="#FAF7F0" />
                <stop offset="1" stopColor="#FFFFFF" />
              </linearGradient>

              <filter id="pageShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#263238" floodOpacity="0.12" />
              </filter>
            </defs>

            <g ref={bookGroupRef}>
              {/* Hardcover Back Rim & Spine (Deep Sage) */}
              <path
                d="M18 42C18 42 60 34 115 42C170 34 212 42 212 42V122C212 122 170 114 115 122C60 114 18 122 18 122V42Z"
                fill="url(#bookCoverGrad)"
              />
              
              {/* Hardcover Bottom Rim Thickness */}
              <path
                d="M18 122C60 114 115 122 115 122C115 122 170 114 212 122V127C212 127 170 119 115 127C60 119 18 127 18 127V122Z"
                fill="#2E4338"
              />

              {/* Stacked Pages Thickness Base */}
              <path
                d="M22 118C62 112 114 118 114 118C114 118 166 112 208 118V122C166 116 114 122 114 122C114 122 62 116 22 122V118Z"
                fill="#DDD5F2"
                opacity="0.8"
              />
              <path
                d="M23 115C63 110 114 116 114 116C114 116 165 110 207 115V118C165 113 114 119 114 119C114 119 63 113 23 118V115Z"
                fill="#FAF7F0"
              />

              {/* LEFT PAGE LEAF */}
              <g ref={leftPageRef}>
                <path
                  d="M24 38C62 30 114 38 114 38V115C114 115 62 107 24 115V38Z"
                  fill="url(#leftPageGrad)"
                  filter="url(#pageShadow)"
                />

                {/* Left Page Educational Content Lines */}
                <line x1="36" y1="52" x2="88" y2="47" stroke="#8FAF9A" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="36" y1="62" x2="98" y2="58" stroke="#DDD5F2" strokeWidth="2" strokeLinecap="round" />
                <line x1="36" y1="71" x2="78" y2="67" stroke="#DDD5F2" strokeWidth="2" strokeLinecap="round" />
                <line x1="36" y1="80" x2="94" y2="76" stroke="#DDD5F2" strokeWidth="2" strokeLinecap="round" />
                
                {/* Small Interactive Topic Tag */}
                <rect x="36" y="89" width="38" height="12" rx="3" fill="#EBF2ED" />
                <text x="41" y="98" fill="#527564" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                  MODULE 1
                </text>
              </g>

              {/* RIGHT PAGE LEAF */}
              <g ref={rightPageRef}>
                <path
                  d="M116 38C116 38 168 30 206 38V115C168 107 116 115 116 115V38Z"
                  fill="url(#rightPageGrad)"
                  filter="url(#pageShadow)"
                />

                {/* Right Page Educational / Code Content */}
                <line x1="128" y1="48" x2="186" y2="52" stroke="#527564" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="128" y1="58" x2="168" y2="62" stroke="#A99AD9" strokeWidth="2" strokeLinecap="round" />
                <line x1="128" y1="67" x2="192" y2="71" stroke="#DDD5F2" strokeWidth="2" strokeLinecap="round" />

                {/* Visual code block snippet */}
                <rect x="128" y="76" width="64" height="25" rx="4" fill="#263238" />
                <text x="134" y="86" fill="#8FAF9A" fontSize="6.5" fontFamily="monospace">
                  def learn():
                </text>
                <text x="140" y="94" fill="#F3BFA5" fontSize="6.5" fontFamily="monospace">
                  return progress
                </text>
              </g>

              {/* Central Spine Valley Shadow */}
              <path
                d="M113 36C114 36 116 36 117 36V117C116 117 114 117 113 117V36Z"
                fill="#263238"
                opacity="0.18"
              />

              {/* Peach Bookmark Ribbon draping through spine */}
              <path
                ref={ribbonRef}
                d="M113 36V130L115 125L117 130V36H113Z"
                fill="#F3BFA5"
              />
            </g>
          </svg>
        </div>

        {/* Bottom Stat Card with Animated 73% Progress Ring */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-[#FAF7F0]/90 backdrop-blur-xs border border-[#DDD5F2] flex items-center justify-between text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#527564] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              20
            </div>
            <div>
              <div className="text-xs font-bold text-[#263238]">Batch 20 • Active Cohort</div>
              <div className="text-[11px] text-[#687477]">Zaitoon Ashraf IT Park</div>
            </div>
          </div>

          {/* Animated 73% Progress Indicator */}
          <div className="flex items-center gap-2.5">
            {/* Circular Progress Gauge */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 -rotate-90 transform" viewBox="0 0 42 42">
                <circle
                  cx="21"
                  cy="21"
                  r="18"
                  className="stroke-[#DDD5F2]"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  ref={progressCircleRef}
                  cx="21"
                  cy="21"
                  r="18"
                  className="stroke-[#527564] transition-all duration-75"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-[#527564]" />
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-[#527564] tabular-nums">
                {progressValue}% Completed
              </div>
              <div className="text-[10px] text-[#687477]">Attendance 98%</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
