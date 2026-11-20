// ServiceIcons.tsx — monochrome brand glyphs (currentColor) for the
// third-party services a keychain can hold keys for. Simplified marks,
// drawn inline so they follow the theme's text color like the Icon set.
// `brand` colors a saved service's mark (Facebook / Instagram while their connection is live).
import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import type { ServiceId } from './serviceKeyVault';

const PATHS: Record<Exclude<ServiceId, 'paypalLive'>, string> = {
  // Twitch: speech-bubble screen with two bars.
  twitch: 'M4.3 2 3 5.4V19h4.6v2.5h2.6L12.7 19h3.7L21 14.4V2H4.3Zm15 11.6-2.9 2.9h-4.6l-2.5 2.5v-2.5H5.6V3.7h13.7v9.9ZM16.4 6.6v5h-1.7v-5h1.7Zm-4.6 0v5h-1.7v-5h1.7Z',
  // PayPal: stylised double "P".
  paypal: 'M7.2 21.5H3.6L6.6 2.5h7.2c3.6 0 5.6 1.9 5 5-.6 3.6-3.2 5.4-6.8 5.4H9.6l-1.1 6.5-.1.6Zm3-11.5h1.9c1.8 0 3-.8 3.3-2.6.2-1.4-.6-2.1-2.2-2.1h-2.1L10.2 10Z M9 21.5l.3-1.9h2.5l1-6h2.2c3.5 0 5.6-1.9 6.1-5.1.2-1.2 0-2.2-.5-3 1.9 1 2.6 2.8 2.2 5.1-.6 3.4-3 5.4-6.4 5.4h-1.4l-1 5.5H9Z',
  // Instagram: rounded square, lens ring and the flash dot.
  instagram: 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.3-3.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z',
  // Threads: the looping "@"-like mark (ring with an inner hook).
  threads: 'M12 2a10 10 0 1 0 6.3 17.8l-1.3-1.6A8 8 0 1 1 20 12c0 1.9-.9 3-2.1 3-1 0-1.6-.7-1.6-2V8h-2v.9A4.5 4.5 0 1 0 14.6 16c.6 1.2 1.8 1.9 3.3 1.9 2.4 0 4.1-2.1 4.1-5.1A10 10 0 0 0 12 2Zm0 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
  // npm: the block "n" in a wide box.
  npm: 'M2 7h20v9H11v1.5H7V16H2V7Zm1.5 1.5v6H6V10h1.5v4.5H9v-6H3.5Zm7 0V16H13v-1.5h2.5v-6h-5Zm2.5 1.5h1v3h-1v-3Zm4-1.5v6h2.5V10H20v4.5h1.5v-6H17Z',
  // Meta: infinity loop.
  meta: 'M6.9 6C4 6 2 9.2 2 12.6 2 15.4 3.5 17.5 5.8 17.5c1.9 0 3.2-1.3 4.9-4.1l1.3-2.1 1.3 2.1c1.7 2.8 3 4.1 4.9 4.1 2.3 0 3.8-2.1 3.8-4.9C22 9.2 20 6 17.1 6c-1.8 0-3.2 1.3-5.1 4.2C10.1 7.3 8.7 6 6.9 6Zm-.2 2.2c1.1 0 2 1 3.9 3.9l-1.2 2c-1.3 2.1-2.2 3.1-3.3 3.1-1.1 0-1.8-1.1-1.8-2.8 0-2.6 1.1-6.2 2.4-6.2Zm10.6 0c1.3 0 2.4 3.6 2.4 6.2 0 1.7-.7 2.8-1.8 2.8-1.1 0-2-1-3.3-3.1l-1.2-2c1.9-2.9 2.8-3.9 3.9-3.9Z',
  // Google: the "G" ring with its crossbar.
  // Google: drawn as a stroked "G" (see STROKED below); this entry is the stroke path.
  google: 'M19.2 7.6A8.5 8.5 0 1 0 20.5 12H12.5',
  // OpenAI: simplified hexagonal knot (outer hexagon ring + inner hexagon).
  openai: 'M12 1.5 21.1 6.75v10.5L12 22.5l-9.1-5.25V6.75L12 1.5Zm0 2.3L4.9 7.9v8.2l7.1 4.1 7.1-4.1V7.9L12 3.8Zm0 4.2 3.5 2v4l-3.5 2-3.5-2v-4l3.5-2Z',
  // LinkedIn: rounded square with "in" knocked out.
  linkedin: 'M4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2ZM5.5 9.5v9h3v-9h-3Zm1.5-4.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm3.5 4.3v9h3v-4.6c0-1.3.6-2.1 1.7-2.1 1 0 1.5.7 1.5 2.1v4.6h3v-5.4c0-2.6-1.4-3.8-3.4-3.8-1.4 0-2.4.7-2.8 1.4V9.5h-3Z',
  // xAI / Grok: a bold diagonal "X" (two crossing bars).
  grok: 'M3 3h4.2l13.8 18h-4.2L3 3Zm14.6 0h3.4l-6.6 8.6-1.7-2.2L17.6 3ZM9.3 14.6l1.7 2.2L7.4 21H4l5.3-6.4Z',
  // GitHub: octocat-like silhouette in a circle (simplified).
  github: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z',
  // Facebook: circle with an "f" knocked out.
  facebook: 'M12 2a10 10 0 0 0-1.6 19.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 12 2Z',
  // WhatsApp: speech bubble with a handset knocked out.
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm-3.1 5.3c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.2.3 0 .6.5.8 1.1 1.5 1.8 2.1.8.7 1.5 1 1.8 1.1.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.8-.2 1.5-.3.7-1.6 1.4-2.2 1.4-.6.1-1.2.3-4-.8-3.3-1.3-5.4-4.7-5.6-4.9-.2-.2-1.3-1.8-1.3-3.4 0-1.6.8-2.4 1.2-2.7.3-.3.6-.4.8-.4h.6Z',
  // SMS: chat bubble with three dots knocked out.
  sms: 'M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2Zm4 7a1.4 1.4 0 1 0 0 2.8A1.4 1.4 0 0 0 8 10Zm4 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Zm4 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z',
};

