import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '@/gui-internals/Contexts/ThemeContext';
import type { LLMSOp, LLMSExplain, LLMSExplainInput, LLMSGraphModel, LLMSLabels, LLMSNode, LLMSPart, LLMSProps } from './LLMS.types';
import { buildModel, canon, J, layout, linkPhrase, opTokens, parentOf, relOf, under, type GRow, type Model } from './model';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const DEFAULT_LABELS: Required<LLMSLabels> = {
  changed: '← you just changed this',
  recomputed: (i, t) => <>You changed <code>{i}</code>, so <code>{t}</code> recomputed on its own.</>,
  graph: 'state graph', zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset view', expand: 'Expand',
  applied: (n) => `${n} op${n === 1 ? '' : 's'} applied`,
};

interface Ctx {
  m: Model; props: LLMSProps; active: string[]; labels: Required<LLMSLabels>;
  rel: (k?: string) => '' | 'on' | 'rel';
  pinned: string | null;
  enter: (k: string, e: React.PointerEvent) => void; leave: (e: React.PointerEvent) => void; tap: (k: string) => void;
}
const LLMSContext = createContext<Ctx | null>(null);
const useLLMS = (): Ctx => { const c = useContext(LLMSContext); if (!c) throw new Error('LLMS parts must be inside <LLMS>'); return c; };

// colours: .GUI theme tokens (inside a .GUI <Theme>) or the page's --mui-palette-* / --me-syn-* variables
function useVars(mode: 'theme' | 'css' | undefined): React.CSSProperties {
  const th = useTheme(), gui = useContext(ThemeContext), css = mode ? mode === 'css' : !gui;
  const p = th.palette, mix = (a: string, n: number, b: string) => `color-mix(in srgb, ${a} ${n}%, ${b})`;
  const v = (n: string, fb: string) => (css ? `var(--mui-palette-${n}, ${fb})` : fb);
  const fg = v('text-primary', p.text.primary), syn = (r: string, base: string) => (css ? `var(--me-syn-${r}, ${mix(base, 78, fg)})` : mix(base, 78, fg));
  return {
    '--llms-fg': fg, '--llms-fg2': v('text-secondary', p.text.secondary), '--llms-grid': v('divider', p.divider),
    '--llms-acc': v('primary-main', p.primary.main), '--llms-bg': v('background-default', p.background.default),
    '--llms-paper': v('background-paper', p.background.paper), '--llms-ok': v('success-main', p.success.main),
    '--llms-path': syn('path', v('info-main', p.info.main)), '--llms-num': syn('number', v('warning-main', p.warning.main)),
    '--llms-der': syn('derived', v('secondary-main', p.secondary.main)), '--llms-str': syn('string', v('success-main', p.success.main)),
  } as React.CSSProperties;
}

