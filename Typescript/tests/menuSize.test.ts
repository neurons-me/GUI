import assert from 'node:assert/strict';
import {
  contactShift,
  hermiteToRest,
  clampRectToBounds,
  fitMenuCard,
  MENU_CONTACT_BAND,
  placeMenuCard,
  stepCriticalSpring,
  type MenuBounds,
} from '../src/gui/All.This/Cleaker/Corner/menuSize';

const bounds: MenuBounds = { left: 72, top: 52, right: 1280, bottom: 900, hasBars: true };
const d = MENU_CONTACT_BAND;

// Shift is exactly 0 until 8 px of remaining room, then a C2 ramp.
{
  const at = (remaining: number) => contactShift(-remaining, d);
  assert.equal(at(15), 0);
  assert.equal(at(10), 0);
  assert.equal(at(8), 0);
  assert.ok(Math.abs(at(4) - 0.11328125) < 1e-9, `at 4px: ${at(4)}`);
  assert.ok(Math.abs(at(0) - 1.25) < 1e-9, `at 0px: ${at(0)}`);
  // Exact clamp from d px past geometric contact.
  assert.equal(contactShift(d, d), d);
  assert.equal(contactShift(d + 10, d), d + 10);
  console.log('contactShift 15/10/8/4/0:', [15, 10, 8, 4, 0].map((r) => `${r}:${at(r)}`).join(' '));
}

// With room on both sides, the card stays centred and the QR does not move.
{
  const C = 700;
  const p = placeMenuCard({ w: 264, h: 240, qrCenterX: C, cardTop0: 80, bounds });
  assert.equal(p.left, C - 132);
  assert.equal(p.top, 80);
  assert.equal(p.qrShiftX, 0);
  assert.equal(p.qrShiftY, 0);
  const wide = placeMenuCard({ w: 642, h: 308, qrCenterX: C, cardTop0: 80, bounds });
  assert.equal(wide.left, C - 321);
  assert.equal(wide.qrShiftX, 0);
}

// Near the left bar: never crosses; shift is 0 while remaining > d, then grows smoothly.
{
  const qrX = 72 + 132;
  const home = placeMenuCard({ w: 264, h: 240, qrCenterX: qrX, cardTop0: 80, bounds });
  // Flush home already fits (remaining = 0): stay still, no pre-contact bump.
  assert.equal(home.left, bounds.left);
  assert.equal(home.qrShiftX, 0, `flush home shift ${home.qrShiftX}`);
  const keys = placeMenuCard({ w: 642, h: 308, qrCenterX: qrX, cardTop0: 80, bounds });
  assert.equal(keys.left, 72);
  assert.ok(keys.qrShiftX > 0);
  assert.ok(keys.left + keys.w <= bounds.right + 1e-6);
  let prev = -1;
  for (const w of [264, 300, 400, 500, 642]) {
    const p = placeMenuCard({ w, h: 240, qrCenterX: qrX, cardTop0: 80, bounds });
    assert.ok(p.left >= bounds.left - 1e-6, `crosses at w=${w}`);
    assert.ok(p.qrShiftX >= prev - 1e-9);
    prev = p.qrShiftX;
  }
}

// Joint bars: if W exceeds the gap, cap W and centre the QR.
{
  const tight: MenuBounds = { left: 100, top: 0, right: 400, bottom: 800, hasBars: true };
  const p = placeMenuCard({ w: 500, h: 200, qrCenterX: 200, cardTop0: 20, bounds: tight });
  assert.equal(p.w, 300);
  assert.equal(p.left, 100);
  assert.equal(p.qrX, 250);
  assert.equal(p.capped, true);
}

// Bottom bound: height past the bottom keeps the top (and the QR) and
// clamps height; the tree scrolls internally instead of the card climbing.
{
  const p = placeMenuCard({ w: 264, h: 400, qrCenterX: 400, cardTop0: 700, bounds });
  assert.equal(p.top, 700);
  assert.ok(p.top + p.h <= bounds.bottom + 1e-6);
  assert.equal(p.h, bounds.bottom - 700);
  assert.ok(Math.abs(p.qrShiftY) < 1e-6);
}

// Spring retarget with v clamped to 0 does not overshoot.
{
  let s = { x: 400, v: 800 }; // heading up
  s = { x: s.x, v: 0 }; // brake
  let max = s.x;
  for (let i = 0; i < 40; i++) {
    s = stepCriticalSpring(s, 274, 1 / 60);
    if (s.x > max) max = s.x;
  }
  assert.ok(max - 400 < 0.05, `overshoot ${max - 400}`);
}

