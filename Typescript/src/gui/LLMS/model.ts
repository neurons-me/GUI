import type { LLMSExplain, LLMSGraphModel, LLMSNode, LLMSOp } from './LLMS.types';

/** "a.b[1].c" -> ["a","b","1","c"] */
export const segs = (p: string): string[] => String(p ?? '').replace(/\[(\w+)\]/g, '.$1').split('.').filter(Boolean);
/** canonical path: numeric segments as [n] */
export const canon = (p: string): string => segs(p).reduce((a, s, i) => (/^\d+$/.test(s) && i ? `${a}[${s}]` : a ? `${a}.${s}` : s), '');
export const parentOf = (p: string): string | null => { const i = Math.max(p.lastIndexOf('.'), p.lastIndexOf('[')); return i < 0 ? null : p.slice(0, i); };
export const under = (b: string, a: string) => b.startsWith(a + '.') || b.startsWith(a + '[');

/** accent-insensitive fold, one code unit per code unit so offsets map back (menú = menu, café = cafe) */
export const fold = (t: string): string => String(t).split('').map((c) => {
  const n = c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return n.length === 1 ? n : c.toLowerCase().length === 1 ? c.toLowerCase() : c;
}).join('');

export const J = (v: unknown): string => (v === undefined ? '∅' : v !== null && typeof v === 'object' && !Array.isArray(v) ? '{ … }' : JSON.stringify(v));

export const asList = <T,>(x: T | T[] | undefined | null): T[] => (x == null ? [] : Array.isArray(x) ? x : [x]);

export interface Model {
  nodes: Map<string, LLMSNode>;
  /** derived path -> its inputs */
  deps: Map<string, string[]>;
  explains: Map<string, LLMSExplain>;
  explainList: LLMSExplain[];
  changed: Set<string>;
  /** folded word -> paths */
  words: Map<string, Set<string>>;
}

export function buildModel(graph: LLMSGraphModel | undefined, explain: LLMSExplain | LLMSExplain[] | undefined, changed: string[] | undefined,
  ops: LLMSOp[] | undefined, aliases?: Record<string, string | string[]>, extra?: LLMSGraphModel): Model {
  const nodes = new Map<string, LLMSNode>(), deps = new Map<string, string[]>(), explains = new Map<string, LLMSExplain>();
  const addDep = (f: string, t: string) => { f = canon(f); t = canon(t); const l = deps.get(t) ?? []; if (!l.includes(f)) l.push(f); deps.set(t, l); };
  [graph, extra].forEach((g) => {
    (g?.nodes ?? []).forEach((n) => { const p = canon(n.path); if (!nodes.has(p) || g === graph) nodes.set(p, { ...n, path: p }); });
    (g?.edges ?? []).forEach((e) => addDep(e.from, e.to));
  });
  const explainList = asList(explain).filter(Boolean);
  explainList.forEach((x) => {
    const t = canon(x.path); explains.set(t, x);
    (x.meta?.dependsOn ?? []).forEach((f) => addDep(f, t));
    (x.derivation?.inputs ?? []).forEach((i) => addDep(String(i.path), t));
  });
  // ops: written paths / defined targets also count as known paths for linking
  const known = new Set<string>(nodes.keys());
  (ops ?? []).forEach((o) => {
    if (o.op === 'set' && o.path) known.add(canon(o.path));
    if (o.op === 'define' && o.path && o.name) known.add(canon(`${o.path}.${o.name}`));
  });
  const words = new Map<string, Set<string>>();
  const add = (w: string, k: string) => { w = fold(String(w).trim()); if (w.length < 2 || /^\d$/.test(w)) return; (words.get(w) ?? words.set(w, new Set()).get(w)!).add(k); };
  known.forEach((p) => {
    let pre = '';
    segs(p).forEach((sg, i) => {
      pre = i ? (/^\d+$/.test(sg) ? `${pre}[${sg}]` : `${pre}.${sg}`) : sg;
      if (/^\d+$/.test(sg)) return;
      add(sg, pre); if (sg.includes('_')) add(sg.replace(/_/g, ' '), pre);
    });
    const v = nodes.get(p)?.value;
    if (!nodes.get(p)?.masked) {
      if (typeof v === 'string' || typeof v === 'number') add(String(v), p);
      if (Array.isArray(v)) v.forEach((x) => typeof x === 'string' && add(x, p));
    }
  });
  Object.entries(aliases ?? {}).forEach(([w, ps]) => asList(ps).forEach((p) => add(w, canon(p))));
  return { nodes, deps, explains, explainList, changed: new Set((changed ?? []).map(canon)), words };
}