const CSS = `
.llms{color:var(--llms-fg);font-size:14px;line-height:1.5;min-width:0}.llms *{box-sizing:border-box}
.llms-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));align-items:start}
.llms-phrase{font-size:1.02em;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.llms-w{cursor:pointer;border-radius:4px;padding:0 2px;margin:0 -2px;text-decoration:underline dotted color-mix(in srgb,var(--llms-acc) 55%,transparent);text-underline-offset:4px;transition:background .12s,color .12s}
.llms-w.on{background:color-mix(in srgb,var(--llms-acc) 24%,transparent);text-decoration-color:var(--llms-acc)}.llms-w.rel{background:color-mix(in srgb,var(--llms-acc) 10%,transparent)}
.llms-syn{margin:0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--llms-fg2) 9%,transparent);font:12.5px/1.65 ${MONO};white-space:pre-wrap;word-break:break-word;overflow-x:auto}
.llms-t[data-llms-k]{cursor:pointer;border-radius:3px;transition:background .12s,box-shadow .12s}.llms-t.on{background:color-mix(in srgb,var(--llms-acc) 26%,transparent);box-shadow:0 0 0 1px var(--llms-acc)}.llms-t.rel{background:color-mix(in srgb,var(--llms-acc) 10%,transparent)}
.llms-root{color:var(--llms-acc);font-weight:600}.llms-key{color:var(--llms-path)}.llms-op,.llms-def{color:var(--llms-der)}.llms-str{color:var(--llms-str)}.llms-num{color:var(--llms-num)}.llms-punc{color:var(--llms-fg2)}.llms-cm{color:var(--llms-fg2);font-style:italic}.llms-old{color:var(--llms-fg2);opacity:.55}.llms-res{color:var(--llms-der);font-weight:600}
.llms-sum{display:flex;align-items:center;gap:6px;width:100%;margin:0;padding:3px 8px;border:0;border-radius:8px;background:none;color:var(--llms-fg2);font:12px/1.5 ${MONO};cursor:pointer;text-align:left;transition:background .12s,color .12s}.llms-sum:hover,.llms-sum:focus-visible{background:color-mix(in srgb,var(--llms-fg2) 9%,transparent);color:var(--llms-fg)}
.llms-sum .llms-ar{display:inline-block;width:10px;transition:transform .15s}.llms-sum[aria-expanded=true] .llms-ar{transform:rotate(90deg)}.llms-sum .llms-ck{color:var(--llms-ok)}
.llms-sum.on{background:color-mix(in srgb,var(--llms-acc) 18%,transparent);color:var(--llms-fg)}.llms-sum.rel{background:color-mix(in srgb,var(--llms-acc) 8%,transparent)}
.llms-gw.pending path{stroke-dasharray:3 3;opacity:.55}.llms-gw.pending .llms-c{stroke-dasharray:2 1.5;fill:none}.llms-gw.pending .llms-gn text{opacity:.6;font-weight:500}.llms-gw.pending{border-style:dashed}
.llms-ln.focus{background:color-mix(in srgb,var(--llms-acc) 16%,transparent);box-shadow:-3px 0 0 var(--llms-acc);border-radius:2px}
.llms-in{font:inherit;color:var(--llms-num);background:var(--llms-paper);border:1px solid var(--llms-acc);border-radius:4px;padding:0 3px;margin:0 1px;width:7ch;min-width:3ch}
.llms-outp{margin:6px 0 0;font-size:12.5px;color:var(--llms-fg2)}.llms-fold{margin-top:4px}
.llms-gw{border-radius:10px;border:1px solid var(--llms-grid);position:relative;overflow:hidden}
.llms-gv{overflow:hidden;touch-action:none;cursor:grab;transition:height .2s}.llms-gv.drag{cursor:grabbing}.llms-gv.static{cursor:default;touch-action:manipulation}
.llms-gv svg{display:block;width:100%;height:100%;user-select:none;-webkit-user-select:none}.llms-gv text{font-family:${MONO};font-size:10.5px;fill:var(--llms-fg)}
.llms-gb{position:absolute;top:4px;right:4px;display:flex;gap:4px}
.llms-gbt{font:13px/1 ${MONO};width:26px;height:26px;padding:0;border-radius:8px;border:1px solid var(--llms-grid);background:var(--llms-paper);color:var(--llms-fg2);cursor:pointer;display:grid;place-items:center}.llms-gbt:hover,.llms-gbt.on{color:var(--llms-acc);border-color:var(--llms-acc)}
@media (pointer:coarse){.llms-gbt{width:32px;height:32px}}
.llms-gn{cursor:pointer}.llms-gn .llms-c{fill:var(--llms-paper);stroke-width:1.2;transition:stroke-width .12s,fill .12s}
.llms-gn text{font-weight:600;opacity:.88;paint-order:stroke;stroke-linejoin:round;stroke-width:0;transition:opacity .12s}
.llms-gn .llms-ring{opacity:0;fill:none;stroke:var(--llms-acc);stroke-width:1.6;transition:opacity .12s}
.llms-gn.on .llms-ring{opacity:1}.llms-gn.on .llms-c{stroke:var(--llms-acc);stroke-width:2.4;fill:color-mix(in srgb,var(--llms-acc) 40%,var(--llms-paper))}.llms-gn.rel .llms-c{stroke-width:1.9}
.llms-gn.on text,.llms-gn.rel text{opacity:1;stroke-width:7px}.llms-gn.on text{font-weight:700;stroke:color-mix(in srgb,var(--llms-acc) 30%,var(--llms-bg))}.llms-gn.rel text{stroke:color-mix(in srgb,var(--llms-acc) 12%,var(--llms-bg))}
.llms-gn.ch text{font-weight:700}
.llms-pulse{fill:none;stroke:var(--llms-acc);stroke-width:1.5;animation:llms-pulse 2.4s ease}@keyframes llms-pulse{0%,40%{r:10;opacity:1}100%{r:6.5;opacity:.5}}
.llms-xp{margin:8px 0 0}.llms-xp pre{margin:0;font:11.5px/1.6 ${MONO};color:var(--llms-fg2);white-space:pre;overflow-x:auto;padding:8px 10px;border-radius:10px;border:1px solid var(--llms-grid);border-left:3px solid var(--llms-der);background:var(--llms-paper)}
.llms-xr[data-llms-k]{cursor:pointer;border-radius:3px}.llms-xr.on{background:color-mix(in srgb,var(--llms-acc) 16%,transparent)}
.llms-xp-p{color:var(--llms-path)}.llms-xp-v{color:var(--llms-num)}.llms-xp-d{color:var(--llms-der);font-weight:600}.llms-xr.on .llms-xp-p,.llms-xr.on .llms-xp-v,.llms-xr.ch .llms-xp-p,.llms-xr.ch .llms-xp-v{color:var(--llms-acc);font-weight:600}.llms-xp-a{color:var(--llms-acc)}
.llms-xn{margin:6px 0 0;font-size:12px;color:var(--llms-fg2)}.llms-xn code{font-family:${MONO};color:var(--llms-path)}
.llms-fade{animation:llms-fade .4s ease both}@keyframes llms-fade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.llms-fade,.llms-pulse{animation:none}}@media (max-width:480px){.llms-xp pre{font-size:10.5px}.llms-syn{font-size:12px}}
`;

