import React, { useState, useRef, useEffect, useId, forwardRef } from 'react';
import gsap from 'gsap';

export interface PasswordInputWithMonkeyProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  label?: string;
  leftIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  sizeVariant?: 'sm' | 'md' | 'lg';
  helperText?: string;
}

/**
 * MonkeyMascotSVG
 * High-craft vector mascot designed specifically for the Academy LMS palette:
 * - Warm Ivory (#FAF7F0)
 * - Soft Sage Green (#527564 / #8FAF9A)
 * - Soft Lavender (#DDD5F2 / #7B69B8)
 * - Soft Peach (#FBE8DE / #F9D9C8)
 * - Rich Charcoal (#263238)
 *
 * Provides smooth GSAP-animated transitions between:
 * - Hidden state: Hands covering eyes (🙈 pose, but refined vector mascot)
 * - Visible state: Hands lowered, eyes looking toward password field (👀)
 */
interface MonkeyMascotProps {
  showPassword: boolean;
  disabled?: boolean;
}

const MonkeyMascot: React.FC<MonkeyMascotProps> = ({ showPassword, disabled }) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const leftHandRef = useRef<SVGGElement>(null);
  const rightHandRef = useRef<SVGGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const mouthPathRef = useRef<SVGPathElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!containerRef.current || !leftHandRef.current || !rightHandRef.current) return;

    // Check accessibility preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const duration = prefersReducedMotion ? 0 : 0.28;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Setup initial state immediately without animation
      if (showPassword) {
        gsap.set(leftHandRef.current, { x: -16, y: 22, rotation: -26, transformOrigin: '24px 76px' });
        gsap.set(rightHandRef.current, { x: 16, y: 22, rotation: 26, transformOrigin: '76px 76px' });
        if (pupilsRef.current) gsap.set(pupilsRef.current, { x: -2.5 });
        if (mouthPathRef.current) mouthPathRef.current.setAttribute('d', 'M 44 60 Q 50 66 56 60');
      } else {
        gsap.set(leftHandRef.current, { x: 0, y: 0, rotation: 0, transformOrigin: '24px 76px' });
        gsap.set(rightHandRef.current, { x: 0, y: 0, rotation: 0, transformOrigin: '76px 76px' });
        if (pupilsRef.current) gsap.set(pupilsRef.current, { x: 0 });
        if (mouthPathRef.current) mouthPathRef.current.setAttribute('d', 'M 45 59 Q 50 63 55 59');
      }
      return;
    }

    // Interactive animation when toggled
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (showPassword) {
      // Uncover eyes: hands glide down smoothly to sides
      tl.to(
        leftHandRef.current,
        {
          x: -16,
          y: 22,
          rotation: -26,
          transformOrigin: '24px 76px',
          duration,
          ease: 'back.out(1.4)',
        },
        0
      )
        .to(
          rightHandRef.current,
          {
            x: 16,
            y: 22,
            rotation: 26,
            transformOrigin: '76px 76px',
            duration,
            ease: 'back.out(1.4)',
          },
          0
        )
        .to(
          pupilsRef.current,
          {
            x: -2.5,
            duration: duration * 0.9,
            ease: 'power1.out',
          },
          0.05
        )
        .fromTo(
          containerRef.current,
          { scale: 0.93 },
          { scale: 1, duration: duration * 1.1, ease: 'back.out(2)' },
          0
        );

      if (mouthPathRef.current) {
        mouthPathRef.current.setAttribute('d', 'M 44 60 Q 50 66 56 60');
      }
    } else {
      // Cover eyes: hands smoothly move up over eyes
      tl.to(
        leftHandRef.current,
        {
          x: 0,
          y: 0,
          rotation: 0,
          transformOrigin: '24px 76px',
          duration: duration * 0.95,
          ease: 'power2.inOut',
        },
        0
      )
        .to(
          rightHandRef.current,
          {
            x: 0,
            y: 0,
            rotation: 0,
            transformOrigin: '76px 76px',
            duration: duration * 0.95,
            ease: 'power2.inOut',
          },
          0
        )
        .to(
          pupilsRef.current,
          {
            x: 0,
            duration: duration * 0.8,
            ease: 'power2.out',
          },
          0
        )
        .fromTo(
          containerRef.current,
          { y: -1.5 },
          { y: 0, duration: duration * 0.8, ease: 'power2.out' },
          0
        );

      if (mouthPathRef.current) {
        mouthPathRef.current.setAttribute('d', 'M 45 59 Q 50 63 55 59');
      }
    }
  }, [showPassword]);

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 100 100"
      className="w-full h-full select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Soft mascot gradients for premium depth */}
        <radialGradient id="monkey-fur" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7B5B49" />
          <stop offset="100%" stopColor="#5E4334" />
        </radialGradient>
        <radialGradient id="monkey-face" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFF2E8" />
          <stop offset="100%" stopColor="#F7DFD0" />
        </radialGradient>
        <linearGradient id="academy-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5D8270" />
          <stop offset="100%" stopColor="#436152" />
        </linearGradient>
      </defs>

      {/* 1. Base / Academy Sage Green Sweater */}
      <path
        d="M 18 100 C 20 78, 30 73, 44 73 L 56 73 C 70 73, 80 78, 82 100 Z"
        fill="url(#academy-jacket)"
      />
      {/* Academy Collar */}
      <path d="M 42 73 L 50 83 L 58 73 Z" fill="#FAF7F0" />
      {/* Tiny Lavender Academy Tie Accent */}
      <path d="M 48.5 81 L 51.5 81 L 51 90 L 49 90 Z" fill="#7B69B8" />

      {/* 2. Ears */}
      {/* Left Outer Ear */}
      <circle cx="21" cy="45" r="11.5" fill="url(#monkey-fur)" />
      {/* Left Inner Ear */}
      <circle cx="21" cy="45" r="7" fill="#F8D4C0" />

      {/* Right Outer Ear */}
      <circle cx="79" cy="45" r="11.5" fill="url(#monkey-fur)" />
      {/* Right Inner Ear */}
      <circle cx="79" cy="45" r="7" fill="#F8D4C0" />

      {/* 3. Head Shape */}
      <circle cx="50" cy="47" r="27.5" fill="url(#monkey-fur)" />

      {/* Cute Head Tuft */}
      <path
        d="M 48 20 C 47 16, 50 14, 52 14 C 52 16, 51 18, 50 20 Z"
        fill="#5E4334"
      />
      <path
        d="M 50 20 C 51 15, 54 15, 55 16 C 54 18, 52 19, 51 20 Z"
        fill="#7B5B49"
      />

      {/* 4. Face Mask (Heart/Pear Shape) */}
      <g>
        {/* Upper lobes */}
        <circle cx="41.5" cy="43.5" r="13" fill="url(#monkey-face)" />
        <circle cx="58.5" cy="43.5" r="13" fill="url(#monkey-face)" />
        {/* Lower cheeks & chin */}
        <ellipse cx="50" cy="54.5" rx="18.5" ry="13.5" fill="url(#monkey-face)" />
      </g>

      {/* Soft Rosy Cheeks */}
      <circle cx="33" cy="52.5" r="4.2" fill="#F5B2A3" opacity="0.65" />
      <circle cx="67" cy="52.5" r="4.2" fill="#F5B2A3" opacity="0.65" />

      {/* 5. Eyes */}
      <g id="eyes-group">
        {/* Left Eye Socket */}
        <ellipse cx="41.5" cy="43.5" rx="4.8" ry="5.5" fill="#FFFFFF" />
        {/* Right Eye Socket */}
        <ellipse cx="58.5" cy="43.5" rx="4.8" ry="5.5" fill="#FFFFFF" />

        {/* Pupils (animated to gaze toward password field on reveal) */}
        <g ref={pupilsRef}>
          {/* Left Pupil */}
          <circle cx="41.5" cy="43.5" r="2.8" fill="#263238" />
          <circle cx="40.3" cy="42" r="1.1" fill="#FFFFFF" />

          {/* Right Pupil */}
          <circle cx="58.5" cy="43.5" r="2.8" fill="#263238" />
          <circle cx="57.3" cy="42" r="1.1" fill="#FFFFFF" />
        </g>
      </g>

      {/* 6. Nose & Mouth */}
      {/* Nose */}
      <ellipse cx="50" cy="53" rx="3.3" ry="2.2" fill="#38251B" />
      {/* Friendly Mouth */}
      <path
        ref={mouthPathRef}
        d="M 45 59 Q 50 63 55 59"
        stroke="#38251B"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* 7. Hands / Arms (GSAP Animated) */}
      {/* Left Hand / Arm */}
      <g ref={leftHandRef} id="left-arm-group">
        {/* Forearm */}
        <path
          d="M 23 75 C 22 64, 30 52, 38 46"
          stroke="url(#monkey-fur)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Paw covering eye */}
        <ellipse
          cx="39.5"
          cy="44"
          rx="9"
          ry="7.5"
          transform="rotate(12 39.5 44)"
          fill="#5E4334"
        />
        {/* Paw Pad / Fingers */}
        <ellipse
          cx="40"
          cy="44"
          rx="6.5"
          ry="5"
          transform="rotate(12 40 44)"
          fill="#F8D4C0"
        />
        {/* Finger lines */}
        <path
          d="M 37 41 L 38 47 M 40 40 L 41 47 M 43 41 L 43 47"
          stroke="#5E4334"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* Right Hand / Arm */}
      <g ref={rightHandRef} id="right-arm-group">
        {/* Forearm */}
        <path
          d="M 77 75 C 78 64, 70 52, 62 46"
          stroke="url(#monkey-fur)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Paw covering eye */}
        <ellipse
          cx="60.5"
          cy="44"
          rx="9"
          ry="7.5"
          transform="rotate(-12 60.5 44)"
          fill="#5E4334"
        />
        {/* Paw Pad / Fingers */}
        <ellipse
          cx="60"
          cy="44"
          rx="6.5"
          ry="5"
          transform="rotate(-12 60 44)"
          fill="#F8D4C0"
        />
        {/* Finger lines */}
        <path
          d="M 57 41 L 57 47 M 60 40 L 59 47 M 63 41 L 62 47"
          stroke="#5E4334"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
};