/** 2 = same path, 1 = ancestor/descendant or a direct dependency, 0 = unrelated */
export function relK(m: Model, b: string, a: string): number {
  if (a === b) return 2;
  if (a && b && (under(b, a) || under(a, b))) return 1;
  return (m.deps.get(a) ?? []).includes(b) || (m.deps.get(b) ?? []).includes(a) ? 1 : 0;
}

export function relOf(m: Model, key: string | undefined, active: string[]): number {
  if (!key || !active.length) return 0;
  let r = 0;
  key.split(' ').forEach((b) => active.forEach((a) => { r = Math.max(r, relK(m, b, a)); }));
  return r;
}

export interface PhraseToken { text: string; k?: string }
/** split a phrase into plain text and linked words: explicit [word|path] marks, then accent-insensitive matches */
export function linkPhrase(text: string, m: Model): PhraseToken[] {
  const out: PhraseToken[] = [];
  const ws = Array.from(m.words.keys()).sort((a, b) => b.length - a.length);
  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const auto = (s: string) => {
    if (!ws.length) { out.push({ text: s }); return; }
    const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${ws.map(esc).join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
    const f = fold(s); let last = 0, mm: RegExpExecArray | null;
    while ((mm = re.exec(f))) {
      const st = mm.index + mm[1].length;
      if (st > last) out.push({ text: s.slice(last, st) });
      out.push({ text: s.substr(st, mm[2].length), k: Array.from(m.words.get(mm[2])!).join(' ') });
      last = st + mm[2].length; re.lastIndex = last;
    }
    if (last < s.length) out.push({ text: s.slice(last) });
  };
  const mark = /\[([^\]|]+)\|([^\]]+)\]/g; let last = 0, mm: RegExpExecArray | null;
  while ((mm = mark.exec(text))) {
    if (mm.index > last) auto(text.slice(last, mm.index));
    out.push({ text: mm[1], k: mm[2].trim().split(/\s+/).map(canon).join(' ') });
    last = mm.index + mm[0].length;
  }
  if (last < text.length) auto(text.slice(last));
  return out;
}

export type SynRole = 'root' | 'key' | 'op' | 'str' | 'num' | 'def' | 'punc' | 'cm' | 'id';
export interface SynToken { t: string; r: SynRole; k?: string }

/** one .me code line per op, tokenized with the path each token stands for */
export function opTokens(o: LLMSOp, m: Model): SynToken[] {
  const T: SynToken[] = [];
  const P = (p: string) => { T.push({ t: 'me', r: 'root' }); let pre = '';
    segs(p).forEach((s, i) => { const num = /^\d+$/.test(s); pre = i ? (num ? `${pre}[${s}]` : `${pre}.${s}`) : s;
      if (num) { T.push({ t: '[', r: 'punc' }, { t: s, r: 'num', k: pre }, { t: ']', r: 'punc' }); } else T.push({ t: '.', r: 'punc' }, { t: s, r: 'key', k: pre }); }); };
  const Q = (v: unknown, k?: string) => T.push({ t: JSON.stringify(v) ?? 'undefined', r: typeof v === 'number' || typeof v === 'boolean' ? 'num' : 'str', k });
  const op = (s: string) => T.push({ t: '[', r: 'punc' }, { t: JSON.stringify(s), r: 'op' }, { t: '](', r: 'punc' });
  const path = canon(o.path ?? '');
  switch (o.op) {
    case 'set': P(path); T.push({ t: '(', r: 'punc' }); Q(o.value, path); T.push({ t: ')', r: 'punc' }); break;
    case 'define': {
      const tgt = canon(`${path}.${o.name}`); P(path); op('='); Q(o.name, tgt); T.push({ t: ', ', r: 'punc' }, { t: '"', r: 'def' });
      const known = (q: string) => m.nodes.has(q) || Array.from(m.nodes.keys()).some((n) => under(n, q)) || (m.deps.get(tgt) ?? []).includes(q);
      String(o.expr ?? '').split(/([\p{L}_][\p{L}\p{N}_]*(?:(?:\.[\p{L}_][\p{L}\p{N}_]*)|(?:\[\d+\]))*|\d+(?:\.\d+)?)/u).forEach((piece) => {
        if (!piece) return;
        if (/^\d/.test(piece)) T.push({ t: piece, r: 'num' });
        else if (/^[\p{L}_]/u.test(piece)) { const c = [canon(`${path}.${piece}`), canon(piece)].find(known); T.push({ t: piece, r: 'def', k: c }); }
        else T.push({ t: piece, r: 'def' });
      });
      T.push({ t: '"', r: 'def' }, { t: ')', r: 'punc' }); break; }
    case 'pointer': P(path); op('->'); Q(canon(o.target ?? ''), canon(o.target ?? '')); T.push({ t: ')', r: 'punc' }); break;
    case 'remove': P(path); op('-'); Q(String(o.key), canon(`${path}.${o.key}`)); T.push({ t: ')', r: 'punc' }); break;
    case 'secret': case 'noise': P(path); op(o.op === 'secret' ? '_' : '~'); T.push({ t: '/* your key */', r: 'cm' }, { t: ')', r: 'punc' }); break;
    case 'identity': T.push({ t: 'me', r: 'root' }); op('@'); Q(o.handle); T.push({ t: ')', r: 'punc' }); break;
    case 'query': (o.paths ?? []).forEach((p, i) => { if (i) T.push({ t: '\n', r: 'punc' }); T.push({ t: 'me', r: 'root' }, { t: '(', r: 'punc' }); Q(canon(p), canon(p)); T.push({ t: ')', r: 'punc' }); }); break;
    default: T.push({ t: `// ${JSON.stringify(o)}`, r: 'cm' });
  }
  return T;
}

