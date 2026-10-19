// What opens what, as circles. Ledgers are the large circles; a `.me` sits where the ledgers it has a link in overlap;
// each coalition (a set of keys that must be together) is drawn as one shape: a ring for one key, a capsule through
// several. Two separate shapes are OR. The lock on a ledger's name marks where the sealed value lives.
import * as React from 'react';

export type CircleLedger = { id: string; root: string; up?: boolean | null };
export type CircleParty = { id: string; ledgers: string[] };

const W = 640;
const COLORS = ['#2a7de1', '#d9822b', '#2e9e6b', '#b04fc4', '#d14b6a'];
const R = 21;

type Pt = { x: number; y: number };

function ledgerLayout(n: number): { centers: Pt[]; r: number; height: number } {
  if (n <= 1) return { centers: [{ x: W / 2, y: 185 }], r: 135, height: 380 };
  if (n === 2) return { centers: [{ x: 235, y: 185 }, { x: 405, y: 185 }], r: 135, height: 380 };
  return { centers: [{ x: 225, y: 160 }, { x: 415, y: 160 }, { x: 320, y: 325 }], r: 120, height: 500 };
}

function partyPositions(parties: CircleParty[], ledgers: CircleLedger[], centers: Pt[], height: number): Record<string, Pt> {
  const index = new Map(ledgers.map((l, i) => [l.id, i]));
  const centroid = centers.reduce((a, c) => ({ x: a.x + c.x / centers.length, y: a.y + c.y / centers.length }), { x: 0, y: 0 });
  const slots = new Map<string, number>();
  const out: Record<string, Pt> = {};
  for (const p of parties) {
    const at = p.ledgers.map((l) => index.get(l)).filter((i): i is number => i !== undefined).sort();
    const key = at.join(',');
    const n = slots.get(key) ?? 0;
    slots.set(key, n + 1);
    let base: Pt;
    if (at.length === 0) base = { x: 70 + n * 62, y: height - 30 };
    else if (at.length === 1) {
      const c = centers[at[0]];
      const away = { x: c.x - centroid.x, y: c.y - centroid.y };
      const len = Math.hypot(away.x, away.y) || 1;
      base = ledgers.length === 1 ? c : { x: c.x + (away.x / len) * 62, y: c.y + (away.y / len) * 62 };
    } else {
      const pts = at.map((i) => centers[i]);
      base = { x: pts.reduce((s, c) => s + c.x, 0) / pts.length, y: pts.reduce((s, c) => s + c.y, 0) / pts.length };
    }
    const spread = at.length === 0 ? 0 : (n % 2 === 0 ? 1 : -1) * Math.ceil(n / 2) * 52;
    out[p.id] = at.length === 0 ? base : { x: base.x, y: base.y + spread };
  }
  return out;
}

function Coalition({ members, pos, color, dashed }: { members: string[]; pos: Record<string, Pt>; color: string; dashed?: boolean }) {
  const pts = members.map((m) => pos[m]).filter(Boolean);
  if (!pts.length) return null;
  const dash = dashed ? '5 4' : undefined;
  if (pts.length === 1) {
    return <circle cx={pts[0].x} cy={pts[0].y} r={R + 8} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={2.2} strokeDasharray={dash} />;
  }
  const d = `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={2 * (R + 8)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeDasharray="1 7" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={R + 8} fill="none" stroke={color} strokeWidth={2.2} strokeDasharray={dash} />)}
    </g>
  );
}

export type AudienceCirclesProps = {
  ledgers: CircleLedger[];
  parties: CircleParty[];
  /** Minimal key sets that open the sealed value, by party id. Empty: nothing sealed yet. */
  coalitions: string[][];
  /** Where the sealed value was written. */
  writtenIn?: string | null;
  epoch?: number;
  dashed?: boolean;
  caption?: string;
};

export default function AudienceCircles({ ledgers, parties, coalitions, writtenIn, epoch, dashed, caption }: AudienceCirclesProps) {
  const { centers, r, height } = ledgerLayout(ledgers.length);
  const pos = partyPositions(parties, ledgers, centers, height);
  const centroid = centers.reduce((a, c) => ({ x: a.x + c.x / centers.length, y: a.y + c.y / centers.length }), { x: 0, y: 0 });
  const active = new Set(coalitions.flat());
  const text = caption ?? (coalitions.length ? `opens: ${coalitions.map((c) => c.join('+')).join(' | ')}` : 'nothing sealed yet');
  const writtenAt = writtenIn ? ledgers.findIndex((l) => l.id === writtenIn) : -1;

  return (
    <svg viewBox={`0 6 ${W} ${height + 34}`} role="img" aria-label={text} style={{ width: '100%', maxWidth: W, height: 'auto', color: 'inherit', fontFamily: 'system-ui, sans-serif' }}>
      {ledgers.map((l, i) => {
        const c = centers[i];
        const hit = i === writtenAt;
        const down = l.up === false;
        const away = { x: c.x - centroid.x, y: c.y - centroid.y };
        const len = Math.hypot(away.x, away.y) || 1;
        const u = ledgers.length === 1 ? { x: 0, y: 1 } : { x: away.x / len, y: away.y / len };
        // the name sits OUTSIDE its circle, on the side facing away from the others
        const bottom = u.y > 0.5 && Math.abs(u.x) < 0.5;
        const lx = bottom ? c.x : c.x + (u.x < 0 ? -r + 6 : r - 6);
        const ly = bottom ? c.y + r + 20 : c.y - r - 18;
        const anchor = bottom ? 'middle' : u.x < 0 ? 'start' : 'end';
        return (
          <g key={l.id}>
            <circle cx={c.x} cy={c.y} r={r} fill="currentColor" fillOpacity={hit ? 0.08 : 0.025} stroke="currentColor"
              strokeOpacity={hit ? 0.85 : 0.3} strokeWidth={hit ? 2 : 1.2} strokeDasharray={hit ? undefined : '5 5'} />
            <text x={lx} y={ly} textAnchor={anchor} fontSize={12} fontWeight={700} fill="currentColor" fillOpacity={down ? 0.4 : 1}>
              ledger {l.id}{down ? ' · off' : ''} <tspan fontWeight={400} fontFamily="ui-monospace, Menlo, monospace" fontSize={10.5} fillOpacity={0.6}>{l.root}</tspan>
              {hit ? <tspan fontWeight={600} fill="currentColor" fillOpacity={0.9}>{`  🔒 sealed · epoch ${epoch ?? 1}`}</tspan> : null}
            </text>
          </g>
        );
      })}
      {coalitions.map((c, i) => <Coalition key={c.join('+')} members={c} pos={pos} color={COLORS[i % COLORS.length]} dashed={dashed} />)}
      {parties.map((p) => {
        const at = pos[p.id];
        const on = active.has(p.id);
        return (
          <g key={p.id}>
            <circle cx={at.x} cy={at.y} r={R} fill={on ? 'currentColor' : 'none'} fillOpacity={on ? 0.16 : 0} stroke="currentColor" strokeOpacity={on ? 0.9 : 0.4} strokeWidth={1.4} />
            <text x={at.x} y={at.y + 4} textAnchor="middle" fontSize={12} fontFamily="ui-monospace, Menlo, monospace" fill="currentColor" fillOpacity={on ? 1 : 0.6}>{p.id}</text>
          </g>
        );
      })}
      <text x={W / 2} y={height + 24} textAnchor="middle" fontSize={12.5} fontFamily="ui-monospace, Menlo, monospace" fill="currentColor">{text}</text>
    </svg>
  );
}