export const PasswordInputWithMonkey = forwardRef<HTMLInputElement, PasswordInputWithMonkeyProps>(
  (
    {
      value,
      onChange,
      placeholder = '••••••••',
      name,
      id,
      disabled = false,
      required = false,
      error = null,
      label,
      leftIcon,
      className = '',
      inputClassName = '',
      sizeVariant = 'md',
      helperText,
      autoComplete = 'current-password',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      if (disabled) return;
      setShowPassword((prev) => !prev);
    };

    // Sizing tokens
    const heightClasses = {
      sm: 'py-2 pl-9 pr-11 text-xs',
      md: 'py-3 pl-10 pr-12 text-sm',
      lg: 'py-3.5 pl-11 pr-14 text-base',
    }[sizeVariant];

    const mascotDimensions = {
      sm: 'w-7 h-7',
      md: 'w-8 h-8',
      lg: 'w-9 h-9',
    }[sizeVariant];

    const mascotPadding = {
      sm: 'right-1.5',
      md: 'right-2',
      lg: 'right-2.5',
    }[sizeVariant];

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold uppercase tracking-wider text-[#687477]"
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          </div>
        )}

        <div className="relative flex items-center">
          <input
            {...rest}
            ref={ref}
            id={inputId}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full rounded-xl bg-[#FAF7F0] border transition duration-150 text-[#263238] placeholder-gray-400 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${heightClasses} ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
                : 'border-[#DDD5F2] focus:border-[#527564] focus:ring-[#527564]'
            } ${inputClassName}`}
          />

          {/* Left Icon (e.g. Lock) */}
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#687477]">
              {leftIcon}
            </div>
          )}

          {/* Monkey Mascot Toggle Button */}
          <div className={`absolute ${mascotPadding} top-1/2 -translate-y-1/2 flex items-center`}>
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={disabled}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className={`group relative p-1 rounded-lg transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#527564] focus-visible:ring-offset-1 select-none ${
                showPassword ? 'bg-[#FAF7F0]/80' : 'hover:bg-[#FAF7F0]/60'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
            >
              <div className={`${mascotDimensions} relative flex items-center justify-center`}>
                <MonkeyMascot showPassword={showPassword} disabled={disabled} />
              </div>

              {/* Accessible Tooltip Indicator on hover */}
              <span
                role="tooltip"
                className="pointer-events-none absolute -bottom-7 right-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 bg-[#263238] text-white text-[10px] font-medium py-0.5 px-1.5 rounded shadow-sm whitespace-nowrap z-20"
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600 font-medium">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-[#687477]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PasswordInputWithMonkey.displayName = 'PasswordInputWithMonkey';
export default PasswordInputWithMonkey;
