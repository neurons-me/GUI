import React from 'react';
import { getContrastRatio } from '@mui/material/styles';
import { Avatar, Box, Typography } from '@/gui/Atoms';
import Icon from '@/gui/Atoms/Icon/Icon';
import { useGuiTheme } from '@/gui-internals/Hooks';
import QR, { getQrModuleCount, snapQrCellSize } from '../QR';
import PixelWordmark from './PixelWordmark';
import { ME_WORDMARK_EMBED_BITMAP } from './meMark';

// Must match the ecc/quietZone actually passed to <QR> below — this is
// what decides how many modules a given value needs, which is exactly
// what MIN_PX_PER_MODULE below is sizing against.
const QR_ECC = 'H' as const;
const QR_QUIET_ZONE_MODULES = 1;
// Investigated live (2026-09-16): a phone camera read local.cleaker's QR
// fine with a short value, stopped recognizing it once a longer value (a
// username appended) pushed qrcode-generator into a denser QR version at
// the same fixed rendered size. Confirmed with an independent decoder
// (jsQR) against real browser-rendered SVG output — not ECC corruption,
// not the circular clip (that remained unresolved either way): a
// fractional pixel-per-module cell picks up real anti-aliasing blur from
// the browser's own SVG rasterizer, and snapping to a whole-pixel cell
// (snapQrCellSize, in QR.tsx) fixed the plain/undecorated case in that
// test. MIN_PX_PER_MODULE is the floor passed into that snap — it keeps
// growing the rendered size for a longer `value` rather than allowing an
// ever-smaller whole-pixel cell.
const MIN_PX_PER_MODULE = 4;
// Approximates qrInset's own 0.015 ratio below to size UP from a required
// qrSize to the diameter that would produce it, before effectiveDiameter
// itself exists yet. Only ever used as a starting point for
// snapQrCellSize's floor/ceiling math — the actual qrInset/qrSize/
// effectiveDiameter triple computed below is what's authoritative and
// self-consistent, this is just how big a diameter to ask it for.
const QR_INSET_RATIO = 0.015;
// φ -- used to derive the status dot's own size and its gap from the
// perimeter text, instead of the independent, unrelated-looking constants
// (radius 0.32x, gap "+3px") those had before. Flagged live as reading
// "amontonado" (cramped) and unaligned, not just eyeballed-too-small: a
// dot sized and spaced by a single consistent ratio to the text around it
// reads as one deliberate unit instead of an icon dropped in afterward.
const GOLDEN_RATIO = 1.618;