/** a linked element's props (data-llms-k + hover/tap wiring + on/rel class) */
function useLink(k: string | undefined, base: string) {
  const c = useLLMS();
  if (!k) return { className: base };
  const r = c.rel(k);
  return { className: r ? `${base} ${r}` : base, 'data-llms-k': k,
    onPointerEnter: (e: React.PointerEvent) => c.enter(k, e), onPointerLeave: c.leave, onClick: () => c.tap(k) };
}
const Linked = ({ k, cls, children }: { k?: string; cls: string; children: React.ReactNode }) => <span {...useLink(k, cls)}>{children}</span>;

/** The user's sentence; words that name a path link to it. */
function Phrase({ text, className }: { text?: string; className?: string }) {
  const c = useLLMS(), t = text ?? c.props.phrase ?? '';
  const toks = useMemo(() => linkPhrase(t, c.m), [t, c.m]);
  return <div className={`llms-phrase ${className ?? ''}`}>{toks.map((x, i) => (x.k ? <Linked key={i} k={x.k} cls="llms-w">{x.text}</Linked> : <React.Fragment key={i}>{x.text}</React.Fragment>))}</div>;
}

/** The ops as .me code, every path token linked. With `collapsed` (applied), code + output fold into one summary line. */
function writes(o: LLMSOp): string | null {
  const p = canon(o.path ?? '');
  if (o.op === 'define') return canon(`${p}.${o.name}`);
  if (o.op === 'remove') return canon(`${p}.${o.key}`);
  return o.op === 'query' || o.op === 'identity' ? null : p;
}
function EditVal({ v, onDone }: { v: unknown; onDone: (x: unknown) => void }) {
  const [t, setT] = useState(typeof v === 'string' ? v : JSON.stringify(v)), done = useRef(false);
  const commit = () => { if (done.current) return; done.current = true; const s = t.trim(); let x: unknown = s;
    if (typeof v !== 'string') { try { x = JSON.parse(s); } catch { x = s; } }
    if (JSON.stringify(x) !== JSON.stringify(v)) onDone(x); else done.current = false; };
  return <input className="llms-in" aria-label="edit value" value={t} size={Math.max(3, t.length + 1)} autoFocus
    onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') setT(typeof v === 'string' ? v : JSON.stringify(v)); }} onBlur={commit} />;
}
function Syntax({ className }: { className?: string }) {
  const c = useLLMS(), { props } = c, ops = props.ops ?? [], col = !!props.collapsed, pend = !!props.pending, [open, setOpen] = useState(false);
  const lines = useMemo(() => ops.map((o) => { const t = opTokens(o, c.m); if (!pend) return t;
    return t.filter((x, i) => x.r !== 'old' && x.r !== 'res' && !(x.r === 'punc' && x.t === '  → ' && t[i + 1]?.r === 'res')); }), [ops, c.m, pend]);
  const fp = props.focusPath ? canon(props.focusPath) : null;
  const fi = fp ? ops.findIndex((o) => writes(o) === fp) : -1;
  useEffect(() => { if (!col) setOpen(false); }, [col]);
  useEffect(() => { if (fi >= 0) setOpen(true); }, [fi, fp]);
  if (!lines.length) return null;
  const isOpen = open || !!props.expanded;
  const out = props.output != null && props.output !== false ? <div className="llms-outp">{props.output}</div> : null;
  const code = (
    <pre className={`llms-syn ${col ? '' : className ?? ''}`} aria-label=".me code">
      {lines.map((l, i) => { const foc = i === fi, ed = foc && ops[i].op === 'set' && props.onEditValue;
        return <React.Fragment key={i}>{i ? '\n' : ''}<span className={`llms-ln${foc ? ' focus' : ''}`} data-llms-op={i}>{l.map((t, j) => {
          if (ed && t.k === fp && (t.r === 'num' || t.r === 'str') && l[j - 1]?.t !== '[') return <EditVal key={`${j}-${J(ops[i].value)}`} v={ops[i].value} onDone={(x) => props.onEditValue!(i, x)} />;
          return <Linked key={j} k={t.k} cls={`llms-t llms-${t.r}`}>{t.t}</Linked>; })}</span></React.Fragment>; })}
    </pre>
  );
  if (!col) return out ? <>{code}{out}</> : code;
  // a highlighted token hidden inside the fold lights the summary instead
  let hl: '' | 'on' | 'rel' = '';
  if (!isOpen) for (const l of lines) for (const t of l) { const r = t.k ? c.rel(t.k) : ''; if (r === 'on') hl = 'on'; else if (r && !hl) hl = r; }
  return (
    <div className={`llms-col ${className ?? ''}`}>
      <button type="button" className={`llms-sum${hl ? ' ' + hl : ''}`} aria-expanded={isOpen} onClick={() => setOpen(!isOpen)}>
        <span className="llms-ar" aria-hidden>▸</span><span className="llms-ck" aria-hidden>✓</span><span>{c.labels.applied(ops.length)}</span>
      </button>
      {isOpen && <div className="llms-fold llms-fade">{code}{out}</div>}
    </div>
  );
}

