/**
 * useDragEngine - Figma-style drag proxy engine
 *
 * Core architecture:
 * - During drag: moves a lightweight proxy in a fixed overlay
 * - Original DOM stays static (no React re-renders)
 * - Position commits ONCE at end of drag/fling
 * - 60fps guaranteed via transform-only updates
 */

import { useRef, useCallback, useEffect } from 'react';

// Constants
const VELOCITY_SAMPLES = 6;
const FLING_THRESHOLD = 0.3; // px/ms
const FRICTION = 0.92;
const MIN_VELOCITY = 0.1;
const BOUNCE_DAMPING = 0.3;

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Extract rotation from transform matrix
 */
function getRotationFromElement(el) {
  const style = window.getComputedStyle(el);
  const transform = style.transform;
  if (!transform || transform === 'none') return 0;

  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return 0;

  const values = match[1].split(',').map(v => parseFloat(v.trim()));
  if (values.length < 2) return 0;

  return Math.atan2(values[1], values[0]) * (180 / Math.PI);
}

/**
 * Main drag engine hook
 */
export function useDragEngine({
  containerRef,
  onDragStart,
  onDragEnd,
  onPositionCommit,
  getBounds,
}) {
  // Refs for drag state (no React re-renders during drag)
  const dragStateRef = useRef(null);
  const rafIdRef = useRef(null);
  const flingRafRef = useRef(null);
  const proxyRef = useRef(null);
  const velocitySamplesRef = useRef([]);

  /**
   * Clean up any ongoing animations
   */
  const cleanup = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (flingRafRef.current) {
      cancelAnimationFrame(flingRafRef.current);
      flingRafRef.current = null;
    }
  }, []);

  /**
   * Create lightweight proxy element
   */
  const createProxy = useCallback((sourceEl, rect, rotation) => {
    const proxy = sourceEl.cloneNode(true);

    // Apply lightweight styles - strip paint-heavy effects
    proxy.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: ${rect.width}px;
      height: ${rect.height}px;
      margin: 0;
      pointer-events: none;
      will-change: transform;
      contain: layout paint;
      z-index: 2147483647;
      filter: none !important;
      box-shadow: none !important;
      transition: none !important;
      animation: none !important;
      transform: translate3d(${rect.left}px, ${rect.top}px, 0) rotate(${rotation}deg);
    `;

    // Remove pseudo-element effects by adding a class
    proxy.classList.add('bb-drag-proxy');

    // Strip shadows/filters from all children
    proxy.querySelectorAll('*').forEach(child => {
      child.style.filter = 'none';
      child.style.boxShadow = 'none';
      child.style.transition = 'none';
      child.style.animation = 'none';
    });

    return proxy;
  }, []);

  /**
   * Update proxy transform (RAF-batched)
   */
  const updateProxyTransform = useCallback((x, y, rotation) => {
    if (proxyRef.current) {
      proxyRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
    }
  }, []);

  /**
   * Calculate velocity from samples
   */
  const calculateVelocity = useCallback(() => {
    const samples = velocitySamplesRef.current;
    if (samples.length < 2) return { vx: 0, vy: 0 };

    const recent = samples.slice(-3); // Use last 3 samples for smoothing
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = Math.max(1, last.t - first.t);

    return {
      vx: (last.x - first.x) / dt,
      vy: (last.y - first.y) / dt,
    };
  }, []);

  /**
   * Run fling/inertia animation
   */
  const runFlingAnimation = useCallback((startX, startY, vx, vy, rotation, bounds, itemId, itemType) => {
    let x = startX;
    let y = startY;
    let velocityX = vx;
    let velocityY = vy;

    const animate = () => {
      // Apply friction
      velocityX *= FRICTION;
      velocityY *= FRICTION;

      // Update position
      x += velocityX * 16; // ~16ms per frame
      y += velocityY * 16;

      // Bounce off bounds
      if (x < bounds.minX) {
        x = bounds.minX;
        velocityX = -velocityX * BOUNCE_DAMPING;
      } else if (x > bounds.maxX) {
        x = bounds.maxX;
        velocityX = -velocityX * BOUNCE_DAMPING;
      }

      if (y < bounds.minY) {
        y = bounds.minY;
        velocityY = -velocityY * BOUNCE_DAMPING;
      } else if (y > bounds.maxY) {
        y = bounds.maxY;
        velocityY = -velocityY * BOUNCE_DAMPING;
      }

      // Update proxy
      updateProxyTransform(x, y, rotation);

      // Check if should continue
      const speed = Math.hypot(velocityX, velocityY);
      if (speed > MIN_VELOCITY) {
        flingRafRef.current = requestAnimationFrame(animate);
      } else {
        // Fling complete - commit final position
        finalizeDrag(x, y, itemId, itemType, bounds);
      }
    };

    flingRafRef.current = requestAnimationFrame(animate);
  }, [updateProxyTransform]);

  /**
   * Finalize drag - commit position to React state
   */
  const finalizeDrag = useCallback((viewportX, viewportY, itemId, itemType, bounds) => {
    const state = dragStateRef.current;
    if (!state) return;

    // Convert viewport coords to board-relative coords
    const boardX = viewportX - bounds.boardLeft;
    const boardY = viewportY - bounds.boardTop;

    // Clamp to board bounds
    const finalX = clamp(boardX, 0, bounds.boardWidth - state.itemWidth);
    const finalY = clamp(boardY, 0, bounds.boardHeight - state.itemHeight);

    // Wait 2 frames before cleanup to ensure React has painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Remove proxy
        if (proxyRef.current && proxyRef.current.parentNode) {
          proxyRef.current.parentNode.removeChild(proxyRef.current);
        }
        proxyRef.current = null;

        // Unhide source element
        if (state.sourceEl) {
          state.sourceEl.style.visibility = '';
          state.sourceEl.style.pointerEvents = '';
        }

        // Restore body styles
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        // Commit final position to React
        onPositionCommit?.({
          id: itemId,
          type: itemType,
          x: finalX,
          y: finalY,
        });

        onDragEnd?.({ id: itemId, type: itemType });

        dragStateRef.current = null;
      });
    });
  }, [onPositionCommit, onDragEnd]);

  /**
   * Handle pointer down - start drag
   */
  const handlePointerDown = useCallback((e, itemId, itemType) => {
    // Only handle left mouse button / primary touch
    if (e.button !== 0 && e.button !== undefined) return;

    // Don't drag if clicking on interactive elements
    const target = e.target;
    if (target.closest('input, textarea, select, button, [contenteditable]')) return;

    const sourceEl = e.currentTarget;
    const container = containerRef?.current;
    if (!sourceEl || !container) return;

    // Prevent default to avoid text selection
    e.preventDefault();

    // Capture pointer for reliable tracking
    try {
      sourceEl.setPointerCapture(e.pointerId);
    } catch (err) {
      // Fallback if setPointerCapture not supported
    }

    // Get measurements ONCE at start
    const containerRect = container.getBoundingClientRect();
    const itemRect = sourceEl.getBoundingClientRect();
    const rotation = getRotationFromElement(sourceEl);

    // Calculate offset from pointer to item origin
    const offsetX = e.clientX - itemRect.left;
    const offsetY = e.clientY - itemRect.top;

    // Calculate bounds
    const bounds = getBounds ? getBounds() : {
      minX: containerRect.left,
      maxX: containerRect.right - itemRect.width,
      minY: containerRect.top,
      maxY: containerRect.bottom - itemRect.height,
      boardLeft: containerRect.left,
      boardTop: containerRect.top,
      boardWidth: containerRect.width,
      boardHeight: containerRect.height,
    };

    // Create proxy
    const proxy = createProxy(sourceEl, itemRect, rotation);
    document.body.appendChild(proxy);
    proxyRef.current = proxy;

    // Hide source element
    sourceEl.style.visibility = 'hidden';
    sourceEl.style.pointerEvents = 'none';

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    // Initialize velocity samples
    velocitySamplesRef.current = [{
      t: performance.now(),
      x: itemRect.left,
      y: itemRect.top,
    }];

    // Store drag state
    dragStateRef.current = {
      itemId,
      itemType,
      sourceEl,
      rotation,
      offsetX,
      offsetY,
      bounds,
      itemWidth: itemRect.width,
      itemHeight: itemRect.height,
      currentX: itemRect.left,
      currentY: itemRect.top,
      pendingX: itemRect.left,
      pendingY: itemRect.top,
      pointerId: e.pointerId,
    };

    onDragStart?.({ id: itemId, type: itemType });
  }, [containerRef, createProxy, getBounds, onDragStart]);

  /**
   * Handle pointer move - update proxy position
   */
  const handlePointerMove = useCallback((e) => {
    const state = dragStateRef.current;
    if (!state) return;
    if (e.pointerId !== state.pointerId) return;

    e.preventDefault();

    // Use coalesced events if available for smoother tracking
    const events = e.getCoalescedEvents?.() || [e];
    const lastEvent = events[events.length - 1];

    // Calculate new position (viewport coordinates)
    let newX = lastEvent.clientX - state.offsetX;
    let newY = lastEvent.clientY - state.offsetY;

    // Clamp to bounds (viewport coordinates)
    newX = clamp(newX, state.bounds.minX, state.bounds.maxX);
    newY = clamp(newY, state.bounds.minY, state.bounds.maxY);

    // Store pending position
    state.pendingX = newX;
    state.pendingY = newY;

    // Sample velocity
    const now = performance.now();
    velocitySamplesRef.current.push({ t: now, x: newX, y: newY });
    if (velocitySamplesRef.current.length > VELOCITY_SAMPLES) {
      velocitySamplesRef.current.shift();
    }

    // Schedule RAF update (coalesce multiple moves into one frame)
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (dragStateRef.current) {
          state.currentX = state.pendingX;
          state.currentY = state.pendingY;
          updateProxyTransform(state.currentX, state.currentY, state.rotation);
        }
      });
    }
  }, [updateProxyTransform]);

  /**
   * Handle pointer up - end drag, possibly start fling
   */
  const handlePointerUp = useCallback((e) => {
    const state = dragStateRef.current;
    if (!state) return;
    if (e.pointerId !== state.pointerId) return;

    e.preventDefault();
    cleanup();

    // Release pointer capture
    try {
      state.sourceEl?.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }

    // Calculate velocity
    const { vx, vy } = calculateVelocity();
    const speed = Math.hypot(vx, vy);

    // If fast enough, start fling animation
    if (speed > FLING_THRESHOLD) {
      runFlingAnimation(
        state.currentX,
        state.currentY,
        vx,
        vy,
        state.rotation,
        state.bounds,
        state.itemId,
        state.itemType
      );
    } else {
      // No fling - commit position immediately
      finalizeDrag(
        state.currentX,
        state.currentY,
        state.itemId,
        state.itemType,
        state.bounds
      );
    }
  }, [cleanup, calculateVelocity, runFlingAnimation, finalizeDrag]);

  /**
   * Handle pointer cancel
   */
  const handlePointerCancel = useCallback((e) => {
    const state = dragStateRef.current;
    if (!state) return;

    cleanup();

    // Remove proxy without committing position
    if (proxyRef.current && proxyRef.current.parentNode) {
      proxyRef.current.parentNode.removeChild(proxyRef.current);
    }
    proxyRef.current = null;

    // Unhide source
    if (state.sourceEl) {
      state.sourceEl.style.visibility = '';
      state.sourceEl.style.pointerEvents = '';
    }

    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    dragStateRef.current = null;
  }, [cleanup]);

  // Set up global pointer event listeners
  useEffect(() => {
    const onMove = (e) => handlePointerMove(e);
    const onUp = (e) => handlePointerUp(e);
    const onCancel = (e) => handlePointerCancel(e);

    // Use capture phase for reliable event handling
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { passive: false });
    window.addEventListener('pointercancel', onCancel, { passive: false });

    return () => {
      cleanup();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [handlePointerMove, handlePointerUp, handlePointerCancel, cleanup]);

  // Inject proxy styles once
  useEffect(() => {
    const styleId = 'bb-drag-proxy-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .bb-drag-proxy,
      .bb-drag-proxy *,
      .bb-drag-proxy::before,
      .bb-drag-proxy::after,
      .bb-drag-proxy *::before,
      .bb-drag-proxy *::after {
        filter: none !important;
        box-shadow: none !important;
        transition: none !important;
        animation: none !important;
      }
      .bb-drag-proxy::before,
      .bb-drag-proxy::after,
      .bb-drag-proxy *::before,
      .bb-drag-proxy *::after {
        content: none !important;
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return {
    handlePointerDown,
    isDragging: () => dragStateRef.current !== null,
  };
}

export default useDragEngine;
