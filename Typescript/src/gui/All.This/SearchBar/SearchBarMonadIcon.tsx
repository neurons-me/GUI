// SearchBarMonadIcon — the live .GUI orb (Monad) as a search item icon.
// Used when an index entry declares `icon.monad`. variant "identity" (the .me entry) has the same tuning as the
// neurons.me index / .me docs orb: full opacity, a faint halo instead of the widget's glow pulse, a gentle float scaled to the slot, the
// ring at 80% of the orb (near its edge) with the dot at 22% of the ring, and ring box + ring inheriting the orb's
// animated border-radius so the ring morphs with the outer circle. The orb is drawn at its real pixel size (crisp).
import { Box } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Monad from "../monad.ai/monad.ai";
import type { JsonSearchMonadIcon } from "./SearchBar.types";

const BLOB: Record<string, string> = {
  "0%,100%": "50%",
  "25%": "55% 45% 60% 40% / 60% 55% 45% 40%",
  "50%": "50% 60% 40% 55% / 55% 40% 60% 45%",
  "75%": "45% 55% 40% 60% / 40% 60% 55% 50%",
};
const LIFT: Record<string, [number, number]> = { "0%,100%": [0, 1], "25%": [-2, 1.02], "50%": [-3, 1.04], "75%": [-2, 1.02] };

// variant "bubble" (the monad entry): the monad.ai bubble tuned as on the neurons.me index monad.ai card. The widget
// draws a fixed 60px orb, so a 60px stage is scaled into the slot; full opacity, a faint halo instead of its glow
// pulse, a gentle float, and (texture "matte") its inner light replaced by a flat matte with a faint grain whose
// layers are inset and faded out at the edge, so there is no inner disc. Its pixel grid, lava and breath keep moving.
const ORB = "& div:has(> div[aria-hidden=true])";
const INNER = `${ORB} > div[aria-hidden=true]:first-of-type`;
function matteTexture(dark: boolean) {
  const tint = dark ? "255,255,255" : "0,60,80";
  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${dark ? 1 : 0} 0 0 0 0 ${dark ? 1 : 0.24} 0 0 0 0 ${dark ? 1 : 0.31} 0 0 0 ${dark ? 0.16 : 0.2} 0'/%3E%3C/filter%3E%3Crect width='64' height='64' filter='url(%23n)'/%3E%3C/svg%3E")`;
  return {
    [INNER]: { inset: "9px !important", WebkitMaskImage: "radial-gradient(circle, #000 38%, transparent 70%)", maskImage: "radial-gradient(circle, #000 38%, transparent 70%)" },
    [`${ORB}::before`]: { display: "none" },
    [`${INNER} > div:first-of-type`]: { background: `${grain}, rgba(${tint},${dark ? 0.035 : 0.04}) !important`, backgroundSize: "32px 32px, auto", boxShadow: "none !important" },
    [`${INNER} > div:last-of-type`]: { display: "none" },
  };
}

function BubbleIcon({ monad, size, label }: { monad: JsonSearchMonadIcon; size: number; label?: string }) {
  // orb at 85% of the slot: room for the float (≤3px × 1.04 at a 48px orb, scaled) inside the slot
  const orb = Math.max(12, Math.round(size * 0.85));
  const k = orb / 60;
  const lift = (v: number) => (v * (orb / 48)) / k; // stage px for a slot-px lift
  return (
    <Box
      role="img"
      aria-label={label}
      sx={(t: Theme) => {
        const dark = t.palette.mode === "dark";
        const halo = dark ? "159,246,255" : "0,90,122";
        return {
          position: "relative", zIndex: 0, isolation: "isolate", width: size, height: size, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
          "@keyframes sbMonadOrbFloat": Object.fromEntries(
            Object.keys(BLOB).map((p) => [p, { transform: `translateY(${lift(LIFT[p][0])}px) scale(${LIFT[p][1]})`, borderRadius: BLOB[p] }]),
          ),
          "@keyframes sbMonadOrbHalo": { "0%,100%": { boxShadow: `0 0 3px rgba(${halo},0.14)` }, "50%": { boxShadow: `0 0 5px rgba(${halo},0.22)` } },
          "& .monad-tooltip": { display: "none" },
          [ORB]: { opacity: "1 !important", animation: "sbMonadOrbFloat 6s ease-in-out infinite, sbMonadOrbHalo 4.5s ease-in-out infinite !important", "&:hover": { transform: "none" } },
          ...(monad.texture === "widget" ? {} : matteTexture(dark)),
        };
      }}
    >
      <Box sx={{ width: 60, height: 60, flexShrink: 0, transform: `scale(${k})`, display: "flex" }}>
        <Monad variant="bubble" kind={monad.kind ?? "monad"} seed={monad.seed} mode="contained" />
      </Box>
    </Box>
  );
}

export default function SearchBarMonadIcon({ monad, size, label }: { monad: JsonSearchMonadIcon; size: number; label?: string }) {
  if (monad.variant === "bubble") return <BubbleIcon monad={monad} size={size} label={label} />;
  // The float lifts up to 3px × 1.04 at a 48px orb; keep that headroom inside the slot.
  const orb = Math.max(12, Math.round(size / 1.1));
  const f = orb / 48;
  const px = (v: number) => `${Math.round(v * f * 100) / 100}px`;
  return (
    <Box
      role="img"
      aria-label={label}
      sx={(t: Theme) => {
        const dark = t.palette.mode === "dark";
        const halo = dark ? "255,255,255" : "0,90,122";
        return {
          position: "relative",
          zIndex: 0,
          isolation: "isolate",
          width: size,
          height: size,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          "@keyframes sbMeOrbFloat": Object.fromEntries(
            Object.keys(BLOB).map((k) => [k, { transform: `translateY(${px(LIFT[k][0])}) scale(${LIFT[k][1]})`, borderRadius: BLOB[k] }]),
          ),
          "@keyframes sbMeOrbHalo": {
            "0%,100%": { boxShadow: `0 0 ${px(2)} rgba(${halo},0.10)` },
            "50%": { boxShadow: `0 0 ${px(4)} rgba(${halo},0.16)` },
          },
          "& > div": { width: orb, height: orb, flex: "none", display: "flex" },
          "& .monad-tooltip": { display: "none" },
          "& div": { opacity: "1 !important" },
          "& div:has(> div[aria-hidden=true])": {
            animation: "sbMeOrbFloat 6s ease-in-out infinite, sbMeOrbHalo 4.5s ease-in-out infinite !important",
            "&:hover": { transform: "none" },
          },
          "& div[aria-hidden=true]": { width: "80% !important", height: "80% !important", borderRadius: "inherit" },
          "& div[aria-hidden=true] > div:first-of-type": {
            borderRadius: "inherit !important",
            borderWidth: `${Math.max(1.5, Math.round(2.5 * f * 10) / 10)}px !important`,
            boxShadow: dark ? `0 0 ${px(3)} rgba(180,230,230,0.22) !important` : `0 0 ${px(3)} rgba(0,90,122,0.18) !important`,
          },
          "& div[aria-hidden=true] > div:last-of-type": {
            width: "22% !important",
            height: "22% !important",
            boxShadow: dark ? `0 0 ${px(3)} rgba(234,252,250,0.35) !important` : `0 0 ${px(3)} rgba(0,90,122,0.3) !important`,
          },
        };
      }}
    >
      <Box>
        <Monad
          variant="identity"
          kind={monad.kind ?? "me"}
          seed={monad.seed}
          mode="contained"
          size={Math.round((orb * 34) / 60)}
        />
      </Box>
    </Box>
  );
}
