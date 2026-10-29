import React from 'react';
import Box from '@mui/material/Box';

/**
 * Official Twitch brand marks, inlined from codex-me ui/assets (unmodified geometry from
 * https://brand.twitch.com/, Twitch-Brand.zip, downloaded 2026-10-27). Twitch and its logos are
 * trademarks of Twitch Interactive, Inc.; used here only to identify the Twitch integration.
 */
export function TwitchGlitch({ size = 18 }: { size?: number }) {
  return (
    <Box component="svg" viewBox="0 0 2400 2800" aria-hidden sx={{ width: size, height: size * 7 / 6, display: 'block', flexShrink: 0 }}>
      <polygon fill="#FFFFFF" points="2200,1300 1800,1700 1400,1700 1050,2050 1050,1700 600,1700 600,200 2200,200" />
      <path fill="#9146FF" d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600V1300z" />
      <rect fill="#9146FF" x="1700" y="550" width="200" height="600" />
      <rect fill="#9146FF" x="1150" y="550" width="200" height="600" />
    </Box>
  );
}

/** Flat wordmark; fill follows currentColor (codex-me swaps the black/white files by mode). */
export function TwitchWordmark({ width = 52 }: { width?: number }) {
  return (
    <Box component="svg" viewBox="0 0 8192 2500" role="img" aria-label="Twitch" sx={{ width, height: 'auto', display: 'block', flexShrink: 0, fill: 'currentColor' }}>
      <polygon points="596,840 595.8,319.1 0,319.1 0,1883 297.9,2180.9 1117,2181 1117,1585 596,1585 596,1436 1117,1436 1117,840" />
      <polygon points="2755,840 2755,1585 2606,1585 2606,840 2011,840 2011,1585 1862,1585 1862,840 1266,840 1266,1883 1563.9,2180.9 3351,2181 3351,840" />
      <polygon points="3500,840 4096,840 4096,2180.9 3500.2,2180.9" />
      <polygon points="3500.2,319.1 4096,319.1 4096,692 3500,692" />
      <polygon points="5809,840 5511,1138.3 5511,1883 5808.9,2180.9 6703,2181 6703,1585 6107,1585 6107,1436 6703,1436 6703,840" />
      <polygon points="7894,840 7448,840 7448,319 6852,319 6852,2181 7447,2181 7447,1436 7596,1436 7596,2181 8192,2180.9 8192,1138.3" />
      <polygon points="4841,840 4840.7,319.1 4245,319 4245,1883 4542.8,2180.9 5362,2180.9 5362,1585.1 4841,1585 4841,1436 5362,1436 5362,840" />
    </Box>
  );
}
