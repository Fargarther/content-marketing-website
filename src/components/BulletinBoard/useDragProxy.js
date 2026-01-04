import { useCallback, useEffect, useRef } from "react";

const LAYER_ID = "bb-drag-layer";
const STYLE_ID = "bb-drag-layer-style";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function ensureDragLayer() {
  let layer = document.getElementById(LAYER_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = LAYER_ID;
    document.body.appendChild(layer);
  }
  return layer;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${LAYER_ID} {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483647;
      contain: strict;
    }

    #${LAYER_ID} .bb-drag-proxy {
      position: absolute;
      left: 0;
      top: 0;
      margin: 0;
      pointer-events: none;
      will-change: transform;
      contain: layout paint;
      /* kill paint-heavy stuff during motion */
      filter: none !important;
      box-shadow: none !important;
    }

    /* nuke pseudo-element effects during drag (curl/tape/etc) */
    #${LAYER_ID} .bb-drag-proxy::before,
    #${LAYER_ID} .bb-drag-proxy::after,
    #${LAYER_ID} .bb-drag-proxy *::before,
    #${LAYER_ID} .bb-drag-proxy *::after {
      content: none !important;
      display: none !important;
    }

    .bb-drag-source-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

function getRotationDegrees(el) {
  const t = window.getComputedStyle(el).transform;
  if (!t || t === "none") return 0;

  // matrix(a, b, c, d, tx, ty)
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;

  const parts = m[1].split(",").map((x) => parseFloat(x.trim()));
  if (parts.length < 4) return 0;

  const [a, b] = parts;
  const angle = Math.atan2(b, a) * (180 / Math.PI);
  return Number.isFinite(angle) ? angle : 0;
}

/**
 * useDragProxy
 *
 * Attach onPointerDownCapture to the board container.
 * Your draggable items just need:
 *   data-bb-draggable="1"
 *   data-bb-kind="sticker" | "postit"
 *   data-bb-id="<id>"
 *
 * onCommit({ kind, id, x, y }) is called ONCE at the end (after fling).
 */
