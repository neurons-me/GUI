// MonadOrbIcon -- the monad.ai orb (the identicon bubble of gui/All.This/monad.ai) at icon size, for places that name an
// icon by string: `icon: "orb:monad"` in a left-bar item. It is the SAME component the Monad surface shows (kind="monad",
// contained), drawn at its own 60px and scaled to the icon box, so the rail and the surface cannot drift into two orbs.
//
// Loaded lazily (IconRegistry): monad.ai pulls in the QR and the identicon hashing, none of which an icon registry
// should drag into every consumer.
import * as React from 'react';
import Monad from '@/gui/All.This/monad.ai/monad.ai';

const ORB_NATIVE_SIZE = 60;
const ORB_ICON_SIZE = 24;
/**
 * The orb is a bare circle with a hairline: at the same box as a glyph it reads smaller than the glyphs around it, and the
 * monad is the one thing the rail names by its own picture, so it is drawn larger than the icon box it is asked for.
 * The box itself grows with it (the rail lays it out at this size), it is not a visual overflow.
 */
const ORB_RAIL_SCALE = 1.5;
/** Tone of the orb in the rail: stronger than the badge's 0.3-0.5 glow cycle, short of full (which read as heavy). */
const ORB_ICON_OPACITY = 0.72;
/** The circumference line, in px AT ICON SIZE (the orb's own geometry is 60px and is scaled down). A hairline, no halo. */
const ORB_ICON_RING_PX = 1;

export type MonadOrbIconProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** The glyph size the registry asks for, in px (default 24, like a Material icon). The orb is drawn ORB_RAIL_SCALE times that. */
  fontSize?: number | string;
  /** true = green/online, false = red/offline, null/undefined = the default glow. */
  healthy?: boolean | null;
  label?: string;
};

export default function MonadOrbIcon({ fontSize, healthy = null, label = 'monad.ai', className, style, ...rest }: MonadOrbIconProps) {
  const base = typeof fontSize === 'number' ? fontSize : Number.parseFloat(String(fontSize ?? '')) || ORB_ICON_SIZE;
  const size = Math.round(base * ORB_RAIL_SCALE);
  const scale = size / ORB_NATIVE_SIZE;
  // name/iconColor/weight/... come through the registry's props: only the span's own attributes are kept
  const { name: _n, iconColor: _c, weight: _w, fill: _f, grade: _g, opticalSize: _o, ...domProps } = rest as any;
  return (
    <span
      {...domProps}
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', position: 'relative', width: size, height: size, flexShrink: 0, ...style }}
    >
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: ORB_NATIVE_SIZE,
          height: ORB_NATIVE_SIZE,
          marginLeft: -ORB_NATIVE_SIZE / 2,
          marginTop: -ORB_NATIVE_SIZE / 2,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <Monad mode="contained" kind="monad" label={label} healthy={healthy} solid={ORB_ICON_OPACITY} ring={ORB_ICON_RING_PX / scale} core="flat" scale={scale} tooltip={false} />
      </span>
    </span>
  );
}
