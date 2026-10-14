// Monad.tsx — Floating .me badge wrapper
// Renders the draggable animated .me orb and toggles the Session badge
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { GlobalStyles } from "@mui/system";
import type { Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material";
import { keccak_256 } from "js-sha3";
import QRme from "../me/QR/QR.me";
export type MonadProps = {
  variant?: "bubble" | "inline" | "identity";
  mode?: "float" | "contained";
  kind?: "me" | "monad";
  seed?: string;
  /** Label shown in the hover tooltip. Defaults to the .me name or "monad.ai". */
  label?: string;
  /** Drive the orb glow: true = green/online, false = red/offline, null/undefined = default blue. */
  healthy?: boolean | null;
  /**
   * Draw the orb at full strength: no dimming glow cycle (the `glow` animation takes the whole orb down to 30-50%
   * opacity, which is the right ambience for a floating badge and unreadable as an icon).
   */
  solid?: boolean;
  /** Diameter (px) of the identity ring. Border and dot scale proportionally. Only applies to variant="identity". Defaults to 34. */
  size?: number;
  children?: ReactNode;
};

export type MonadContextValue = {
  hasMe: boolean;
  me: any | null;
  meName: string | null;
};

const MonadContext = createContext<MonadContextValue>({
  hasMe: false,
  me: null,
  meName: null,
});

type PixelCell = {
  key: string;
  active: boolean;
  secondary: boolean;
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildPixelCells(seed: string): PixelCell[] {
  const hash = hashString(seed || "monad.ai");
  const cells: PixelCell[] = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const mirrorCol = col > 2 ? 4 - col : col;
      const bitIndex = row * 3 + mirrorCol;
      cells.push({
        key: `${row}:${col}`,
        active: ((hash >> bitIndex) & 1) === 1 || (row === 2 && col === 2),
        secondary: ((hash >> (bitIndex + 8)) & 1) === 1,
      });
    }
  }
  return cells;
}

export function useMonadContext() {
  return useContext(MonadContext);
}

function resolveMeContext(): MonadContextValue {
  const g = globalThis as any;
  const me = g?.me ?? null;
  let meName: string | null = null;
  try {
    if (me) {
      if (typeof me === "function") {
        const value = me("name");
        if (value != null) meName = String(value);
      } else if (typeof me?.name === "function") {
        const value = me.name();
        if (value != null) meName = String(value);
      } else if (typeof me?.get === "function") {
        const value = me.get("name");
        if (value != null) meName = String(value);
      }
    }
  } catch {
    meName = null;
  }
  return { hasMe: Boolean(me), me, meName };
}