type VB = [number, number, number, number];
/** The state graph: tree from the .me root; zoom (wheel / pinch / buttons), pan, reset, expand. */
function Graph({ height, className }: { height?: number; className?: string }) {
  const c = useLLMS(), { props } = c, [big, setBig] = useState(false);
  const model: LLMSGraphModel | undefined = big && props.expandedGraph ? props.expandedGraph : props.graph;
  const L = useMemo(() => layout(model?.nodes ?? []), [model]);
  const stat = props.graphMode === 'static', g0 = height ?? props.graphHeight ?? 180, h0 = stat ? Math.min(g0, Math.round(L.H + 40)) : g0, h = big ? Math.round(h0 * 1.9) : h0;
  const box = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<[number, number]>([320, h0]);
  useLayoutEffect(() => { const el = box.current; if (!el) return; const f = () => setSize([el.clientWidth || 320, el.clientHeight || h]); f();
    if (typeof ResizeObserver === 'undefined') return; const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, [h]);
  // start zoomed out: fit with padding; when that leaves labels at full size, center the .me root instead
  const fit = useMemo<VB>(() => { const [cw, ch] = size, px = 18, py = 12, bx = 0, by = 0, bw = L.W, bh = L.H;
    const hx = Math.max(L.rx - bx, bx + bw - L.rx) + px, hy = Math.max(L.ry - by, by + bh - L.ry) + py, sc = Math.min(cw / (2 * hx), ch / (2 * hy));
    return sc >= 1 && !stat ? [L.rx - hx, L.ry - hy, 2 * hx, 2 * hy] : [bx - px, by - py, bw + 2 * px, bh + 2 * py]; }, [L, size, stat]);
  const [vb, setVb] = useState<VB>(fit); const vbR = useRef(vb); vbR.current = vb;
  useEffect(() => { setVb(fit); }, [fit]);
  const zoom = useCallback((f: number, cx?: number, cy?: number) => { const s = svg.current; if (!s) return; const r = s.getBoundingClientRect(), v = vbR.current;
    // preserveAspectRatio meet: map client px into the viewBox through the same uniform scale
    const sc = Math.max(v[2] / r.width, v[3] / r.height), ox = v[0] + v[2] / 2 - (r.width * sc) / 2, oy = v[1] + v[3] / 2 - (r.height * sc) / 2;
    const px = cx === undefined ? v[0] + v[2] / 2 : ox + (cx - r.left) * sc, py = cy === undefined ? v[1] + v[3] / 2 : oy + (cy - r.top) * sc;
    const w = Math.max(fit[2] / 8, Math.min(fit[2] * 4, v[2] * f)), k = w / v[2];
    setVb([px - (px - v[0]) * k, py - (py - v[1]) * k, w, v[3] * k]); }, [fit]);
  // wheel needs a non-passive listener
  useEffect(() => { const el = box.current; if (!el || stat) return; const w = (e: WheelEvent) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY); };
    el.addEventListener('wheel', w, { passive: false }); return () => el.removeEventListener('wheel', w); }, [zoom, stat]);
  const pts = useRef<Record<number, [number, number]>>({}), moved = useRef(0), dist = useRef(0), [drag, setDrag] = useState(false);
  const down = (e: React.PointerEvent) => { pts.current[e.pointerId] = [e.clientX, e.clientY]; moved.current = 0; dist.current = 0; };
  const move = (e: React.PointerEvent) => { const P = pts.current, prev = P[e.pointerId]; if (!prev) return; P[e.pointerId] = [e.clientX, e.clientY]; const ids = Object.keys(P);
    if (ids.length === 2) { const a = P[+ids[0]], b = P[+ids[1]], nd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dist.current) zoom(dist.current / nd, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dist.current = nd; moved.current += 10; return; }
    const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved.current += Math.abs(dx) + Math.abs(dy); if (moved.current < 5) return;
    if (!drag) { setDrag(true); try { box.current?.setPointerCapture(e.pointerId); } catch { /* */ } }
    const s = svg.current; if (!s) return; const r = s.getBoundingClientRect(), v = vbR.current, sc = Math.max(v[2] / r.width, v[3] / r.height);
    setVb([v[0] - dx * sc, v[1] - dy * sc, v[2], v[3]]); };
  const up = (e: React.PointerEvent) => { delete pts.current[e.pointerId]; dist.current = 0; setDrag(false); };
  const Y = (r: GRow) => 12 + r.y * L.RH, X = (d: number) => L.X[d];
  const P = useMemo(() => new Map(L.rows.map((r) => [r.p, r])), [L]);
  const edges = useMemo(() => { const out: { from: string; to: string }[] = []; c.m.deps.forEach((fs, t) => fs.forEach((f) => out.push({ from: f, to: t }))); return out; }, [c.m]);
  const derived = (r: GRow) => !!r.node && (r.node.derived || c.m.deps.has(r.p) || c.m.explains.has(r.p));
  const tapNode = (r: GRow) => { if (moved.current >= 5) return; if (r.p) c.tap(r.p); props.onNodeClick?.(r.p, r.node); };
  let Wx = L.W;
  const depPaths = edges.map((e, i) => { const a = P.get(canon(e.from)), b = P.get(canon(e.to)); if (!a || !b) return null; const ax = L.tx(a), bx = L.tx(b), cx = Math.max(ax, bx) + 22; Wx = Math.max(Wx, cx + 6);
    return <path key={`d${i}`} d={`M${ax} ${Y(a)} C${cx} ${Y(a)} ${cx} ${Y(b)} ${bx} ${Y(b)}`} fill="none" stroke="var(--llms-der)" strokeDasharray="3 3" strokeWidth={1.2} opacity={0.8} />; });
  return (
    <div className={`llms-gw${props.pending ? ' pending' : ''} ${className ?? ''}`}>
      <div ref={box} className={`llms-gv${drag ? ' drag' : ''}${stat ? ' static' : ''}`} style={{ height: h }} {...(stat ? {} : { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up })}>
        <svg ref={svg} viewBox={vb.map((n) => n.toFixed(1)).join(' ')} role="img" aria-label={c.labels.graph}>
          {L.rows.map((r) => { if (r.p === '' ) return null; const par = P.get(parentOf(r.p) ?? '') ?? P.get('')!;
            return <path key={`e${r.p}`} d={`M${X(par.d) + 5} ${Y(par)} C${X(r.d) - 22} ${Y(par)} ${X(r.d) - 22} ${Y(r)} ${X(r.d) - 4} ${Y(r)}`} fill="none" stroke="var(--llms-grid)" strokeWidth={1.3} />; })}
          {depPaths}
          {L.rows.map((r) => <GNode key={`n${r.p}`} r={r} x={X(r.d)} y={Y(r)} der={derived(r)} ch={!props.pending && c.m.changed.has(r.p)} val={props.pending ? '' : L.val(r)} onTap={() => tapNode(r)} />)}
        </svg>
      </div>
      {!stat && <div className="llms-gb">
        <button type="button" className="llms-gbt" title={c.labels.zoomIn} aria-label={c.labels.zoomIn} onClick={() => zoom(1 / 1.35)}>+</button>
        <button type="button" className="llms-gbt" title={c.labels.zoomOut} aria-label={c.labels.zoomOut} onClick={() => zoom(1.35)}>−</button>
        <button type="button" className="llms-gbt" title={c.labels.reset} aria-label={c.labels.reset} onClick={() => setVb(fit)}>⟲</button>
        <button type="button" className={`llms-gbt${big ? ' on' : ''}`} title={c.labels.expand} aria-label={c.labels.expand} aria-pressed={big} onClick={() => setBig(!big)}>⤢</button>
      </div>}
    </div>
  );
}

