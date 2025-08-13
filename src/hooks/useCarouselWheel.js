import { useEffect, useRef } from 'react';

/**
 * Carousel wheel control that treats any wheel direction as navigation intent
 * - Consumes wheel events over the carousel area
 * - Steps once per gesture in either axis
 * - Prevents momentum double-triggers via cooldown
 * 
 * @param {Object} options
 * @param {React.RefObject} options.viewportRef - Element that defines carousel area
 * @param {Function} options.onNext - Advance to next slide
 * @param {Function} options.onPrev - Go to previous slide
 * @param {boolean} options.enabled - Whether handling is active
 * @param {number} options.thresholdPx - Delta required to trigger (default: 260)
 * @param {number} options.cooldownMs - Ignore events after step (default: 700)
 * @param {boolean} options.requireFullyInView - Only react when fully visible (default: true)
 */
export default function useCarouselWheel({
  viewportRef,
  onNext,
  onPrev,
  enabled = true,
  thresholdPx = 260,
  cooldownMs = 700,
  requireFullyInView = true,
}) {
  const accRef = useRef(0);
  const lastDirRef = useRef(0);
  const lockUntilRef = useRef(0);

  // Normalize delta values across different modes
  const normalize = (e) => {
    let dx = e.deltaX;
    let dy = e.deltaY;
    
    if (e.deltaMode === 1) {
      // Line mode
      dx *= 16;
      dy *= 16;
    } else if (e.deltaMode === 2) {
      // Page mode
      dx *= window.innerHeight;
      dy *= window.innerHeight;
    }
    
    return { dx, dy };
  };

  // Check if event target is within our element
  const inPath = (e, el) => {
    if (!el) return false;
    // Use composedPath if available (handles shadow DOM)
    if (e.composedPath) {
      return e.composedPath().includes(el);
    }
    // Fallback to contains check
    return el.contains(e.target);
  };

  // Check if element is fully in viewport
  const fullyInView = (el) => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= 0 && rect.bottom <= vh;
  };

  useEffect(() => {
    const el = viewportRef?.current;
    if (!enabled || !el) return;

    const onWheel = (e) => {
      // Only handle events over our carousel
      if (!inPath(e, el)) return;
      
      // Optional: require carousel to be fully visible
      if (requireFullyInView && !fullyInView(el)) return;

      // We intentionally consume ALL wheel events over carousel
      // This prevents page scroll and gives us full control
      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      
      // Respect cooldown to prevent momentum triggers
      if (now < lockUntilRef.current) return;

      const { dx, dy } = normalize(e);
      
      // Determine primary axis (whichever has greater movement)
      const useX = Math.abs(dx) >= Math.abs(dy);
      const primary = useX ? dx : dy;
      const dir = Math.sign(primary) || 0;

      // Reset accumulator if direction changes
      if (dir && dir !== lastDirRef.current) {
        accRef.current = 0;
      }
      lastDirRef.current = dir;

      // Accumulate movement
      accRef.current += primary;

      // Check threshold and trigger navigation
      if (Math.abs(accRef.current) >= thresholdPx) {
        if (accRef.current > 0) {
          // Positive: right/down → next
          onNext?.();
        } else {
          // Negative: left/up → previous
          onPrev?.();
        }
        
        // Reset for next gesture
        accRef.current = 0;
        lockUntilRef.current = now + cooldownMs;
      }
    };

    // Listen globally but only react to events over our element
    // Must use passive: false to allow preventDefault
    window.addEventListener('wheel', onWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [viewportRef, onNext, onPrev, enabled, thresholdPx, cooldownMs, requireFullyInView]);
}