// motion.ts — shared motion tokens for opening / closing things in the GUI
// (pure data + helpers, no React; see MotionPresence.tsx for the components).
//
// Sources (motion study: .grok-tmp/motion-study.md):
//  - NN/g "Executing UX Animations" (2020): most UI motion 100–500 ms, modal-size
//    changes 200–300 ms, entering slightly longer than exiting (e.g. 300 in / 200–250 out).
//  - NN/g "Animation for Attention and Comprehension": the effect must start within
//    0.1 s of the action to read as caused by it (Card, Moran & Newell response limits).
//  - Material Design 3 easing & duration: emphasized cubic-bezier(0.2,0,0,1),
//    emphasized-decelerate (0.05,0.7,0.1,1) to enter, emphasized-accelerate (0.3,0,0.8,0.15)
//    to exit; durations scale with the area covered; exits are shorter.
//  - M3 Expressive motion physics: springs; "spatial" springs (position/size/scale)
//    may overshoot slightly, "effects" springs (color/opacity) never do.
//    Default spatial: damping ratio 0.8, stiffness 380.
//  - Apple WWDC23 "Animate with springs": perceptual duration + bounce; smooth = 0 bounce.
//  - CSS linear() (Chrome 113 / Firefox 112 / Safari 17.2) can replay a sampled spring;
//    keep a cubic-bezier fallback. WCAG 2.3.3 + prefers-reduced-motion: no movement,
//    at most a short fade.
//
// Durations/curves are design-system CONVENTIONS (M3, NN/g guidance), not lab results;
// the research-backed parts are the ~100 ms causality limit and "faster out than in".

/** Milliseconds. Opening is slower than closing (attention on what is new). */
export const MOTION_MS = {
  /** A container (card, branch) opening: height glide + content. */
  enter: 280,
  /** Content fade-in starts this late into `enter` (container first, content last 60%). */
  contentDelay: 110,
  /** Content fade-in length. */
  contentIn: 190,
  /** Content fade-out before the container closes (content first). */
  contentOut: 110,
  /** Container collapse after its content is gone. */
  exit: 180,
  /** Connector line drawing in (with the container) / retracting (with the content). */
  lineIn: 260,
  lineOut: 110,
  /** Per-item stagger in a row that unfolds, and the cap of the whole cascade. */
  stagger: 24,
  staggerCap: 150,
  /** prefers-reduced-motion: a short cross-fade only, no movement. */
  reduced: 120,
} as const;

/**
 * The value-entry card (new key / key cards): a LARGE surface, so slower and softer than rows
 * (M3: duration scales with the area covered; enter ≈ 400 ms emphasized-decelerate, NN/g: big
 * movements up to ~400 ms). No spring here — feedback (v2): the overshoot read as abrupt on a
 * form; M3 Expressive also keeps springs for small spatial items. The card UNFOLDS vertically
 * from the node that opened it (space + clip from the top, in sync), scale barely changes
 * (0.98 → 1), content fades in late and long; it closes faster (exit < enter) in one motion:
 * content fade + space collapse together, so nothing waits.
 */
export const MOTION_CARD = {
  /** Space + top-down unfold (clip) + tiny scale/lift. */
  enter: 400,
  /**
   * M3 "emphasized" (begins and ends on screen): eases IN from rest, then a long soft landing.
   * Measured: emphasized-decelerate (0.05, 0.7, …) moved Sign out ~147 px in the first frame
   * of a 365 px unfold — that first-frame leap is what read as abrupt; emphasized has no leap.
   */
  ease: 'cubic-bezier(0.2, 0, 0, 1)',
  /** Content fade-in: starts at 35 %, lasts ~60 %. */
  contentDelay: 140,
  contentIn: 250,
  /** Closing: the space collapses while the content fades, together. */
  exit: 240,
  /**
   * Closing in place: symmetric ease-in-out (M3 legacy standard). Emphasized (0.2,0,0,1) moved
   * ~93 px in one frame at the start of the 240 ms collapse; accelerate curves end at full speed
   * (Sign out would slam). Ease-in-out keeps the peak ≈ 2× average and lands softly.
   */
  exitEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
  contentOut: 150,
  scale: 0.98,
  lift: 6,
  /** Clip slack so the card's shadow / hover lift is never cut once open. */
  clipSlack: 10,
} as const;

/** Rows leaving on "Show less": reverse cascade (last first), shorter than entering. */
export const MOTION_LEAVE = { stagger: 16, staggerCap: 96, item: 140 } as const;

/** Small spatial offsets (px / ratio): move little, scale little. */
export const MOTION_SPACE = { lift: 8, cardScale: 0.96, nodeScale: 0.72, nodeLift: 6 } as const;

/** Cubic-bezier easings (M3). */
export const EASE = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

