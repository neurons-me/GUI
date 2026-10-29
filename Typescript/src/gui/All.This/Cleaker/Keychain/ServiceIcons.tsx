// ServiceIcons.tsx — monochrome brand glyphs (currentColor) for the
// third-party services a keychain can hold keys for. Simplified marks,
// drawn inline so they follow the theme's text color like the Icon set.
import * as React from 'react';
import type { ServiceId } from './serviceKeyVault';

const PATHS: Record<ServiceId, string> = {
  // Twitch: speech-bubble screen with two bars.
  twitch: 'M4.3 2 3 5.4V19h4.6v2.5h2.6L12.7 19h3.7L21 14.4V2H4.3Zm15 11.6-2.9 2.9h-4.6l-2.5 2.5v-2.5H5.6V3.7h13.7v9.9ZM16.4 6.6v5h-1.7v-5h1.7Zm-4.6 0v5h-1.7v-5h1.7Z',
  // PayPal: stylised double "P".
  paypal: 'M7.2 21.5H3.6L6.6 2.5h7.2c3.6 0 5.6 1.9 5 5-.6 3.6-3.2 5.4-6.8 5.4H9.6l-1.1 6.5-.1.6Zm3-11.5h1.9c1.8 0 3-.8 3.3-2.6.2-1.4-.6-2.1-2.2-2.1h-2.1L10.2 10Z M9 21.5l.3-1.9h2.5l1-6h2.2c3.5 0 5.6-1.9 6.1-5.1.2-1.2 0-2.2-.5-3 1.9 1 2.6 2.8 2.2 5.1-.6 3.4-3 5.4-6.4 5.4h-1.4l-1 5.5H9Z',
  // Meta: infinity loop.
  meta: 'M6.9 6C4 6 2 9.2 2 12.6 2 15.4 3.5 17.5 5.8 17.5c1.9 0 3.2-1.3 4.9-4.1l1.3-2.1 1.3 2.1c1.7 2.8 3 4.1 4.9 4.1 2.3 0 3.8-2.1 3.8-4.9C22 9.2 20 6 17.1 6c-1.8 0-3.2 1.3-5.1 4.2C10.1 7.3 8.7 6 6.9 6Zm-.2 2.2c1.1 0 2 1 3.9 3.9l-1.2 2c-1.3 2.1-2.2 3.1-3.3 3.1-1.1 0-1.8-1.1-1.8-2.8 0-2.6 1.1-6.2 2.4-6.2Zm10.6 0c1.3 0 2.4 3.6 2.4 6.2 0 1.7-.7 2.8-1.8 2.8-1.1 0-2-1-3.3-3.1l-1.2-2c1.9-2.9 2.8-3.9 3.9-3.9Z',
};

export function ServiceIcon({ service, size = '1.25rem', title }: { service: ServiceId; size?: string | number; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="currentColor" fillRule="evenodd"
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}
      data-service-icon={service}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[service]} />
    </svg>
  );
}

export default ServiceIcon;