// ── graph layout (the /.me/LLMS/Meta tree: root .me, columns by depth, rows per leaf) ──
export interface GRow { p: string; k: string; d: number; y: number; node?: LLMSNode; kids: number }
export interface GLayout { rows: GRow[]; X: number[]; W: number; H: number; rx: number; ry: number; RH: number; CH: number; tx: (r: GRow) => number; val: (r: GRow) => string }

export function layout(nodes: LLMSNode[]): GLayout {
  type T = { k: string; c: Record<string, T>; order: string[]; leaf?: LLMSNode; y?: number; d?: number; p?: string };
  const root: T = { k: '.me', c: {}, order: [] };
  nodes.forEach((lf) => { const ss = segs(lf.path); let n = root;
    ss.forEach((s, i) => { if (!n.c[s]) { n.c[s] = { k: /^\d+$/.test(s) ? `${ss[i - 1] ?? ''}[${s}]` : s, c: {}, order: [] }; n.order.push(s); } n = n.c[s]; });
    n.leaf = lf; });
  const rows: GRow[] = []; let y = 0;
  const lay = (n: T, d: number, pre: string) => { n.order.forEach((s) => { const c = n.c[s], p = pre ? (/^\d+$/.test(s) ? `${pre}[${s}]` : `${pre}.${s}`) : s;
    if (c.order.length) { const y0 = y; lay(c, d + 1, p); c.y = (y0 + y - 1) / 2; } else c.y = y++;
    rows.push({ p, k: c.k, d, y: c.y!, node: c.leaf, kids: c.order.length }); }); };
  lay(root, 1, '');
  const ry = Math.max(0, (y - 1) / 2);
  rows.push({ p: '', k: '.me', d: 0, y: ry, kids: root.order.length });
  const RH = 22, CH = 6.4, XS: number[] = [12, 0];
  rows.forEach((r) => { if (r.kids) XS[r.d + 1] = Math.max(XS[r.d + 1] ?? 0, r.k.length); });
  for (let q = 1; q < XS.length; q++) XS[q] = XS[q - 1] + 34 + CH * (XS[q] ?? 0);
  const val = (r: GRow) => (r.node?.masked ? '●●●' : String(J(r.node?.value)).slice(0, 22));
  const tx = (r: GRow) => XS[r.d] + 10 + CH * (r.k.length + (r.node ? 1 + val(r).length : 0));
  const W = rows.reduce((mx, r) => Math.max(mx, tx(r) + 10), 120);
  return { rows, X: XS, W, H: Math.max(1, y) * RH + 8, rx: XS[0], ry: 12 + ry * RH, RH, CH, tx, val };
}
