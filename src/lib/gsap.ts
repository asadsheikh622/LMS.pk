import { gsap } from 'gsap';

export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const animateFadeUp = (
  targets: gsap.DOMTarget,
  vars: gsap.TweenVars = {}
) => {
  if (isReducedMotion()) {
    return gsap.set(targets, { opacity: 1, y: 0 });
  }

  return gsap.fromTo(
    targets,
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.65,
      ease: 'power2.out',
      stagger: 0.08,
      ...vars,
    }
  );
};

export const animateHeroReveal = (container: HTMLElement | null) => {
  if (!container || isReducedMotion()) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.fromTo(
    container.querySelectorAll('.hero-badge'),
    { opacity: 0, scale: 0.94, y: 15 },
    { opacity: 1, scale: 1, y: 0, duration: 0.6 }
  )
    .fromTo(
      container.querySelectorAll('.hero-title'),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.3'
    )
    .fromTo(
      container.querySelectorAll('.hero-subtitle'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7 },
      '-=0.5'
    )
    .fromTo(
      container.querySelectorAll('.hero-cta'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
      '-=0.4'
    )
    .fromTo(
      container.querySelectorAll('.hero-illustration'),
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.9 },
      '-=0.5'
    );

  return tl;
};

export const animateFloatingBlobs = (targets: gsap.DOMTarget) => {
  if (isReducedMotion()) return;

  return gsap.to(targets, {
    y: '+=12',
    x: '+=6',
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
};

export { gsap };