// Short reverse tween from rest starts decreasing immediately.
{
  const T = 0.14;
  const p0 = hermiteToRest(500, 0, 274, 0, T);
  const p1 = hermiteToRest(500, 0, 274, 1 / 60 / T, T);
  assert.equal(p0.x, 500);
  assert.ok(p1.x < p0.x, `tween should decrease, got ${p1.x}`);
  const end = hermiteToRest(500, 0, 274, 1, T);
  assert.ok(Math.abs(end.x - 274) < 1e-9);
  assert.ok(Math.abs(end.v) < 1e-6);
}


// Viewport clamp: a card parked off the right/bottom is pulled back, and
// a card wider than the window shrinks so its top-right controls stay visible.
{
  const b = { left: 12, top: 12, right: 390, bottom: 700, hasBars: false };
  const off = clampRectToBounds({ left: 800, top: 500, w: 274, h: 270 }, b);
  assert.ok(off.left + off.w <= b.right + 1e-6, `right ${off.left + off.w}`);
  assert.ok(off.top + off.h <= b.bottom + 1e-6, `bottom ${off.top + off.h}`);
  assert.ok(off.left >= b.left, `left ${off.left}`);
  const wide = clampRectToBounds({ left: 200, top: 40, w: 676, h: 338 }, b);
  assert.ok(wide.w <= b.right - b.left + 1e-6, `w ${wide.w}`);
  assert.ok(wide.left + wide.w <= b.right + 1e-6, `wide right ${wide.left + wide.w}`);
}


// fitMenuCard: stay still while it fits; a contracting bar does not pull it back.
{
  const tight: MenuBounds = { left: 200, top: 0, right: 1280, bottom: 900, hasBars: true };
  const pushed = fitMenuCard({ left: 200, top: 80, w: 274, h: 240, bounds: tight, qrCenterX: 337 });
  assert.ok(pushed.left >= 200, `overlaps at ${pushed.left}`);
  const rest = pushed.left;
  const room: MenuBounds = { left: 72, top: 0, right: 1280, bottom: 900, hasBars: true };
  const stayed = fitMenuCard({ left: rest, top: pushed.top, w: 274, h: 240, bounds: room, qrCenterX: 337 });
  assert.equal(stayed.left, rest, `contract pulled the card to ${stayed.left}`);
}

// fitMenuCard: an expanding bar pushes only as much as needed, never overlaps.
{
  const room: MenuBounds = { left: 72, top: 0, right: 1280, bottom: 900, hasBars: true };
  const at = fitMenuCard({ left: 80, top: 80, w: 274, h: 240, bounds: room });
  assert.ok(at.left >= 72);
  const wide: MenuBounds = { left: 200, top: 0, right: 1280, bottom: 900, hasBars: true };
  const pushed = fitMenuCard({ left: at.left, top: at.top, w: 274, h: 240, bounds: wide });
  assert.ok(pushed.left >= 200 - 1e-6, `overlap left=${pushed.left}`);
  assert.ok(pushed.left + pushed.w <= wide.right + 1e-6);
}

// fitMenuCard: if it still does not fit, shrink to the gap.
{
  const gap: MenuBounds = { left: 100, top: 20, right: 390, bottom: 400, hasBars: true };
  const p = fitMenuCard({ left: 80, top: 10, w: 676, h: 500, bounds: gap });
  assert.equal(p.w, 290);
  assert.equal(p.h, 380);
  assert.equal(p.left, 100);
  assert.equal(p.top, 20);
  assert.equal(p.capped, true);
}

console.log('menuSize: ok');

// fitMenuCard: a box already inside the bounds must not creep on repeated fits.
{
  const bounds = { left: 0, top: 0, right: 800, bottom: 600, hasBars: true };
  let box = { left: 1.25, top: 1.25, w: 274, h: 240 };
  for (let i = 0; i < 30; i++) {
    const next = fitMenuCard({ ...box, bounds, qrCenterX: 337 });
    box = { left: next.left, top: next.top, w: next.w, h: next.h };
  }
  assert.equal(box.left, 1.25, `x crept to ${box.left}`);
  assert.equal(box.top, 1.25, `y crept to ${box.top}`);
}
