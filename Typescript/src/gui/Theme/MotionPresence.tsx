// MotionPresence.tsx — opening / closing building blocks on the motion tokens (motion.ts).
//
//   usePresence(value)   keeps the last value mounted until its exit has played; the
//                        `shown` flag flips one frame after mount so CSS transitions run,
//                        and flips back on close (re-opening mid-exit simply reverses).
//   <MotionScope shown>  context for everything inside a presence (content, lines, nodes).
//   <RevealContent>      the content: grows from its origin (container-transform feel):
//                        opacity (effects, no overshoot) in the last 60 % + a small lift and
//                        scale on the spatial spring; on close it fades out first.
//   <HeightGlide>        the space: measured-height glide (FLIP-style, Web Animations API)
//                        so whatever sits below slides instead of jumping; interruptible
//                        (starts from the current animated height), clips only its bottom
//                        edge while gliding (stems above and dock hover are never cut).
//   useStaggerIndex()    items mounted in the same frame get 0,1,2… for a capped cascade.
//
// prefers-reduced-motion: no movement, no glide, no stagger — a 120 ms fade only.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import { EASE, MOTION_CARD, MOTION_MS, REDUCED_MOTION_QUERY, prefersReducedMotion } from './motion';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(prefersReducedMotion);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/**
 * Presence for a value that opens (non-null) and closes (null). A different
 * non-null value swaps in at once (new key → its own enter); null keeps the
 * last value mounted for `outMs` so its exit can play.
 */
export function usePresence<T>(value: T | null, keyOf: (v: T) => string, outMs: number = MOTION_MS.contentOut) {
  const [item, setItem] = React.useState<T | null>(value);
  const [shownKey, setShownKey] = React.useState<string | null>(null);
  const key = value != null ? keyOf(value) : null;
  const latest = React.useRef(value); latest.current = value;
  // A different non-null value replacing an open one is a SWAP (A → B), not a fresh open.
  const prevKey = React.useRef<string | null>(null); const swapRef = React.useRef(false);
  if (key !== prevKey.current) { if (key != null) swapRef.current = prevKey.current != null; prevKey.current = key; }
  React.useEffect(() => {
    if (key != null) {
      setItem(latest.current);
      let r2 = 0; const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShownKey(key)); });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
    setShownKey(null);
    const t = window.setTimeout(() => setItem(null), outMs);
    return () => window.clearTimeout(t);
  }, [key, outMs]);
  // Keep the shown item's data fresh while it stays the same key (e.g. a renamed group).
  const current = value != null ? value : item;
  const currentKey = current != null ? keyOf(current) : null;
  return { item: current, key: currentKey, shown: currentKey != null && shownKey === currentKey && value != null, swap: swapRef.current };
}

type MotionState = { shown: boolean; reduced: boolean };
const MotionContext = React.createContext<MotionState>({ shown: true, reduced: false });
export const useMotion = () => React.useContext(MotionContext);