function GNode({ r, x, y, der, ch, val, onTap }: { r: GRow; x: number; y: number; der: boolean; ch: boolean; val: string; onTap: () => void }) {
  const c = useLLMS(), root = r.p === '';
  const rel = root ? '' : c.rel(r.p), col = root ? 'var(--llms-acc)' : der ? 'var(--llms-der)' : r.node ? 'var(--llms-num)' : 'var(--llms-acc)';
  return (
    <g className={`llms-gn${rel ? ' ' + rel : ''}${ch ? ' ch' : ''}`} data-llms-k={root ? undefined : r.p}
      onPointerEnter={root ? undefined : (e) => c.enter(r.p, e)} onPointerLeave={root ? undefined : c.leave} onClick={onTap}>
      {ch && <circle className="llms-pulse" cx={x} cy={y} r={6.5} />}
      <circle className="llms-ring" cx={x} cy={y} r={7.5} />
      <circle className="llms-c" cx={x} cy={y} r={root ? 5 : 3.5} stroke={col} />
      <text x={x + 9} y={y + 3.6} style={root ? { fill: 'var(--llms-acc)' } : undefined}>{r.k}{r.node && val ? <tspan fill={col}>{' ' + val}</tspan> : null}</text>
    </g>
  );
}

/** me.explain() for the active path: the derived path, or the formula an input feeds, or the value itself. */
function Explain({ className }: { className?: string }) {
  const c = useLLMS(), { m } = c;
  const pick = useMemo((): { x?: LLMSExplain; p?: string } => {
    for (const k of c.active) {
      if (m.explains.has(k)) return { x: m.explains.get(k) };
      for (const [t, fs] of m.deps) if (fs.some((f) => f === k || under(f, k)) && m.explains.has(t)) return { x: m.explains.get(t) };
      for (const [t, fs] of m.deps) if (fs.some((f) => f === k || under(f, k)) && m.nodes.has(t)) return { p: t };
      if (m.nodes.has(k) || Array.from(m.nodes.keys()).some((n) => under(n, k))) return { p: k };
    }
    return { x: m.explainList[0] };
  }, [c.active, m]);
  if (c.props.pending || (c.props.explainOnSelect && !c.pinned)) return null;
  if (!pick.x && !pick.p) return null;
  if (!pick.x || !pick.x.expr) { const p = canon(pick.x?.path ?? pick.p!), n = m.nodes.get(p), v = pick.x ? pick.x.value : n?.value;
    return <div className={`llms-xp llms-fade ${className ?? ''}`} key={p}><pre><Linked k={p} cls="llms-xr"><span className="llms-xp-p">{p}</span> = <span className="llms-xp-v">{n?.masked ? '●●●' : J(v)}</span></Linked></pre></div>; }
  const x = pick.x, t = canon(x.path), base = parentOf(t) ?? '', rl = (q: string) => (base && q.startsWith(base + '.') ? q.slice(base.length + 1) : q);
  const ins: LLMSExplainInput[] = x.derivation?.inputs ?? (x.meta?.dependsOn ?? []).map((p) => ({ path: p, value: m.nodes.get(canon(p))?.value }));
  const w = ins.reduce((mx, i) => Math.max(mx, rl(canon(String(i.path))).length), 0);
  let chg: string | null = null;
  return (
    <div className={`llms-xp llms-fade ${className ?? ''}`} key={t}>
      <pre>
        <Linked k={t} cls="llms-xr"><span className="llms-xp-p">{t}</span> = <span className="llms-xp-d">{J(x.value)}</span></Linked>{'\n  ← '}<span className="llms-xp-p">{x.expr}</span>
        {ins.map((i) => { const k = canon(String(i.path)), r = rl(k), on = m.changed.has(k); if (on && !chg) chg = r;
          return <React.Fragment key={k}>{'\n'}<Linked k={k} cls={`llms-xr${on ? ' ch' : ''}`}>{'      '}<span className="llms-xp-p">{r}</span>{' '.repeat(w - r.length + 2)}<span className="llms-xp-v">{i.masked || i.stealth ? '●●●' : J(i.value)}</span>{on ? <span className="llms-xp-a">{'   ' + c.labels.changed}</span> : null}</Linked></React.Fragment>; })}
      </pre>
      {chg ? <p className="llms-xn">{c.labels.recomputed(chg, rl(t))}</p> : null}
    </div>
  );
}

