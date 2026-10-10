// SearchBarMonadIcon — the live .GUI orb (Monad) as a search item icon.
// Used when an index entry declares `icon.monad` (e.g. the .me root entry). Same tuning as the neurons.me index /
// .me docs orb: full opacity, a faint halo instead of the widget's glow pulse, a gentle float scaled to the slot, the
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

export default function SearchBarMonadIcon({ monad, size, label }: { monad: JsonSearchMonadIcon; size: number; label?: string }) {
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
          variant={monad.variant ?? "identity"}
          kind={monad.kind ?? "me"}
          seed={monad.seed}
          mode="contained"
          size={Math.round((orb * 34) / 60)}
        />
      </Box>
    </Box>
  );
}