export function MotionScope({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const value = React.useMemo(() => ({ shown, reduced }), [shown, reduced]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

/**
 * The card's SPACE: a grid row 0fr ↔ 1fr, so the height is the browser's own (measured before
 * paint — no pop, no flash) and moves together with whatever sits below. Opening and closing
 * are one transition each (interruptible: reversing mid-way continues from the current height).
 * `instant`: a swap (card A → card B) keeps 1fr and lets the outer HeightGlide move A's height
 * to B's. While it animates it carries `data-motion-busy`, so an outer HeightGlide stays out.
 */
export function RevealHeight({ instant = false, children }: { instant?: boolean; children: React.ReactNode }) {
  const { shown, reduced } = useMotion();
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const [inMenu, setInMenu] = React.useState(false);
  React.useLayoutEffect(() => { setInMenu(!!boxRef.current?.closest('[data-cleaker-panel]')); }, []);
  const [busy, setBusy] = React.useState(true);
  React.useEffect(() => {
    setBusy(true);
    const t = window.setTimeout(() => setBusy(false), (shown ? MOTION_CARD.enter : MOTION_CARD.exit) + 30);
    return () => window.clearTimeout(t);
  }, [shown]);
  const was = React.useRef(false); if (shown) was.current = true;
  const holdOpen = (instant && !was.current) || inMenu; // a swap entering: already full height; the QR card sizes itself
  const rows = shown || holdOpen ? '1fr' : '0fr';
  return (
    <Box
      ref={boxRef}
      data-motion-busy={busy && !holdOpen && !reduced ? '' : undefined}
      sx={{
        display: 'grid', gridTemplateRows: rows,
        transition: reduced || holdOpen ? 'none' : shown
          ? `grid-template-rows ${MOTION_CARD.enter}ms ${MOTION_CARD.ease}`
          : `grid-template-rows ${MOTION_CARD.exit}ms ${MOTION_CARD.exitEase}`,
      }}
    >
      {/* min-height 0 lets the track shrink; overflow stays visible (the stem above and the
          content's own clip handle what shows). */}
      <Box sx={{ minHeight: 0 }}>{children}</Box>
    </Box>
  );
}

/**
 * The card's CONTENT: unfolds top-down from the node that opened it (clip-path inset from the
 * bottom, in sync with the space), scale 0.98 → 1 from that node, a 6 px settle, and a late, long
 * fade. No spring. Closing: fade + clip up together with the space collapsing.
 */
export function RevealContent({ origin: originEl, children }: { origin?: () => HTMLElement | null | undefined; children: React.ReactNode }) {
  const { shown, reduced } = useMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [origin, setOrigin] = React.useState<string>('50% 0');
  const originRef = React.useRef(originEl); originRef.current = originEl;
  // Grow from the node that opened it: transform-origin at that node's centre, top edge.
  React.useLayoutEffect(() => {
    const el = ref.current; const a = originRef.current?.();
    if (!el || !a) return;
    const r = el.getBoundingClientRect(); const ar = a.getBoundingClientRect();
    if (r.width) setOrigin(`${Math.round(ar.left + ar.width / 2 - r.left)}px 0`);
  }, []);
  const C = MOTION_CARD; const k = `-${C.clipSlack}px`;
  const transition = reduced
    ? `opacity ${MOTION_MS.reduced}ms linear`
    : shown
      ? [
        `opacity ${C.contentIn}ms ${EASE.emphasizedDecelerate} ${C.contentDelay}ms`,
        `clip-path ${C.enter}ms ${C.ease}`,
        `translate ${C.enter}ms ${C.ease}`, `scale ${C.enter}ms ${C.ease}`,
      ].join(', ')
      : [
        `opacity ${C.contentOut}ms ${EASE.standardAccelerate}`,
        `clip-path ${C.exit}ms ${C.exitEase}`,
        `translate ${C.exit}ms ${C.exitEase}`, `scale ${C.exit}ms ${C.exitEase}`,
      ].join(', ');
  return (
    <Box
      ref={ref} data-motion-reveal={shown ? 'open' : 'closed'}
      sx={{
        opacity: shown ? 1 : 0,
        clipPath: reduced ? 'none' : shown ? `inset(${k} ${k} ${k} ${k})` : `inset(${k} ${k} 100% ${k})`,
        translate: reduced || shown ? '0 0' : `0 -${C.lift}px`,
        scale: reduced || shown ? '1' : String(C.scale),
        transformOrigin: origin, transition,
      }}
    >
      {children}
    </Box>
  );
}

/** The space around changing content glides between heights instead of jumping. */
export function HeightGlide({ children, ...rest }: { children: React.ReactNode } & Record<`data-${string}`, string>) {
  const outer = React.useRef<HTMLDivElement | null>(null);
  const inner = React.useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const last = React.useRef<number | null>(null);
  const anim = React.useRef<Animation | null>(null);
  React.useLayoutEffect(() => {
    const o = outer.current; const i = inner.current;
    if (!o || !i || typeof ResizeObserver === 'undefined') return undefined;
    last.current = i.getBoundingClientRect().height;
    const ro = new ResizeObserver(() => {
      if (o.closest('[data-cleaker-panel]')) return;
      const next = i.getBoundingClientRect().height;
      const prev = last.current; last.current = next;
      if (prev == null || Math.abs(next - prev) < 0.5 || reduced || typeof o.animate !== 'function') return;
      // A RevealHeight inside is animating its own space: let it (no double motion).
      if (i.querySelector('[data-motion-busy]')) { anim.current?.cancel(); return; }
      // Interrupted? start from where the space is right now.
      const from = anim.current ? o.getBoundingClientRect().height : prev;
      anim.current?.cancel();
      const growing = next > from;
      o.style.clipPath = 'inset(-100vh -100vw 0 -100vw)'; // clip the bottom edge only
      const a = o.animate([{ height: `${from}px` }, { height: `${next}px` }], {
        duration: growing ? MOTION_MS.enter : MOTION_MS.exit,
        easing: growing ? EASE.emphasizedDecelerate : EASE.standard,
      });
      anim.current = a;
      const done = () => { if (anim.current === a) { anim.current = null; o.style.clipPath = ''; } };
      a.onfinish = done; a.oncancel = done;
    });
    ro.observe(i);
    return () => { ro.disconnect(); anim.current?.cancel(); };
  }, [reduced]);
  return (
    <Box ref={outer} {...rest} sx={{ width: '100%' }}>
      <Box ref={inner} sx={{ width: '100%', display: 'flow-root' }}>{children}</Box>
    </Box>
  );
}

/** Indices for a cascade: items that mount in the same frame get 0, 1, 2… */
export function useStaggerBatch() {
  const state = React.useRef({ n: 0, scheduled: false });
  return React.useCallback(() => {
    const s = state.current; const i = s.n; s.n += 1;
    if (!s.scheduled) {
      s.scheduled = true;
      const reset = () => { s.n = 0; s.scheduled = false; };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(reset); else setTimeout(reset, 0);
    }
    return i;
  }, []);
}