/** Provider only: share one active path between LLMS.Phrase / Syntax / Graph / Explain placed anywhere inside. */
function Provider(props: LLMSProps) {
  const { phrase, ops, graph, expandedGraph, explain, changed, aliases, activePath, onHoverPath, onPinPath, onActivePath } = props;
  const m = useMemo(() => buildModel(graph, explain, changed, ops, aliases, expandedGraph), [graph, explain, changed, ops, aliases, expandedGraph]);
  void phrase;
  const controlled = activePath !== undefined, [hov, setHov] = useState<string | null>(null), [pin, setPin] = useState<string | null>(null);
  const touch = useRef(false), rootEl = useRef<HTMLDivElement>(null);
  const eff = controlled ? activePath : hov ?? pin;
  const active = useMemo(() => (eff ? eff.split(' ').filter(Boolean) : []), [eff]);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } onActivePath?.(eff ?? null); }, [eff]); // eslint-disable-line react-hooks/exhaustive-deps
  const enter = useCallback((k: string, e: React.PointerEvent) => { if (e.pointerType === 'touch') { touch.current = true; return; } touch.current = false; if (controlled) onHoverPath?.(k); else setHov(k); }, [controlled, onHoverPath]);
  const leave = useCallback((e: React.PointerEvent) => { if (e.pointerType === 'touch') return; if (controlled) onHoverPath?.(null); else setHov(null); }, [controlled, onHoverPath]);
  const tap = useCallback((k: string) => { if (controlled) { onPinPath?.(k); return; } setPin((p) => (p === k ? null : k)); if (touch.current) setHov(null); }, [controlled, onPinPath]);
  // tap outside any linked element (and outside a graph viewport, where it pans) clears the pin
  useEffect(() => { if (controlled) return; const f = (e: PointerEvent) => { const t = e.target as Element | null; touch.current = e.pointerType === 'touch';
    if (!t?.closest || t.closest('[data-llms-k]') || t.closest('.llms-gv,.llms-gb')) return; setPin(null); };
    document.addEventListener('pointerdown', f); return () => document.removeEventListener('pointerdown', f); }, [controlled]);
  const rel = useCallback((k?: string) => { const r = relOf(m, k, active); return r === 2 ? 'on' : r === 1 ? 'rel' : ''; }, [m, active]) as Ctx['rel'];
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...(props.labels ?? {}) }), [props.labels]);
  const vars = useVars(props.colors);
  const pinned = controlled ? props.pinnedPath ?? null : pin;
  const ctx = useMemo<Ctx>(() => ({ m, props, active, pinned, labels, rel, enter, leave, tap }), [m, props, active, pinned, labels, rel, enter, leave, tap]);
  return (
    <LLMSContext.Provider value={ctx}>
      <div ref={rootEl} className={`llms ${props.className ?? ''}`} style={{ ...vars, ...props.style }}>
        <style>{CSS}</style>
        {props.children}
      </div>
    </LLMSContext.Provider>
  );
}