export type QRmeProps = {
  value: string;
  username?: string;
  avatarSrc?: string;
  avatarAlt?: string;
  avatarFallback?: string;
  variant?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'topbar';
  diameter?: number;
  size?: number;
  bg?: string;
  fg?: string;
  defaultFace?: 'qr' | 'avatar';
  hoverFlip?: boolean;
  clickFlip?: boolean;
  /**
   * Overrides the hover cursor QRme would otherwise pick on its own
   * (`clickFlip ? 'pointer' : 'default'`). Needed when a CALLER wraps this
   * component in its own click handler (e.g. CleakerLanding's bubble,
   * which toggles size rather than using QRme's own flip-to-avatar) --
   * without this, QRme's own root element still carries its
   * clickFlip-driven `cursor: 'default'`, which wins over the wrapper's
   * `cursor: 'pointer'` and silently kills the hand cursor a person
   * expects over anything clickable. Omit to keep the existing
   * clickFlip-tied default (e.g. monad.ai.tsx's purely decorative QR,
   * which is correctly non-interactive).
   */
  cursor?: React.CSSProperties['cursor'];
  showAvatarLabel?: boolean;
  /**
   * Connection-verification state for whatever `value` currently points
   * at -- 'checking'/'error' recolor the ring+ink to warning/error theme
   * tones and are appended to the accessible label via `statusLabel`;
   * 'confirmed' (or omitting `status` entirely, the default 'idle') keeps
   * the QR's own normal color. Purely additive: every existing caller that
   * doesn't pass `status` renders exactly as before.
   */
  status?: 'idle' | 'checking' | 'confirmed' | 'error';
  /** Accessible text describing `status` (e.g. "Verificando local.cleaker…"). */
  statusLabel?: string;
  /**
   * The namespace/expression this QR is currently positioned at (e.g.
   * "local.cleaker", or "agent-x.local.cleaker" once claimed) -- drawn as
   * read-only curved text hugging the QR's own bottom and right edges,
   * colored by `status` the same way the ring already is. Flagged live as
   * the fix for a plain caption sitting well below the QR, reading as a
   * second, disconnected thing rather than part of it. Starts on the
   * bottom edge (just past the bottom-left corner) and wraps around the
   * bottom-right corner up the right edge -- ONLY these two edges,
   * confirmed live as the two that render upright/legible with plain SVG
   * textPath (the top and left edges don't, no matter the corner
   * geometry -- see buildPerimeterPath's own comment). Text longer than
   * these two edges combined is simply not drawn past the path's end,
   * which is the "cut the string" behavior wanted here, not an ellipsis
   * this component computes itself. Purely decorative text, not a
   * control: switching/connecting to a different expression stays
   * whatever real control the caller provides elsewhere (e.g. shown on
   * click), never this label itself.
   */
  perimeterLabel?: string;
  /**
   * The bare root namespace (e.g. "local.cleaker") that `perimeterLabel`
   * ends with -- when this matches the tail of `perimeterLabel`, that
   * trailing portion is drawn bold and colored by `status`/the ring's own
   * accent (ringAccent) instead of the rest of the label's plain
   * treatment. The root is what actually answers "which namespace is
   * this," so it's the part that should carry the connection-status
   * color. Omit to draw the whole label in the plain, non-status
   * treatment (e.g. pre-auth, where `perimeterLabel` already IS just the
   * root).
   */
  perimeterRootLabel?: string;
  /**
   * If set, the handle portion of `perimeterLabel` (everything before
   * `perimeterRootLabel`) is wrapped in a real link to this URL, opened
   * in a new tab -- the same "visit this .me" pattern the directory
   * search already uses (`buildCleakerNamespaceUrl` + `window.open`,
   * see CleakerLanding.tsx's own `visitUser`), just reachable from your
   * own identity's QR too. Uses the theme's `secondary` color regardless
   * of whether this is set -- a username is its own kind of thing, not
   * tied to the root's connection-status color -- but only becomes an
   * actual `<a>` (pointer cursor, real navigation) when a URL is given;
   * otherwise it's the same plain decorative text as the rest of the
   * label, just colored differently.
   */
  perimeterHandleHref?: string;
  /**
   * Shows a small pencil affordance in the QR's corner, revealed on
   * hover, that lets a person edit `editableRootValue` inline -- opt-in
   * only (every other mount of this component, e.g. monad.ai.tsx's
   * decorative QR or the old Cleaker.tsx surface, keeps rendering exactly
   * as before). Exists because the namespace this QR encodes/displays is
   * so far always GUESSED from `window.location` (see CleakerLanding.tsx's
   * deriveNamespaceRootLabel) -- a guess that can silently diverge from
   * what a server actually resolves a given root string to (confirmed
   * live: "localhost" claims land under a monad's own configured root,
   * e.g. "local.cleaker", but a later sign-in re-guessing "localhost"
   * from the URL bar never learns that and fails). Editing here is the
   * fix at the source: the root becomes something a person states
   * directly, not something inferred from wherever the page happens to
   * be loaded from.
   */
  editableRoot?: boolean;
  /** Current value shown in the inline editor when it opens. Ignored unless `editableRoot` is true. */
  editableRootValue?: string;
  /**
   * Fires once with the new, trimmed value when a person commits an edit
   * (Enter, or blurring after a real change) -- never fires for an
   * unchanged or empty draft. Required for `editableRoot` to do anything;
   * this component holds no namespace state of its own.
   */
  onEditableRootChange?: (next: string) => void;
  className?: string;
  style?: React.CSSProperties;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
};

const DIAMETER_BY_VARIANT = {
  xs: 72,
  sm: 96,
  md: 112,
  lg: 148,
  xl: 184,
  topbar: 40,
} as const;

// Two tries before this one, both confirmed live and both wrong in a
// different way: a full rounded-square (all four edges) renders upside
// down on the top edge (any straight segment moving leftward does, no
// matter the corners' own sweep-flag -- SVG's default text-on-path
// orientation keys off the SEGMENT's own direction of travel, not the
// corners); a circular arc turns that flip into a gradual "rotate the
// badge to keep reading" wrap instead of a sharp one, but never removes
// it, and it also pulled the label noticeably away from the QR itself.
//
// This is the fix: only the BOTTOM edge (traced left-to-right, i.e.
// "east" -- upright, normal reading) and the RIGHT edge (traced bottom-
// to-top, i.e. "north" -- sideways, legible tilting your head right,
// already confirmed live) are ever used. Both directions were already
// proven individually legible; the trick is just never asking the path to
// go anywhere else (up-then-left, the combination that broke before).
// Text longer than these two edges combined is simply not drawn past the
// path's own end -- that's SVG's ordinary textPath behavior, not
// something this function has to compute itself, and it's exactly the
// "cut the string" behavior asked for.
//
// Local (0,0)-(s,s) coordinate space, matching the QR's own square (the
// caller offsets/insets this to sit just outside the real QR edge, not a
// separate ring further out). Starts at (r, s) -- the bottom edge, just
// past where the bottom-LEFT corner's own curve ends -- so the full
// bottom edge is available before the text ever has to turn the corner.
function buildPerimeterPath(s: number, r: number): string {
  return [
    `M ${r},${s}`,
    `L ${s - r},${s}`,
    `A ${r},${r} 0 0 0 ${s},${s - r}`,
    `L ${s},${r}`,
  ].join(' ');
}