export interface SpringSpec {
  /** Damping ratio ζ (1 = no overshoot, <1 = bounce). */
  dampingRatio: number;
  /** Stiffness k (mass 1). */
  stiffness: number;
}

/** M3 Expressive spatial springs (damping ratio, stiffness). */
export const SPRING = {
  fastSpatial: { dampingRatio: 0.9, stiffness: 1400 },
  defaultSpatial: { dampingRatio: 0.8, stiffness: 380 },
  /** Effects (opacity/colour): critically damped, never overshoots. */
  defaultEffects: { dampingRatio: 1, stiffness: 1600 },
} as const satisfies Record<string, SpringSpec>;

/** Apple's (duration, bounce) → (ζ, k), mass 1: k = (2π/d)², ζ = 1 − bounce (bounce ≥ 0). */
export function appleSpring(perceptualSeconds: number, bounce = 0): SpringSpec {
  const k = (2 * Math.PI / perceptualSeconds) ** 2;
  return { stiffness: k, dampingRatio: bounce >= 0 ? 1 - bounce : 1 / (1 + bounce) };
}

/** Position x(t) of a unit step on a damped spring (0 → 1), mass 1, starting at rest. */
export function springAt(t: number, { dampingRatio: z, stiffness }: SpringSpec): number {
  const w = Math.sqrt(stiffness);
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const s = w * Math.sqrt(z * z - 1);
  const r1 = -z * w + s; const r2 = -z * w - s;
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

/** Time (ms) after which the spring stays within `epsilon` of 1. */
export function springSettleMs(spec: SpringSpec, epsilon = 0.001): number {
  const dt = 1 / 600; let last = 0;
  for (let t = 0; t < 3; t += dt) if (Math.abs(springAt(t, spec) - 1) > epsilon) last = t;
  return Math.ceil((last + dt) * 1000);
}

/**
 * The spring as a CSS `linear()` easing over its settle time, simplified so straight
 * segments stay within `tolerance` of the real curve. Returns its duration too —
 * linear() has no physics, so the transition must use exactly that duration.
 */
export function springToLinear(spec: SpringSpec, tolerance = 0.002): { easing: string; ms: number } {
  const ms = springSettleMs(spec);
  const N = 240; const pts = Array.from({ length: N + 1 }, (_, i) => [i / N, springAt((i / N) * (ms / 1000), spec)] as const);
  const keep = new Set([0, N]);
  const rdp = (a: number, b: number) => {
    let worst = -1; let at = -1;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i]; const [x0, y0] = pts[a]; const [x1, y1] = pts[b];
      const err = Math.abs(y - (y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)));
      if (err > worst) { worst = err; at = i; }
    }
    if (worst > tolerance) { keep.add(at); rdp(a, at); rdp(at, b); }
  };
  rdp(0, N);
  const stops = [...keep].sort((p, q) => p - q).map((i) => {
    const [x, y] = pts[i]; const v = i === N ? 1 : Number(y.toFixed(4));
    return i === 0 ? '0' : i === N ? '1' : `${v} ${Number((x * 100).toFixed(2))}%`;
  });
  return { easing: `linear(${stops.join(', ')})`, ms };
}

/** Whether this browser understands linear() easing (else use the cubic fallback). */
export function supportsLinearEasing(): boolean {
  try { return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('transition-timing-function', 'linear(0, 1)'); } catch { return false; }
}

/** The spatial spring for cards / nodes opening, with its fallback. */
const SPATIAL = springToLinear(SPRING.defaultSpatial);
export const SPRING_SPATIAL = { ...SPATIAL, fallback: EASE.emphasizedDecelerate, fallbackMs: MOTION_MS.enter + 40 } as const;

/** `transition`/`animation` timing for the spatial spring (linear() if supported, else cubic). */
export function spatialSpring(): { easing: string; ms: number } {
  return supportsLinearEasing() ? { easing: SPRING_SPATIAL.easing, ms: SPRING_SPATIAL.ms } : { easing: SPRING_SPATIAL.fallback, ms: SPRING_SPATIAL.fallbackMs };
}

/** Stagger delay for the i-th item of a cascade (capped). */
export const staggerDelay = (i: number) => Math.min(Math.max(0, i) * MOTION_MS.stagger, MOTION_MS.staggerCap);
/** Reverse cascade for leaving items: `fromEnd` = 0 for the last item. */
export const leaveDelay = (fromEnd: number) => Math.min(Math.max(0, fromEnd) * MOTION_LEAVE.stagger, MOTION_LEAVE.staggerCap);
/** Total time a leaving cascade needs before the space may close. */
export const leaveTotalMs = (count: number) => leaveDelay(count - 1) + MOTION_LEAVE.item;

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export function prefersReducedMotion(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches; } catch { return false; }
}