const ALL: LLMSPart[] = ['phrase', 'syntax', 'graph', 'explain'];
/**
 * LLMS — how a sentence becomes .me: the phrase, the ops as .me code, the state graph and me.explain(),
 * sharing one active path (hover / tap any word, token, node or explain row and its matches light up everywhere).
 */
function LLMSRoot(props: LLMSProps) {
  if (props.children) return <Provider {...props} />;
  const parts = props.parts ?? ALL, has = (p: LLMSPart) => parts.includes(p) && (p !== 'phrase' || !!props.phrase) && (p !== 'syntax' || !!props.ops?.length) && (p !== 'graph' || !!props.graph?.nodes.length);
  const left = has('syntax') || (has('phrase') && !has('graph') && !has('explain'));
  const right = has('graph') || has('explain');
  return (
    <Provider {...props}>
      {has('phrase') && <Phrase />}
      <div className="llms-grid" style={{ marginTop: has('phrase') ? 10 : 0 }}>
        {left && has('syntax') && <div style={{ minWidth: 0 }}><Syntax /></div>}
        {right && <div style={{ minWidth: 0 }}>{has('graph') && <Graph />}{has('explain') && <Explain />}</div>}
      </div>
    </Provider>
  );
}

type LLMSComponent = typeof LLMSRoot & { Provider: typeof Provider; Phrase: typeof Phrase; Syntax: typeof Syntax; Graph: typeof Graph; Explain: typeof Explain };
export const LLMS = Object.assign(LLMSRoot, { Provider, Phrase, Syntax, Graph, Explain }) as LLMSComponent;
export type { LLMSNode };
export default LLMS;