export default function Monad({ variant = "bubble", mode = "float", kind, seed, label, healthy, size, solid = false, children }: MonadProps) {
  const [open, setOpen] = useState(false);
  const [qrExpanded, setQrExpanded] = useState(false);
  const identitySize = size ?? 34;
  const identityButtonSize = Math.round(identitySize * (60 / 34));
  const identityBorderWidth = Math.max(2, Math.round(identitySize * (2 / 34)));
  const identityDotSize = Math.max(3, Math.round(identitySize * (9 / 34)));
  const status = {
    active: healthy !== false,
    error: healthy === false,
  };
  const theme = useTheme() as any;
  const hasContent = Boolean(children);
  const [meContext, setMeContext] = useState<MonadContextValue>(() => resolveMeContext());
  const visualKind = kind || (meContext.hasMe ? "me" : "monad");
  const visualSeed = seed || meContext.meName || label || (visualKind === "me" ? "me" : "monad.ai");
  const baseLabel = label || meContext.meName || (visualKind === "me" ? "me" : "monad.ai");
  // identityHash = keccak256("this.me/identity:v1::" + seed) — the kernel's real public fingerprint.
  const identityHash = useMemo(() => "0x" + keccak_256(`this.me/identity:v1::${visualSeed}`), [visualSeed]);
  const tooltipLabel =
    variant === "identity" ? `${baseLabel} · ${identityHash.slice(0, 10)}…${identityHash.slice(-6)}` : baseLabel;
  const pixelCells = useMemo(() => buildPixelCells(visualSeed), [visualSeed]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const { top = 0, bottom = 0, left = 0, right = 0 } = theme.layout?.insets || {};
  const dockPos = useRef({
    x: (window.innerWidth - left - right) / 2,
    y: (window.innerHeight - top - bottom) / 2,
  });

  const [pos, setPos] = useState(dockPos.current);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const clickTimeout = useRef<number | null>(null);
  const dragMoved = useRef(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    dragMoved.current = false;
    clickTimeout.current = Date.now();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - pos.x) > 3 || Math.abs(e.clientY - pos.y) > 3) {
      dragMoved.current = true;
    }
    const rawX = e.clientX - offset.x;
    const rawY = e.clientY - offset.y;
    const clampedX = Math.min(window.innerWidth - right - 120, Math.max(left, rawX));
    const clampedY = Math.min(window.innerHeight - bottom - 120, Math.max(top, rawY));
    setPos({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setDragging(false);
    dragMoved.current = false;
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
  useEffect(() => {
    const handleResize = () => {
      if (!dragging) {
        dockPos.current = { x: window.innerWidth - 80, y: window.innerHeight - 80 };
        setPos(dockPos.current);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dragging]);
  useEffect(() => {
    if (mode !== "contained") return;
    const node = containerRef.current;
    if (!node || !node.parentElement) return;
    const parent = node.parentElement;
    const update = () => {
      const w = parent.clientWidth || 0;
      const h = parent.clientHeight || 0;
      if (w && h) setContainerSize({ w, h });
    };

    update();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => update());
      ro.observe(parent);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro) ro.disconnect();
    };
  }, [mode]);
  useEffect(() => {
    if (meContext.hasMe) return;
    let attempts = 0;
    const maxAttempts = 20;
    const id = window.setInterval(() => {
      attempts += 1;
      const next = resolveMeContext();
      if (next.hasMe || attempts >= maxAttempts) {
        setMeContext(next);
        window.clearInterval(id);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [meContext.hasMe]);
  const badgeSide = pos.x > window.innerWidth / 2 ? "left" : "right";
  const badgeStyle =
    mode === "contained"
      ? ({ left: "50%", transform: "translateX(-50%)" } as const)
      : badgeSide === "left"
        ? ({ right: 120 + 10 } as const)
        : ({ left: 120 + 10 } as const);
  const connectorKey = `${badgeSide}:${open ? "open" : "closed"}`;
  const connector = useMemo(() => {
    const radius = 30;
    const start = {
      x: badgeSide === "left" ? 40 - radius + 1 : 40 + radius - 1,
      y: 40 - 11,
    };
    const end = {
      x: badgeSide === "left" ? -82 : 162,
      y: 18,
    };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const c1 = { x: start.x + dx * 0.35, y: start.y + dy * 0.15 + 10 };
    const c2 = { x: start.x + dx * 0.7, y: start.y + dy * 0.75 + 6 };
    const d = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
    return { d, start, end };
  }, [badgeSide]);
  // Inline keeps Monad in the tree without rendering the floating orb.
  // It is present as a surface wrapper, but not in floating form.
  if (variant === "inline") {
    return (
      <Box>
        {children ?? null}
      </Box>
    );
  }

  return (
    <>
      <GlobalStyles
        styles={{
          "@keyframes float": {
            "0%,100%": { transform: "translateY(0) scale(1)", borderRadius: "50%" },
            "25%": { transform: "translateY(-6px) scale(1.05)", borderRadius: "55% 45% 60% 40% / 60% 55% 45% 40%" },
            "50%": { transform: "translateY(-8px) scale(1.1)", borderRadius: "50% 60% 40% 55% / 55% 40% 60% 45%" },
            "75%": { transform: "translateY(-6px) scale(1.05)", borderRadius: "45% 55% 40% 60% / 40% 60% 55% 50%" },
          },
          "@keyframes glow": {
            "0%,100%": { opacity: 0.3, boxShadow: "0 0 4px rgba(255,255,255,0.2), 0 0 8px rgba(173,216,230,0.1)" },
            "50%": { opacity: 0.5, boxShadow: "0 0 6px rgba(255,255,255,0.3), 0 0 10px rgba(173,216,230,0.15)" },
          },
          "@keyframes blobMove": {
            "0%,100%": { top: "15%", left: "20%", width: "65%", height: "65%", borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%", filter: "blur(14px)" },
            "33%": { top: "10%", left: "25%", width: "70%", height: "70%", borderRadius: "55% 60% 40% 45% / 45% 50% 60% 55%", filter: "blur(18px)" },
            "66%": { top: "18%", left: "15%", width: "60%", height: "60%", borderRadius: "50% 55% 45% 60% / 60% 50% 55% 40%", filter: "blur(12px)" },
          },
          "@keyframes rorschachLava": {
            "0%,100%": {
              transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
              borderRadius: "48% 52% 49% 51% / 56% 44% 56% 44%",
              filter: "blur(1.2px) contrast(1.18) saturate(0.86)",
            },
            "38%": {
              transform: "translate3d(1px, -1px, 0) scale(1.04) rotate(4deg)",
              borderRadius: "58% 42% 54% 46% / 43% 59% 41% 57%",
              filter: "blur(1.8px) contrast(1.28) saturate(0.82)",
            },
            "72%": {
              transform: "translate3d(-1px, 1px, 0) scale(0.99) rotate(-3deg)",
              borderRadius: "42% 58% 46% 54% / 61% 41% 59% 39%",
              filter: "blur(1.4px) contrast(1.22) saturate(0.84)",
            },
          },
          "@keyframes pixelBreath": {
            "0%,100%": { transform: "translate3d(0, 0, 0) scale(1)", opacity: 0.9 },
            "50%": { transform: "translate3d(0, -1px, 0) scale(1.025)", opacity: 1 },
          },
          "@keyframes stringWobble": {
            "0%,100%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(0.6px)" },
          },
        }}
      />

      <Box
        ref={containerRef}
        sx={{
          position: mode === "contained" ? "relative" : "fixed",
          left: mode === "contained" ? 0 : pos.x - 20,
          top: mode === "contained" ? 0 : pos.y - 20,
          width: mode === "contained" ? (containerSize?.w ? `${containerSize.w}px` : "100%") : 120,
          height: mode === "contained" ? (containerSize?.h ? `${containerSize.h}px` : "100%") : 120,
          borderRadius: "12px",
          border: open ? "2px solid rgba(255,255,255,0.25)" : "2px solid transparent",
          background: open ? "rgba(0,0,0,0.1)" : "transparent",
          backdropFilter: open ? "blur(12px)" : "none",
          boxShadow: open ? "0 0 18px rgba(0,0,0,0.25)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1400,
        }}
        data-me-present={meContext.hasMe ? "1" : "0"}
        data-me-name={meContext.meName ?? ""}
      >
        <MonadContext.Provider value={meContext}>
          <Box
            sx={{
              position: "relative",
              width: mode === "contained" ? "100%" : 80,
              height: mode === "contained" ? "100%" : 80,
              pointerEvents: "none",
              overflow: "visible",
              display: mode === "contained" ? "flex" : "block",
              alignItems: mode === "contained" ? "center" : undefined,
              justifyContent: mode === "contained" ? "center" : undefined,
            }}
          >

          {open && mode !== "contained" ? (
            <Box
              key={connectorKey}
              sx={{
                position: "absolute",
                inset: 0,
                overflow: "visible",
                pointerEvents: "none",
                opacity: 0.55,
                animation: "stringWobble 4.2s ease-in-out infinite",
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.18))",
              }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: "visible" }} aria-hidden="true">
                <defs>
                  <linearGradient id="monadString" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.0" />
                    <stop offset="45%" stopColor={theme.palette.primary.main} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={connector.d}
                  fill="none"
                  stroke="url(#monadString)"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                <circle cx={connector.end.x} cy={connector.end.y} r="1.1" fill={theme.palette.primary.main} opacity="0.45" />
              </svg>
            </Box>
          ) : null}

          {open && hasContent ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.38)",
                pointerEvents: "none",
                borderRadius: mode === "contained" ? "16px" : "12px",
              }}
            />
          ) : null}

          {open && hasContent ? (
            <Box
              sx={{
                position: "absolute",
                ...(mode === "contained"
                  ? { inset: 0, width: "100%", height: "100%", borderRadius: "16px" }
                  : { top: -10, ...badgeStyle, width: 332, borderRadius: "16px" }),
                border: "1px solid rgba(255,255,255,0.18)",
                background: theme.palette?.mode === "light" ? "rgba(255,255,255,0.96)" : "rgba(6,8,12,0.96)",
                backdropFilter: "blur(6px) saturate(120%)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                overflow: "hidden",
                pointerEvents: "auto",
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  px: 1.25,
                  py: 0.9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  borderBottom: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Box
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: theme.palette?.mode === "light" ? "#005a7a" : "#baf3ff",
                    userSelect: "none",
                  }}
                >
                  {tooltipLabel}
                </Box>
                <Box
                  onClick={() => setOpen(false)}
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: theme.palette?.mode === "light" ? "#005a7a" : "#baf3ff",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    userSelect: "none",
                    "&:hover": { background: "rgba(255,255,255,0.14)" },
                  }}
                  aria-label="Close"
                >
                  ×
                </Box>
              </Box>
              <Box sx={{ p: 1.0, height: mode === "contained" ? "calc(100% - 44px)" : "auto", overflow: "auto" }}>
                {children}
              </Box>
            </Box>
          ) : null}

          <Box
            onClick={() => {
              if (mode === "contained") {
                if (hasContent) setOpen((prev) => !prev);
                return;
              }
              if (clickTimeout.current !== null) {
                const elapsed = Date.now() - clickTimeout.current;
                if (!dragging && !dragMoved.current && elapsed < 300 && hasContent) {
                  setOpen((prev) => !prev);
                }
              }
            }}
            onMouseDown={mode === "contained" ? undefined : handleMouseDown}
            sx={(t: Theme) => {
              const primary = t.palette.primary?.main || "#29bfff";
              const lightRing = `0 0 0 3px ${primary}, 0 0 20px 5px color-mix(in srgb, ${primary} 55%, transparent)`;
              const lightBorder = `2.5px solid ${primary}`;
              const isIdentity = variant === "identity";
              return ({
              position: mode === "contained" ? "relative" : "absolute",
              top: mode === "contained" ? "auto" : 10,
              left: mode === "contained" ? "auto" : 10,
              transform: "none",
              width: isIdentity ? identityButtonSize : 60,
              height: isIdentity ? identityButtonSize : 60,
              borderRadius: "50%",
              background: isIdentity
                ? (t.palette.mode === "light" ? "rgba(255,255,255,0.5)" : "rgba(8,10,11,0.55)")
                : (t.palette.mode === "light" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)"),
              boxShadow: isIdentity
                ? "none"
                : (!status.active || status.error
                    ? "0 0 0 3px #ff4d4d, 0 0 20px 6px rgba(255,0,0,0.6)"
                    : (t.palette.mode === "light" ? lightRing : "0 0 0 3px #29bfff, 0 0 22px 6px rgba(0,200,255,0.6)")),
              border: isIdentity
                ? "none"
                : (!status.active || status.error
                    ? "2.5px solid #ff1a1a"
                    : (t.palette.mode === "light" ? lightBorder : "2.5px solid #9ff6ff")),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              color: t.palette.mode === "light" ? primary : "#baf3ff",
              cursor: "pointer",
              userSelect: "none",
              animation: solid
                ? "float 6s ease-in-out infinite"
                : "float 6s ease-in-out infinite, glow 4.5s ease-in-out infinite",
              ...(solid ? { opacity: 1 } : {}),
              backdropFilter: "blur(10px) saturate(160%)",
              pointerEvents: "auto",
              ...(isIdentity ? {} : { "&::before": {
                content: '""',
                position: "absolute",
                top: "15%",
                left: "20%",
                width: "65%",
                height: "65%",
                background:
                  t.palette.mode === "light"
                    ? "radial-gradient(circle at 50% 50%, rgba(0,102,153,0.4) 0%, rgba(0,68,102,0) 70%)"
                    : "radial-gradient(circle at 50% 50%, rgba(120,240,255,0.3) 0%, rgba(173,216,230,0) 70%)",
                filter: "blur(7px)",
                borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
                animation: "blobMove 8s ease-in-out infinite",
                pointerEvents: "none",
                mixBlendMode: "screen",
              } }),
              "&:hover": { transform: "scale(1.08)" },
              "&:hover .monad-tooltip": { opacity: 1, transform: "translateX(-50%) translateY(-2px)" },
            });
            }}
          >
            {variant === "identity" && visualKind === "me" ? (
              <Box aria-hidden="true" sx={{ position: "relative", width: identitySize, height: identitySize, display: "grid", placeItems: "center" }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border:
                      theme.palette.mode === "light"
                        ? `${identityBorderWidth}px solid rgba(0,90,122,0.7)`
                        : `${identityBorderWidth}px solid rgba(230,245,245,0.85)`,
                    boxShadow:
                      theme.palette.mode === "light"
                        ? "0 0 10px rgba(0,90,122,0.3)"
                        : "0 0 12px rgba(180,230,230,0.4)",
                  }}
                />
                <Box
                  sx={{
                    width: identityDotSize,
                    height: identityDotSize,
                    borderRadius: "50%",
                    background: theme.palette.mode === "light" ? "#005a7a" : "#eafcfa",
                    boxShadow:
                      theme.palette.mode === "light"
                        ? "0 0 8px rgba(0,90,122,0.55)"
                        : "0 0 10px rgba(234,252,250,0.75)",
                  }}
                />
              </Box>
            ) : visualKind === "monad" ? (
              <>
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    inset: 5,
                    borderRadius: "inherit",
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: -4,
                      borderRadius: "inherit",
                      background:
                        theme.palette.mode === "light"
                          ? "radial-gradient(circle at 34% 24%, rgba(255,255,255,0.72), transparent 17%), radial-gradient(circle at 66% 72%, rgba(0,64,86,0.22), transparent 34%), linear-gradient(145deg, rgba(255,255,255,0.24), transparent 38%, rgba(0,44,66,0.24) 82%)"
                          : "radial-gradient(circle at 35% 24%, rgba(255,255,255,0.18), transparent 17%), radial-gradient(circle at 66% 73%, rgba(0,0,0,0.42), transparent 34%), linear-gradient(145deg, rgba(255,255,255,0.05), transparent 32%, rgba(0,0,0,0.42) 78%)",
                      boxShadow: "inset 0 0 18px rgba(255,255,255,0.035), inset 0 -18px 26px rgba(0,0,0,0.42)",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 7,
                      borderRadius: "47% 53% 49% 51% / 56% 44% 56% 44%",
                      background:
                        theme.palette.mode === "light"
                          ? "radial-gradient(ellipse at 33% 34%, rgba(44,124,150,0.34) 0 11%, transparent 24%), radial-gradient(ellipse at 67% 34%, rgba(44,124,150,0.34) 0 11%, transparent 24%), radial-gradient(ellipse at 41% 59%, rgba(22,72,92,0.28) 0 14%, transparent 28%), radial-gradient(ellipse at 59% 59%, rgba(22,72,92,0.28) 0 14%, transparent 28%), linear-gradient(90deg, transparent 0 47%, rgba(255,255,255,0.22) 49% 51%, transparent 53% 100%)"
                          : "radial-gradient(ellipse at 33% 34%, rgba(178,201,199,0.5) 0 11%, transparent 24%), radial-gradient(ellipse at 67% 34%, rgba(178,201,199,0.5) 0 11%, transparent 24%), radial-gradient(ellipse at 41% 59%, rgba(122,143,146,0.5) 0 14%, transparent 28%), radial-gradient(ellipse at 59% 59%, rgba(122,143,146,0.5) 0 14%, transparent 28%), radial-gradient(ellipse at 50% 45%, rgba(219,229,228,0.2) 0 8%, transparent 20%), linear-gradient(90deg, transparent 0 47%, rgba(255,255,255,0.08) 49% 51%, transparent 53% 100%)",
                      opacity: 0.78,
                      mixBlendMode: "screen",
                      animation: "rorschachLava 20s ease-in-out infinite",
                    }}
                  />
                </Box>
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    width: 29,
                    height: 29,
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gridTemplateRows: "repeat(5, 1fr)",
                    gap: "2px",
                    imageRendering: "pixelated",
                    animation: "pixelBreath 9s ease-in-out infinite",
                    filter:
                      theme.palette.mode === "light"
                        ? "drop-shadow(0 1px 3px rgba(0,42,58,0.18))"
                        : "drop-shadow(0 1px 4px rgba(0,0,0,0.36))",
                  }}
                >
                  {pixelCells.map((cell) => (
                    <Box
                      key={cell.key}
                      component="span"
                      sx={{
                        borderRadius: "1px",
                        bgcolor: cell.active
                          ? cell.secondary
                            ? (theme.palette.mode === "light" ? "rgba(0,82,106,0.78)" : "rgba(168,214,214,0.88)")
                            : (theme.palette.mode === "light" ? "rgba(10,120,148,0.9)" : "rgba(225,239,236,0.95)")
                          : "transparent",
                        opacity: cell.active ? 1 : 0,
                      }}
                    />
                  ))}
                </Box>
              </>
            ) : (
              "⊙"
            )}
            {variant === "identity" ? (
              <Box
                className="monad-tooltip"
                onClick={(e) => {
                  e.stopPropagation();
                  setQrExpanded((prev) => !prev);
                }}
                sx={{
                  position: "absolute",
                  bottom: "calc(100% + 10px)",
                  left: "50%",
                  transform: "translateX(-50%) translateY(4px)",
                  opacity: 0,
                  transition: "opacity 0.18s ease, transform 0.18s ease",
                  pointerEvents: "auto",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    transform: qrExpanded ? "scale(1.8)" : "scale(1)",
                    transformOrigin: "bottom center",
                    transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
                    filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
                  }}
                >
                  <QRme value={`me://${visualSeed}`} diameter={56} hoverFlip={false} clickFlip={false} />
                </Box>
                {qrExpanded ? (
                  <Box
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      color: theme.palette?.mode === "light" ? "#005a7a" : "#baf3ff",
                      opacity: 0.85,
                    }}
                  >
                    {identityHash.slice(0, 10)}…{identityHash.slice(-6)}
                  </Box>
                ) : null}
              </Box>
            ) : (
              <Box
                className="monad-tooltip"
                sx={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%) translateY(4px)",
                  opacity: 0,
                  transition: "opacity 0.18s ease, transform 0.18s ease",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: theme.palette?.mode === "light" ? "#005a7a" : "#baf3ff",
                  background: theme.palette?.mode === "light" ? "rgba(255,255,255,0.85)" : "rgba(10,14,18,0.85)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "8px",
                  px: 1,
                  py: 0.4,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                }}
              >
                {tooltipLabel}
              </Box>
            )}
          </Box>
          </Box>
        </MonadContext.Provider>
      </Box>
    </>
  );
}
