import { useEffect, useRef } from 'react';

/**
 * Carousel swipe control for touch/pointer gestures in any direction
 * - Locks to primary axis after intent threshold
 * - Steps once per gesture with cooldown
 * - Prevents default to control both axes
 * 
 * @param {Object} options
 * @param {React.RefObject} options.viewportRef - Container element for swipe detection
 * @param {Function} options.onNext - Advance to next slide
 * @param {Function} options.onPrev - Go to previous slide
 * @param {boolean} options.enabled - Whether handling is active
 * @param {number} options.thresholdPxTouch - Movement required to trigger (default: 80)
 * @param {number} options.intentPx - Movement to lock axis (default: 8)
 * @param {number} options.cooldownMs - Ignore gestures after step (default: 500)
 */
export default function useCarouselSwipe({
  viewportRef,
  onNext,
  onPrev,
  enabled = true,
  thresholdPxTouch = 80,
  intentPx = 8,
  cooldownMs = 500,
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef(null); // 'x' | 'y' | null
  const lockUntil = useRef(0);
  const hasTriggered = useRef(false);

  const now = () => performance.now();

  useEffect(() => {
    const el = viewportRef?.current;
    if (!enabled || !el) return;

    const handlePointerDown = (e) => {
      // Skip if in cooldown
      if (now() < lockUntil.current) return;
      
      // Reset state for new gesture
      axis.current = null;
      hasTriggered.current = false;
      startX.current = e.clientX;
      startY.current = e.clientY;
      
      // Capture pointer for consistent tracking
      el.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
      // Skip if already triggered or no gesture started
      if (hasTriggered.current || axis.current === 'done') return;
      
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      // Determine axis lock on first significant movement
      if (axis.current === null) {
        const distance = Math.hypot(dx, dy);
        
        // Wait for intent threshold before locking axis
        if (distance < intentPx) return;
        
        // Lock to primary axis
        axis.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }

      // Take control of the gesture (prevent scrolling/other handlers)
      e.preventDefault();
      e.stopPropagation();

      // Get movement on locked axis
      const primary = axis.current === 'x' ? dx : dy;
      
      // Check if threshold reached
      if (Math.abs(primary) >= thresholdPxTouch) {
        // Determine direction and trigger
        if (primary > 0) {
          // Positive movement: right/down
          if (axis.current === 'x') {
            onPrev?.(); // Swipe right → previous
          } else {
            onPrev?.(); // Swipe down → previous (scroll up behavior)
          }
        } else {
          // Negative movement: left/up
          if (axis.current === 'x') {
            onNext?.(); // Swipe left → next
          } else {
            onNext?.(); // Swipe up → next (scroll down behavior)
          }
        }
        
        // Mark as triggered and start cooldown
        hasTriggered.current = true;
        axis.current = 'done';
        lockUntil.current = now() + cooldownMs;
      }
    };

    const handlePointerUp = (e) => {
      // Release capture and reset
      el.releasePointerCapture?.(e.pointerId);
      axis.current = null;
      hasTriggered.current = false;
    };

    const handlePointerCancel = (e) => {
      // Handle cancel same as up
      el.releasePointerCapture?.(e.pointerId);
      axis.current = null;
      hasTriggered.current = false;
    };

    // Use pointer events for unified mouse/touch handling
    // passive: false required for preventDefault
    el.addEventListener('pointerdown', handlePointerDown, { passive: false });
    el.addEventListener('pointermove', handlePointerMove, { passive: false });
    el.addEventListener('pointerup', handlePointerUp, { passive: true });
    el.addEventListener('pointercancel', handlePointerCancel, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [viewportRef, onNext, onPrev, enabled, thresholdPxTouch, intentPx, cooldownMs]);
}