const STROKED: Partial<Record<ServiceId, number>> = { google: 3.2 };
/** Ids that share another's mark (PayPal Live = the PayPal mark). */
const SAME_AS: Partial<Record<ServiceId, Exclude<ServiceId, 'paypalLive'>>> = { paypalLive: 'paypal' };

/**
 * Brand colors, used only with `brand` (a live connection). Only the glyph is colored, never a filled background;
 * the same values read on light and dark themes. Instagram's mark gets its gradient through an SVG paint server.
 */
export const BRAND_COLORS: Partial<Record<ServiceId, string>> = {
  facebook: '#1877F2', instagram: '#E4405F', twitch: '#9146FF', paypal: '#003087', paypalLive: '#003087',
  whatsapp: '#25D366', google: '#4285F4', linkedin: '#0A66C2', npm: '#CB3837', sms: '#F22F46',
  // openai, grok (xAI), github, threads, meta: monochrome marks, they follow the text color.
};
/** Dark theme: a brand color too dark to read on a dark background uses the brand's own lighter tone. */
export const BRAND_COLORS_DARK: Partial<Record<ServiceId, string>> = { paypal: '#009CDE', paypalLive: '#009CDE' };
const INSTAGRAM_STOPS: readonly [number, string][] = [[0, '#F58529'], [0.35, '#DD2A7B'], [0.7, '#8134AF'], [1, '#515BD4']];

export function ServiceIcon({ service: id, size = '1.25rem', title, brand = false }: { service: ServiceId; size?: string | number; title?: string; brand?: boolean }) {
  const service = (SAME_AS[id] ?? id) as Exclude<ServiceId, 'paypalLive'>;
  const gradientId = `svc-ig-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const dark = useTheme().palette.mode === 'dark';
  const color = BRAND_COLORS[id] ?? BRAND_COLORS[service];
  const colored = brand && Boolean(color);
  const paint = !colored ? 'currentColor' : service === 'instagram' ? `url(#${gradientId})` : (dark && (BRAND_COLORS_DARK[id] ?? BRAND_COLORS_DARK[service])) || color!;
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill={paint} fillRule="evenodd"
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}
      data-service-icon={id} data-brand={colored ? 'on' : undefined}
    >
      {title && <title>{title}</title>}
      {colored && service === 'instagram' && (
        <defs>
          {/* Bottom-left → top-right, like the Instagram mark. */}
          <linearGradient id={gradientId} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            {INSTAGRAM_STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
          </linearGradient>
        </defs>
      )}
      {STROKED[service]
        ? <path d={PATHS[service]} fill="none" stroke={paint} strokeWidth={STROKED[service]} strokeLinecap="butt" />
        : <path d={PATHS[service]} />}
    </svg>
  );
}

export default ServiceIcon;
