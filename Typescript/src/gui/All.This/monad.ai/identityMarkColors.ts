import { alpha } from "@mui/material/styles";

/** Ring + center-dot colours for the identity .me mark. Ink is palette.primary (or error when unhealthy). */
export function identityMarkColors(ink: string, mode: string) {
  const light = mode === "light";
  return {
    ringColor: alpha(ink, light ? 0.7 : 0.85),
    ringShadow: light ? `0 0 10px ${alpha(ink, 0.3)}` : `0 0 12px ${alpha(ink, 0.4)}`,
    dotFill: ink,
    dotShadow: light ? `0 0 8px ${alpha(ink, 0.55)}` : `0 0 10px ${alpha(ink, 0.75)}`,
  };
}