function fallbackInitial(username: string, avatarFallback: string): string {
  const direct = String(avatarFallback || '').trim();
  if (direct) return direct.slice(0, 2).toUpperCase();
  const source = String(username || '').trim();
  if (!source) return '.m';
  return source.slice(0, 2).toUpperCase();
}

export default function QRme({
  value,
  username = '',
  avatarSrc = '',
  avatarAlt = '',
  avatarFallback = '',
  variant = 'md',
  diameter,
  size = 112,
  bg,
  fg,
  defaultFace = 'qr',
  hoverFlip = true,
  clickFlip = true,
  cursor,
  showAvatarLabel = false,
  status = 'idle',
  statusLabel,
  perimeterLabel,
  perimeterRootLabel,
  perimeterHandleHref,
  editableRoot = false,
  editableRootValue = '',
  onEditableRootChange,
  className,
  style,
  'data-gui-node-id': dataGuiNodeId,
  'data-gui-component': dataGuiComponent,
}: QRmeProps) {
  const theme = useGuiTheme();
  const resolvedDiameter = Math.max(
    48,
    Number.isFinite(diameter as number)
      ? Number(diameter)
      : Number.isFinite(size as number)
        ? Number(size)
        : DIAMETER_BY_VARIANT[variant]
  );
  const isTopbar = variant === 'topbar';
  // The topbar variant is a small status badge, never meant to be scanned
  // (40px can't hold a legible QR at any content length) — it keeps its
  // own fixed cap, unaffected by value length. Every other variant grows
  // past what the caller asked for when a longer `value` would otherwise
  // shrink modules below MIN_PX_PER_MODULE at the requested size.
  //
  // qrSize/effectiveDiameter are derived from snapQrCellSize FIRST (not the
  // other way around) so the frame below is sized to exactly what
  // <QR> will actually render — never a size QR.tsx then has to be
  // CSS-stretched to fit, which would silently reintroduce the fractional
  // per-module pixel size snapQrCellSize exists to avoid (see its own doc
  // comment in QR.tsx for the confirmed real decode failure this caused).
  const { qrSize, effectiveDiameter, qrInset } = React.useMemo(() => {
    if (isTopbar) {
      const diameter = Math.min(resolvedDiameter, 40);
      const inset = Math.max(2, Math.round(diameter * 0.02));
      return { qrSize: diameter - inset * 2, effectiveDiameter: diameter, qrInset: inset };
    }
    const moduleCount = getQrModuleCount(value, QR_ECC);
    const totalModules = moduleCount + QR_QUIET_ZONE_MODULES * 2;
    const inset = Math.max(2, Math.round(resolvedDiameter * QR_INSET_RATIO));
    const requestedQrSize = resolvedDiameter - inset * 2;
    const { size } = snapQrCellSize(totalModules, requestedQrSize, MIN_PX_PER_MODULE);
    return { qrSize: size, effectiveDiameter: size + inset * 2, qrInset: inset };
  }, [value, resolvedDiameter, isTopbar]);
  const [hovered, setHovered] = React.useState(false);
  const [pinned, setPinned] = React.useState(defaultFace === 'avatar');
  const [editingRoot, setEditingRoot] = React.useState(false);
  const [rootDraft, setRootDraft] = React.useState(editableRootValue);
  // Independent of `hovered`/hoverFlip above -- CleakerLanding (the only
  // real caller of editableRoot so far) sets hoverFlip=false, so that
  // state never turns true and would leave the edit icon permanently
  // invisible if reused here.
  const [rootEditHovered, setRootEditHovered] = React.useState(false);
  const rootEditInputRef = React.useRef<HTMLInputElement>(null);

  const openRootEditor = () => {
    setRootDraft(editableRootValue);
    setEditingRoot(true);
  };
  const commitRootEdit = () => {
    const next = rootDraft.trim();
    if (next && next !== editableRootValue) onEditableRootChange?.(next);
    setEditingRoot(false);
  };
  const cancelRootEdit = () => setEditingRoot(false);
  // Autofocus the moment the editor mounts -- a person just clicked an
  // edit icon specifically to type, not to click again into the field.
  React.useEffect(() => {
    if (editingRoot) rootEditInputRef.current?.focus();
  }, [editingRoot]);

  const showingAvatar = pinned || (hoverFlip && hovered);
  const faceRotation = showingAvatar ? 180 : 0;
  const rootNodeId = String(dataGuiNodeId || 'QR.me');
  // The QR is one thing with three parts: the code itself, its namespace text
  // and its status dot. When the caller names the code (`<qr>.code`), the
  // namespace and status are its SIBLINGS (`<qr>.namespace`, `<qr>.status`),
  // not children of the code: they sit beside it in the markup.
  const qrBase = rootNodeId.endsWith('.code') ? rootNodeId.slice(0, -'.code'.length) : rootNodeId;
  const rootNodeType = String(dataGuiComponent || (rootNodeId.endsWith('.code') ? 'code' : 'QR.me'));
  // 'confirmed' and the default 'idle' both fall through to the QR's own
  // normal color -- only 'checking'/'error' recolor anything. Kept as one
  // value (not two separate ring/ink colors) so the ink and the ring
  // around it always agree on what they're signaling.
  const statusColor = status === 'checking'
    ? theme.palette.warning.main
    : status === 'error'
      ? theme.palette.error.main
      : undefined;
  const qrBg = bg ?? theme.palette.background.paper;
  const qrFg = fg ?? statusColor ?? theme.palette.primary.main;
  const ringAccent = statusColor ?? theme.palette.primary.main;
  // A plain online/offline dot at the very start of the perimeter label,
  // replacing the scarab glyph a caller used to prepend to the text
  // itself -- flagged live as no longer needed once Beatle's own visible
  // icon was removed entirely (see CleakerLanding.tsx's headless
  // useBeatle() call): the connection state this glyph used to gesture
  // at is exactly what `status` already carries, so it can just be drawn
  // as the real thing instead of a fixed icon that never actually
  // reflected it. Distinct four-color read (idle/checking/confirmed/
  // error), not just statusColor's two-value fallback -- 'confirmed'
  // needs its own green, not the ring's neutral primary.
  //
  // Everything drawn OUTSIDE the QR frame sits on the page background, so
  // it has to read against THAT. Several themes' primary is a dark brand
  // color (Seafoam's #244C4E is ~1.9:1 against its own dark page), and the
  // root text + idle dot were drawn straight in it -- present in the DOM but
  // effectively invisible ("falta el icono del status ... y el texto").
  // `readable` keeps the intended color when it has >= 3:1 against the page
  // and otherwise steps through lighter fallbacks, ending at the theme's
  // own text color, so the label always shows.
  const pageBg = theme.palette.background.default ?? theme.palette.background.paper;
  const readable = (color: string, ...fallbacks: string[]): string => {
    for (const candidate of [color, ...fallbacks]) {
      try {
        if (getContrastRatio(candidate, pageBg) >= 3) return candidate;
      } catch {
        return candidate;
      }
    }
    return theme.palette.text.primary;
  };
  const statusDotColor = readable(
    status === 'checking'
      ? theme.palette.warning.main
      : status === 'error'
        ? theme.palette.error.main
        : status === 'confirmed'
          ? theme.palette.success.main
          : theme.palette.text.disabled,
    theme.palette.text.secondary,
  );
  // The handle portion (everything before the root) is its own kind of
  // thing -- an identity, not a connection-status signal -- so it gets
  // its own color rather than either the root's status-driven ringAccent
  // or a flat neutral. Was theme.palette.secondary.main -- this brand's
  // actual secondary token is a saturated rose, which read as alarming
  // rather than "this is a link" once it was actually clickable
  // (flagged live: "muy agresivo, no da esa sensación de hyperlink").
  // `info` is the theme's own conventional link-blue instead. Same color
  // whether or not `perimeterHandleHref` makes it clickable -- see that
  // prop's own doc comment.
  const perimeterHandleColor = readable(theme.palette.info.main, theme.palette.info.light);
  // The root namespace (e.g. "local.cleaker") is what actually answers
  // "which namespace is this" -- flagged live to always read bold and to
  // carry the same connection-status color as the ring around it
  // (ringAccent), never the handle's own secondary color above. Split out
  // of perimeterLabel by suffix match rather than requiring the caller to
  // pass pre-split segments -- perimeterLabel is already the single
  // source of truth for what's drawn; this only figures out where the
  // root starts inside it.
  const perimeterRootStart =
    perimeterRootLabel && perimeterLabel?.endsWith(perimeterRootLabel)
      ? perimeterLabel.length - perimeterRootLabel.length
      : -1;
  const perimeterPrefixText = perimeterRootStart >= 0 ? perimeterLabel!.slice(0, perimeterRootStart) : perimeterLabel;
  const perimeterRootText = perimeterRootStart >= 0 ? perimeterLabel!.slice(perimeterRootStart) : '';

  // perimeterLabel's own ring, sized around (not overlapping) the QR
  // face -- scannability testing for the QR itself (see the face Box's
  // own doc comment below) never involved anything outside its own
  // square, so this can't affect it either way. Scales with
  // effectiveDiameter so the expanded/default sizes both get
  // proportionally readable text, not a fixed pixel margin that reads
  // fine small and cramped once expanded (or the reverse).
  const pathId = React.useId();
  const showPerimeterLabel = !isTopbar && Boolean(perimeterLabel);
  // sqrt, not linear (effectiveDiameter * 0.09) -- flagged live as
  // growing the font too aggressively once expanded: a straight
  // proportion took it from ~11px at the default size to ~19px expanded
  // (+73%, matching the diameter's own +71% jump 1:1). sqrt keeps the
  // same ~11px at the default size (unchanged, already tuned) but only
  // ~15px expanded (+36%) -- still visibly bigger, not nearly as much.
  const perimeterFontSize = Math.max(9, Math.round(Math.sqrt(effectiveDiameter)));
  // Tight to the QR on purpose -- an earlier circle-based version offset
  // ~0.3x the diameter out and was flagged live as leaving visibly "too
  // much air" between the QR and whatever sits below it on the page.
  // Nudged up slightly (0.95 -> 1.1) on later feedback that the tightest
  // version still read as a hair too close.
  const ringOffset = showPerimeterLabel ? Math.round(perimeterFontSize * 1.1) : 0;
  const perimeterPathSize = effectiveDiameter + ringOffset * 2;
  // Matches (scaled up slightly for the small extra offset) the QR
  // face's own 12px corner radius below, so the ring reads as hugging
  // that same shape rather than a differently-rounded one just outside it.
  const perimeterRadius = Math.max(8, Math.round(12 + ringOffset));
  // Room for the path itself plus the text sitting on it (glyphs extend
  // roughly half their own height past the bare path line).
  const outerSize = showPerimeterLabel
    ? perimeterPathSize + perimeterFontSize
    : effectiveDiameter;
  const perimeterInset = (outerSize - perimeterPathSize) / 2;
  // Sized and placed by a single ratio (φ) instead of the independent,
  // eyeballed constants this had before (radius 0.32x, gap "+3px") --
  // flagged live as reading cramped and unaligned, not just too small.
  // Diameter:fontSize is 1:φ, and the gap after the dot continues the
  // same division (gap:diameter is 1:φ too) -- one deliberate ratio
  // running through the whole cluster instead of two unrelated numbers.
  const statusDotDiameter = perimeterFontSize / GOLDEN_RATIO;
  const statusDotRadius = Math.max(2, statusDotDiameter / 2);
  const statusDotGap = statusDotDiameter / GOLDEN_RATIO;
  // Horizontal center sits at buildPerimeterPath's own start point (r, s
  // in its local space, before translate) -- the same corner the label
  // text used to start its glyph from. Vertically, the path carries the
  // text's BASELINE (y = perimeterInset + perimeterPathSize) -- lowercase
  // ascenders/x-height rise above that line, so a dot centered ON the
  // baseline sat visibly low next to the text (confirmed live, "ni se ve
  // alineado"). Lifting it by its own radius puts its center at roughly
  // the text's visual midline instead, without a second, unrelated
  // offset constant.
  const statusDotCx = perimeterInset + perimeterRadius;
  const statusDotCy = perimeterInset + perimeterPathSize - statusDotRadius;
  // diameter + gap = diameter × (1 + 1/φ) = diameter × φ = fontSize --
  // 1 + 1/φ = φ is the golden ratio's own defining identity, so this
  // reserves exactly one fontSize's width for the dot cluster, not a
  // number picked to look right.
  const perimeterTextStartOffset = statusDotDiameter + statusDotGap;
  const avatarBg = avatarSrc ? 'transparent' : theme.palette.primary.main;
  const avatarTextColor = avatarSrc
    ? theme.palette.primary.contrastText
    : theme.palette.getContrastText(theme.palette.primary.main);
  const borderColor = `${theme.palette.primary.main}55`;
  const rimBackground =
    theme.palette.mode === 'dark'
      ? `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.section.subtle})`
      : `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.section.default})`;
  const avatarRing =
    theme.palette.mode === 'dark'
      ? `radial-gradient(circle at 28% 24%, ${theme.palette.primary.main}22, ${theme.palette.section.subtle} 58%, ${theme.palette.background.paper})`
      : `radial-gradient(circle at 28% 24%, ${theme.palette.primary.main}18, ${theme.palette.section.default} 58%, ${theme.palette.background.paper})`;
  const showAvatarLabelOverlay = !isTopbar && showAvatarLabel && !avatarSrc;

  // The dot and the namespace text are SVG shapes, and browsers don't paint
  // `outline` on SVG children -- so the grid overlay / Inspector (which work
  // by tagging real DOM boxes) never saw them. Measure the text's own box and
  // mirror it (plus the dot's) as transparent, pointer-events:none HTML boxes
  // carrying the node ids. Purely a hit/outline target: no visual of its own.
  const perimeterTextRef = React.useRef<SVGTextElement>(null);
  const [perimeterTextBox, setPerimeterTextBox] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  React.useLayoutEffect(() => {
    if (!showPerimeterLabel) {
      setPerimeterTextBox(null);
      return;
    }
    const el = perimeterTextRef.current;
    if (!el || typeof el.getBBox !== 'function') return;
    try {
      const b = el.getBBox();
      setPerimeterTextBox((prev) =>
        prev && prev.x === b.x && prev.y === b.y && prev.width === b.width && prev.height === b.height
          ? prev
          : { x: b.x, y: b.y, width: b.width, height: b.height }
      );
    } catch {
      // getBBox throws on a non-rendered element -- nothing to mirror yet.
    }
  }, [showPerimeterLabel, perimeterLabel, perimeterRootLabel, perimeterFontSize, outerSize]);

  const handlePointerEnter = () => {
    if (hoverFlip) setHovered(true);
  };

  const handlePointerLeave = () => {
    if (hoverFlip) setHovered(false);
  };

  const handleToggle = () => {
    if (!clickFlip) return;
    setPinned((current) => !current);
  };

  return (
    <>
    <Box
      className={className}
      style={style}
      sx={{
        position: 'relative',
        width: outerSize,
        height: outerSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={editableRoot ? () => setRootEditHovered(true) : undefined}
      onMouseLeave={editableRoot ? () => setRootEditHovered(false) : undefined}
    >
      {showPerimeterLabel && (
        <svg
          width={outerSize}
          height={outerSize}
          viewBox={`0 0 ${outerSize} ${outerSize}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          // The ring/path/root text stay purely decorative, but the
          // handle can now be a real link (see perimeterHandleHref) --
          // an aria-hidden ancestor would swallow that link for
          // assistive tech, so this only hides the whole group when
          // nothing inside it is actually interactive.
          aria-hidden={perimeterHandleHref ? undefined : 'true'}
        >
          <defs>
            <path
              id={pathId}
              d={buildPerimeterPath(perimeterPathSize, perimeterRadius)}
              transform={`translate(${perimeterInset}, ${perimeterInset})`}
            />
          </defs>
          <circle cx={statusDotCx} cy={statusDotCy} r={statusDotRadius} fill={statusDotColor} />
          <text ref={perimeterTextRef} fontFamily="monospace" fontSize={perimeterFontSize}>
            <textPath href={`#${pathId}`} startOffset={perimeterTextStartOffset}>
              {perimeterPrefixText && (
                perimeterHandleHref ? (
                  <a
                    href={perimeterHandleHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${perimeterPrefixText}${perimeterRootText}`}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    // Sits inside the QR's own click-to-expand region
                    // (CleakerLanding wraps the whole bubble in a toggle) --
                    // without this, opening the link would ALSO flip
                    // expanded/collapsed underneath it.
                    onClick={(event) => event.stopPropagation()}
                  >
                    <tspan fill={perimeterHandleColor} fontWeight={500}>
                      {perimeterPrefixText}
                    </tspan>
                  </a>
                ) : (
                  <tspan fill={perimeterHandleColor} fontWeight={500}>
                    {perimeterPrefixText}
                  </tspan>
                )
              )}
              {perimeterRootText && (
                <tspan fill={readable(ringAccent, theme.palette.primary.light)} fontWeight={700}>
                  {perimeterRootText}
                </tspan>
              )}
            </textPath>
          </text>
        </svg>
      )}
      {showPerimeterLabel && (
        <>
          <Box
            aria-hidden="true"
            data-gui-node-id={`${qrBase}.status`}
            data-gui-component="status"
            sx={{
              position: 'absolute',
              // 2px of air around the dot itself: a 7px box's 1px outline
              // is otherwise indistinguishable from the dot.
              left: statusDotCx - statusDotRadius - 2,
              top: statusDotCy - statusDotRadius - 2,
              width: statusDotRadius * 2 + 4,
              height: statusDotRadius * 2 + 4,
              pointerEvents: 'none',
            }}
          />
          {perimeterTextBox && (
            <Box
              aria-hidden="true"
              data-gui-node-id={`${qrBase}.namespace`}
              data-gui-component="namespace"
              sx={{
                position: 'absolute',
                left: perimeterTextBox.x,
                top: perimeterTextBox.y,
                width: perimeterTextBox.width,
                height: perimeterTextBox.height,
                pointerEvents: 'none',
              }}
            />
          )}
        </>
      )}
      <Box
        data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      role={clickFlip ? 'button' : undefined}
      tabIndex={clickFlip ? 0 : undefined}
      aria-label={[showingAvatar ? 'Show .me QR' : 'Show avatar', statusLabel].filter(Boolean).join(' — ')}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={handlePointerEnter}
      onBlur={handlePointerLeave}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (!clickFlip) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleToggle();
        }
      }}
      sx={{
        width: effectiveDiameter,
        height: effectiveDiameter,
        display: 'inline-flex',
        perspective: `${effectiveDiameter * 6}px`,
        cursor: cursor ?? (clickFlip ? 'pointer' : 'default'),
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${faceRotation}deg)`,
          transition: isTopbar
            ? 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            // Square, not circular — confirmed live (2026-09-16) with a
            // real side-by-side phone-camera test (/qr-test): a circular
            // frame this close to the QR's own side length (not its
            // diagonal) clips into the corner finder patterns a camera
            // needs intact, and it got WORSE as content length pushed the
            // QR to a denser version — square scanned every time, circular
            // failed past a short username. A 12px radius (matching QR.tsx's
            // own internal corner rounding) softens the corners without
            // cutting anywhere near the finder patterns.
            borderRadius: '12px',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: rimBackground,
            border: '1px solid',
            borderColor: `${ringAccent}55`,
            boxShadow: isTopbar
              ? `0 0 0 1px ${theme.palette.primary.main}22, 0 3px 8px rgba(0,0,0,0.14)`
              : showingAvatar
                ? `0 0 0 1px ${theme.palette.primary.main}22, 0 12px 22px rgba(0,0,0,0.18)`
                // Dialed way back from the earlier "stronger" pass, which
                // read as too much glow — thin ring, soft low-alpha spread.
                // Static, not animated: this ring sits directly around the
                // QR face, and continuous motion here (an earlier version
                // had a drift/scale keyframe) puts the actual scannable
                // pattern in motion too — real cameras need a still target
                // to lock onto a QR's finder patterns, confirmed live
                // (2026-09-16) against local.cleaker's own QR. Uses
                // ringAccent (warning/error while `status` says so, the
                // theme's own primary color otherwise) so this glow doubles
                // as the QR's connection-status signal.
                : `0 0 0 2px ${ringAccent}, 0 0 14px 3px ${ringAccent}40, 0 8px 18px rgba(0,0,0,0.14)`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: qrInset,
              width: qrSize,
              height: qrSize,
              borderRadius: '12px',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QR
              value={value}
              size={qrSize}
              bg={qrBg}
              fg={qrFg}
              ecc="H"
              // Slim (1-module) rather than the library default (4) — kept
              // this way after the circular-clip fix (this frame is square
              // now, see the outer Box's own doc comment) because it
              // already tested as reliably scannable at this value, real
              // decoder + real phone confirmed, once module size was
              // pixel-snapped (snapQrCellSize in QR.tsx) and the clip
              // removed — no evidence this specific value needs revisiting.
              quietZone={1}
              // No embed props at all here — QR.tsx's embedMode="negative-space"
              // turned out to still draw the bitmap back as a filled shape
              // (buildAsciiOverlayPath runs for both "negative-space" and
              // "positive-overlay" — a real inconsistency in that
              // component, not something this call site can configure its
              // way around). A full, undisturbed QR underneath, with
              // PixelWordmark sitting directly on top below (no backing
              // patch — see that comment for why that's fine for
              // scannability, not just a look).
            />
            <PixelWordmark
              bitmap={ME_WORDMARK_EMBED_BITMAP}
              pixelSize={Math.max(1.4, qrSize / 100)}
              // Widens the glyphs without redrawing the bitmap — cells are
              // wider than tall instead of square. Pushed further (1.5 -> 1.8).
              pixelAspect={1.8}
              fg={qrFg}
              // No backing patch: an opaque patch was a clean geometric cut
              // against the QR's noise — asked for it to just blend instead.
              // Drawing the wordmark directly onto the QR (letting whatever
              // sits underneath show through the gaps between strokes) is
              // both the more organic look and, if anything, safer for
              // scannability than the patch was — sparse text strokes cover
              // less area than a solid filled shape did, well inside what
              // ECC=H already tolerates. Stacked drop-shadows (qrBg) give
              // it real separation from busy QR noise without reintroducing
              // a hard geometric shape — each one follows the letters' own
              // silhouette, not a box. Radii capped at 0.5x-2x the base
              // pixel size (not 1x-4x, tried first) — at the compact default
              // size the wordmark is only ~9px tall, so a 4x radius blurred
              // way past the actual letters into a big vertical smear above
              // and below; halving the ceiling keeps the glow close to the
              // glyphs themselves at every size.
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                filter: Array.from(
                  { length: 4 },
                  (_, i) => `drop-shadow(0 0 ${Math.max(1.4, qrSize / 100) * (i + 1) * 0.5}px ${qrBg})`,
                ).join(' '),
              }}
              data-gui-node-id={`${rootNodeId}.wordmark`}
            />
          </Box>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            // Matches the QR face's own square shape (see that Box's doc
            // comment) — both faces of the same flip card, so they must
            // agree, not flip from circle to square mid-rotation.
            borderRadius: '12px',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: avatarRing,
            border: '1px solid',
            borderColor,
            boxShadow: isTopbar
              ? `0 0 0 1px ${theme.palette.primary.main}22, 0 3px 8px rgba(0,0,0,0.14)`
              : `0 0 0 1px ${theme.palette.primary.main}33, 0 10px 24px rgba(0,0,0,0.16)`,
            overflow: 'hidden',
          }}
        >
          <Avatar
            src={avatarSrc || undefined}
            alt={String(avatarAlt || username || '.me avatar')}
            sx={{
              width: effectiveDiameter - (isTopbar ? 6 : 10),
              height: effectiveDiameter - (isTopbar ? 6 : 10),
              bgcolor: avatarBg,
              color: avatarTextColor,
              fontSize: isTopbar
                ? Math.max(11, Math.round(effectiveDiameter * 0.24))
                : Math.max(18, Math.round(effectiveDiameter * 0.22)),
              fontWeight: 800,
              letterSpacing: '-0.03em',
              border: isTopbar ? '1.5px solid' : '2px solid',
              borderColor: theme.palette.background.paper,
              '& .MuiAvatar-img': {
                objectFit: 'cover',
                backgroundColor: 'transparent',
              },
            }}
          >
            {fallbackInitial(username, avatarFallback)}
          </Avatar>

          {showAvatarLabelOverlay ? (
            <Box
              sx={{
                position: 'absolute',
                bottom: Math.max(6, Math.round(effectiveDiameter * 0.04)),
                left: '50%',
                transform: 'translateX(-50%)',
                px: 0.9,
                py: 0.35,
                borderRadius: 999,
                bgcolor: `${theme.palette.background.paper}E8`,
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: `${theme.palette.primary.main}30`,
                minWidth: Math.max(44, Math.round(effectiveDiameter * 0.42)),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {username ? `@${username}` : '.me'}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
      </Box>

      {editableRoot && (
        editingRoot ? (
          <Box
            component="form"
            onSubmit={(event: React.FormEvent) => { event.preventDefault(); commitRootEdit(); }}
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
            sx={{
              position: 'absolute',
              top: -38,
              right: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: theme.palette.background.paper,
              border: '1px solid',
              borderColor,
              boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
            }}
            data-gui-node-id={`${qrBase}.namespace.edit.form`}
          >
            <input
              ref={rootEditInputRef}
              value={rootDraft}
              onChange={(event) => setRootDraft(event.target.value)}
              onBlur={commitRootEdit}
              onKeyDown={(event) => {
                // Stopped unconditionally -- CleakerLanding's own bubble
                // wrapper listens for Enter/Space at the document level to
                // toggle expanded/collapsed, which would otherwise also
                // fire while someone is simply typing a namespace in here.
                event.stopPropagation();
                if (event.key === 'Escape') { event.preventDefault(); cancelRootEdit(); }
              }}
              // Generic placeholder on purpose -- no example namespace
              // here, real or fictional. This component doesn't know
              // (and shouldn't act like it knows) which root a caller
              // "should" use; the field is prefilled from
              // editableRootValue anyway, so this only ever shows if
              // someone clears it entirely.
              placeholder="namespace root"
              spellCheck={false}
              autoComplete="off"
              style={{
                width: Math.max(96, Math.round(effectiveDiameter * 0.9)),
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: theme.palette.text.primary,
              }}
              data-gui-node-id={`${qrBase}.namespace.edit.input`}
            />
          </Box>
        ) : (
          <Box
            component="button"
            type="button"
            className="qrme-root-edit-trigger"
            aria-label="Edit namespace"
            onClick={(event: React.MouseEvent) => { event.stopPropagation(); openRootEditor(); }}
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              zIndex: 2,
              width: 24,
              height: 24,
              p: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '1px solid',
              borderColor,
              bgcolor: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
              cursor: 'pointer',
              opacity: rootEditHovered ? 1 : 0,
              transition: 'opacity 160ms ease',
              // Keep it out of the way (and unclickable) whenever it's
              // faded out -- an invisible button still sitting right on
              // top of the QR's own click-to-expand region would otherwise
              // steal that click.
              pointerEvents: rootEditHovered ? 'auto' : 'none',
            }}
            data-gui-node-id={`${qrBase}.namespace.edit`}
          >
            <Icon name="edit" fontSize="0.9rem" />
          </Box>
        )
      )}
    </Box>
    </>
  );
}
