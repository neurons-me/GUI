import assert from 'node:assert/strict';
import { EASE, MOTION_CARD, MOTION_LEAVE, MOTION_MS, SPRING, leaveDelay, leaveTotalMs, appleSpring, springAt, springSettleMs, springToLinear, staggerDelay } from '../src/gui/Theme/motion';

let n = 0;
const test = (name: string, fn: () => void) => { fn(); n += 1; console.log(`PASS ${name}`); };

test('M1 opening is slower than closing; all within NN/g 100–500 ms', () => {
  assert.ok(MOTION_MS.enter > MOTION_MS.exit);
  assert.ok(MOTION_MS.contentIn > MOTION_MS.contentOut);
  for (const v of [MOTION_MS.enter, MOTION_MS.exit, MOTION_MS.contentIn, MOTION_MS.contentOut, MOTION_MS.lineIn, MOTION_MS.lineOut, MOTION_MS.reduced]) assert.ok(v >= 100 && v <= 500, String(v));
  // content comes in during the last ~60 % of the container's opening
  assert.ok(MOTION_MS.contentDelay / MOTION_MS.enter >= 0.35 && MOTION_MS.contentDelay / MOTION_MS.enter <= 0.45);
});

test('M2 stagger 24 ms, capped at 150 ms', () => {
  assert.equal(staggerDelay(0), 0); assert.equal(staggerDelay(1), 24); assert.equal(staggerDelay(100), 150); assert.equal(staggerDelay(-3), 0);
});

test('M3 spring physics: starts at 0, settles at 1; ζ=1 never overshoots; M3 default spatial overshoots ~1.5 %', () => {
  assert.equal(springAt(0, SPRING.defaultSpatial), 0);
  let peak = 0; for (let t = 0; t < 1; t += 0.001) peak = Math.max(peak, springAt(t, SPRING.defaultSpatial));
  assert.ok(peak > 1.005 && peak < 1.03, String(peak));
  let peakE = 0; for (let t = 0; t < 1; t += 0.001) peakE = Math.max(peakE, springAt(t, SPRING.defaultEffects));
  assert.ok(peakE <= 1 + 1e-9, String(peakE));
  const ms = springSettleMs(SPRING.defaultSpatial); assert.ok(ms > 300 && ms < 600, String(ms));
});

test('M4 springToLinear: valid linear() with increasing stops, starts 0, ends 1', () => {
  const { easing, ms } = springToLinear(SPRING.defaultSpatial);
  assert.match(easing, /^linear\(0, .*, 1\)$/);
  const pcts = [...easing.matchAll(/ ([\d.]+)%/g)].map((m) => Number(m[1]));
  assert.ok(pcts.length >= 8 && pcts.length <= 60, String(pcts.length));
  for (let i = 1; i < pcts.length; i++) assert.ok(pcts[i] > pcts[i - 1]);
  assert.equal(ms, springSettleMs(SPRING.defaultSpatial));
});

test('M5 Apple (duration, bounce) → spring', () => {
  const s = appleSpring(0.5, 0); assert.equal(s.dampingRatio, 1); assert.ok(Math.abs(s.stiffness - (2 * Math.PI / 0.5) ** 2) < 1e-9);
  assert.equal(appleSpring(0.5, 0.3).dampingRatio, 0.7);
  assert.ok(EASE.emphasizedDecelerate.startsWith('cubic-bezier('));
});

test('M6 value-entry card: soft and slow in (360–420 ms, no spring), faster out (~240 ms), tiny scale', () => {
  assert.ok(MOTION_CARD.enter >= 360 && MOTION_CARD.enter <= 420);
  assert.ok(MOTION_CARD.exit < MOTION_CARD.enter && MOTION_CARD.exit >= 200 && MOTION_CARD.exit <= 260);
  assert.ok(MOTION_CARD.contentIn >= 220 && MOTION_CARD.contentIn <= 260);
  assert.ok(MOTION_CARD.contentDelay + MOTION_CARD.contentIn <= MOTION_CARD.enter);
  assert.ok(MOTION_CARD.scale >= 0.98 && MOTION_CARD.scale < 1);
  assert.match(MOTION_CARD.ease, /^cubic-bezier\(/); assert.match(MOTION_CARD.exitEase, /^cubic-bezier\(/);
});

test('M7 "Show less": reverse cascade, last first, capped', () => {
  assert.equal(leaveDelay(0), 0); assert.equal(leaveDelay(1), MOTION_LEAVE.stagger); assert.equal(leaveDelay(99), MOTION_LEAVE.staggerCap);
  assert.equal(leaveTotalMs(1), MOTION_LEAVE.item); assert.equal(leaveTotalMs(50), MOTION_LEAVE.staggerCap + MOTION_LEAVE.item);
});

console.log(`${n} passed`);