export function useDragProxy({ boardRef, onCommit, enableThrow = true }) {
  const layerRef = useRef(null);
  const dragRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    ensureStyles();
    layerRef.current = ensureDragLayer();
  }, []);

  const cleanup = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    window.removeEventListener("pointermove", d.onMove, { passive: false });
    window.removeEventListener("pointerup", d.onUp, { passive: false });

    document.body.style.userSelect = d.prevUserSelect || "";
    document.body.style.cursor = d.prevCursor || "";

    if (d.sourceEl) d.sourceEl.classList.remove("bb-drag-source-hidden");
    if (d.proxyEl && d.proxyEl.parentNode) d.proxyEl.parentNode.removeChild(d.proxyEl);

    dragRef.current = null;
  }, []);

  const finalize = useCallback(
    (kind, id, leftPx, topPx) => {
      const boardEl = boardRef?.current;
      if (!boardEl) return;

      const boardRect = boardEl.getBoundingClientRect();
      const x = leftPx - boardRect.left;
      const y = topPx - boardRect.top;

      onCommit?.({ kind, id, x, y });
    },
    [boardRef, onCommit]
  );

  const onPointerDownCapture = useCallback(
    (e) => {
      if (e.button != null && e.button !== 0) return; // left click only
      const boardEl = boardRef?.current;
      if (!boardEl) return;

      // Don't drag when interacting with inputs / editable areas
      const target = e.target;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;

      const sourceEl = target?.closest?.("[data-bb-draggable='1']");
      if (!sourceEl || !boardEl.contains(sourceEl)) return;

      e.preventDefault();

      const layer = layerRef.current || ensureDragLayer();
      const boardRect = boardEl.getBoundingClientRect();
      const r = sourceEl.getBoundingClientRect();

      const kind = sourceEl.getAttribute("data-bb-kind") || "";
      const id = sourceEl.getAttribute("data-bb-id") || "";
      if (!kind || !id) return;

      // pointer capture helps a LOT with "falls behind mouse"
      try {
        sourceEl.setPointerCapture?.(e.pointerId);
      } catch {}

      const offsetX = e.clientX - r.left;
      const offsetY = e.clientY - r.top;
      const rotateDeg = getRotationDegrees(sourceEl);

      const proxyEl = sourceEl.cloneNode(true);
      proxyEl.classList.add("bb-drag-proxy");

      // lock proxy dimensions so it doesn't reflow internally
      proxyEl.style.width = `${r.width}px`;
      proxyEl.style.height = `${r.height}px`;

      // Start exactly where the source is in viewport coordinates
      proxyEl.style.transform = `translate3d(${r.left}px, ${r.top}px, 0) rotate(${rotateDeg}deg)`;
      layer.appendChild(proxyEl);

      // Hide real element during motion
      sourceEl.classList.add("bb-drag-source-hidden");

      // Prevent text selection "drag lag"
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      const samples = [];
      const state = {
        kind,
        id,
        sourceEl,
        proxyEl,
        rotateDeg,
        width: r.width,
        height: r.height,
        boardRect,
        offsetX,
        offsetY,
        left: r.left,
        top: r.top,
        pendingLeft: r.left,
        pendingTop: r.top,
        samples,
        prevUserSelect,
        prevCursor,
        onMove: null,
        onUp: null,
      };

      const pushSample = (x, y) => {
        const t = performance.now();
        samples.push({ t, x, y });
        // keep last ~6
        while (samples.length > 6) samples.shift();
      };

      pushSample(state.left, state.top);

      state.onMove = (ev) => {
        ev.preventDefault();

        // Compute new viewport position (overlay is fixed to viewport)
        let left = ev.clientX - state.offsetX;
        let top = ev.clientY - state.offsetY;

        // Clamp inside board (viewport coords)
        const minLeft = state.boardRect.left;
        const maxLeft = state.boardRect.right - state.width;
        const minTop = state.boardRect.top;
        const maxTop = state.boardRect.bottom - state.height;

        left = clamp(left, minLeft, maxLeft);
        top = clamp(top, minTop, maxTop);

        state.pendingLeft = left;
        state.pendingTop = top;
        pushSample(left, top);

        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            state.left = state.pendingLeft;
            state.top = state.pendingTop;
            if (state.proxyEl) {
              state.proxyEl.style.transform = `translate3d(${state.left}px, ${state.top}px, 0) rotate(${state.rotateDeg}deg)`;
            }
          });
        }
      };

      state.onUp = (ev) => {
        ev.preventDefault();

        window.removeEventListener("pointermove", state.onMove, { passive: false });
        window.removeEventListener("pointerup", state.onUp, { passive: false });

        // Estimate velocity from samples (viewport coords)
        let vx = 0;
        let vy = 0;
        if (samples.length >= 2) {
          const a = samples[samples.length - 1];
          const b = samples[Math.max(0, samples.length - 4)]; // a little smoothing window
          const dt = Math.max(1, a.t - b.t);
          vx = (a.x - b.x) / dt; // px/ms
          vy = (a.y - b.y) / dt;
        }

        const speed = Math.hypot(vx, vy);

        const finishNow = (leftPx, topPx) => {
          finalize(state.kind, state.id, leftPx, topPx);
          cleanup();
        };

        // Throw / sling (runs on compositor via WAAPI)
        if (enableThrow && state.proxyEl && speed > 0.6) {
          const duration = clamp(speed * 500, 180, 720); // ms

          const friction = 0.35;
          let endLeft = state.left + vx * duration * friction;
          let endTop = state.top + vy * duration * friction;

          // Clamp end inside board
          const minLeft = state.boardRect.left;
          const maxLeft = state.boardRect.right - state.width;
          const minTop = state.boardRect.top;
          const maxTop = state.boardRect.bottom - state.height;

          endLeft = clamp(endLeft, minLeft, maxLeft);
          endTop = clamp(endTop, minTop, maxTop);

          const from = `translate3d(${state.left}px, ${state.top}px, 0) rotate(${state.rotateDeg}deg)`;
          const to = `translate3d(${endLeft}px, ${endTop}px, 0) rotate(${state.rotateDeg}deg)`;

          try {
            const anim = state.proxyEl.animate(
              [{ transform: from }, { transform: to }],
              {
                duration,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards",
              }
            );

            anim.onfinish = () => finishNow(endLeft, endTop);
            anim.oncancel = () => finishNow(state.left, state.top);
            return;
          } catch {
            // fallthrough to immediate
          }
        }

        finishNow(state.left, state.top);
      };

      dragRef.current = state;

      window.addEventListener("pointermove", state.onMove, { passive: false });
      window.addEventListener("pointerup", state.onUp, { passive: false });
    },
    [boardRef, cleanup, finalize, enableThrow]
  );

  // If component unmounts mid-drag, clean up
  useEffect(() => cleanup, [cleanup]);

  return { onPointerDownCapture };
}
