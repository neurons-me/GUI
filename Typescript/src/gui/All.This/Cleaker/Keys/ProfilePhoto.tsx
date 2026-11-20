// ProfilePhoto.tsx — the public profile picture for an automatic key (meta.user, a Page, an Instagram account), square like the tree's
// tiles. It loads only an https URL on Facebook's own hosts (or an inline data: image, for fixtures), with no referrer
// and no credentials; if the URL is missing, unsafe or fails to load, the fallback icon shows instead.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import { safeProfilePicture } from './facebookConnect';

/** The picture URL we are willing to load, or undefined. */
export function profilePhotoSrc(src: unknown): string | undefined {
  if (typeof src === 'string' && /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/.test(src) && src.length < 20_000) return src;
  return safeProfilePicture(src);
}

export default function ProfilePhoto({ src, size = 26, fallback = 'account_circle', fallbackNode, label }: {
  src?: string; size?: number; fallback?: string;
  /** Shown instead of the fallback icon when the photo is missing or fails (e.g. the node's own Facebook / key icon). */
  fallbackNode?: React.ReactNode; label?: string;
}) {
  const safe = profilePhotoSrc(src);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [safe]);
  if (!safe || failed) return fallbackNode !== undefined ? <>{fallbackNode}</> : <Icon name={fallback} fontSize="1.25rem" />;
  return (
    <Box
      component="img" src={safe} alt={label ?? ''} aria-hidden={label ? undefined : true} data-profile-photo
      referrerPolicy="no-referrer" loading="lazy" decoding="async" draggable={false}
      onError={() => setFailed(true)}
      sx={{ width: size, height: size, display: 'block', objectFit: 'cover', borderRadius: 0.5, flex: 'none' }}
    />
  );
}
