// A SITE (any origin) whose identity QR (AppShell's corner mark) connects the person's .me: AppShell `identityConnect`
// (useMeConnect). Tests only (tests/integration/connectMe.browser.test.mjs):
//   /connectMe.html?agent=<agent page URL>&root=<namespace root>&audience=<monad audience>[&monad=<monad address>]
//     [&ttl=<proof lifetime ms>] [&delayMs=<wait before sending the proof -- TEST ONLY>]
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import ME from 'this.me';
import { AppShell } from '@/runtime/AppShell';
import type { AppDeclaration } from '@/runtime/mountApp';
import { RunMe } from '@/runtime/run-me';
import { BarBrandCell, QrBadge, SiteBrand } from '@/gui/Layout/Position/Position';

const p = new URLSearchParams(window.location.search);
const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
const root = p.get('root') || 'cleaker.me';

function SiteHome() {
  return <main style={{ padding: '48px 32px', font: '600 22px system-ui' }}>A site</main>;
}
const APP: AppDeclaration = { id: 'site', namespace: 'apps.site', title: 'A site', theme: 'neurons.me', views: { home: SiteHome } };

function Site() {
  // PUBLIC demo seed for the page's own local state only: not an identity, grants no authority.
  const me = React.useMemo(() => new ME('connect-me-demo:site') as any, []);
  const runtime = React.useMemo(() => RunMe(me), [me]);
  return (
    <AppShell
      app={APP}
      me={me}
      runtime={runtime}
      devtools={false}
      navItems={[{ route: 'home', label: 'Home', icon: 'home' }]}
      position={`${root} @ ${window.location.host}`}
      brand={<SiteBrand label="A site" href="#" />}
      identity={(
        <BarBrandCell component="button" type="button" title="your .me" data-gui-node-id="GUI.window.layout.marks.identity" sx={{ width: 48, height: 48, minWidth: 48, flex: 'none' }}>
          <QrBadge value={`https://${root}`} status="confirmed" clickFlip={false} hoverFlip={false} cursor="pointer" />
        </BarBrandCell>
      )}
      identityUsername="demo"
      identityConnect={{
        agentUrl: p.get('agent') || '',
        root,
        audience: p.get('audience') || '',
        monad: p.get('monad') || undefined,
        ttlMs: num('ttl'),
        delayMs: num('delayMs'),
      }}
    />
  );
}

createRoot(document.getElementById('root')!).render(<Site />);
