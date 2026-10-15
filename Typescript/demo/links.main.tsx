// links.main.tsx — the harness for tests/integration/links.browser.test.mjs.
//
// Mounts the REAL <Cleaker> exactly as netget's App.jsx does (<Me><Cleaker namespace transport semanticPath/></Me>), and
// nothing else. No fetch is replaced here: the transports are controlled by the test runner at the network layer
// (Playwright routes), so every request the real components make goes where a real one would and is counted there.
//
//   ?ns=<namespace>&transport=<origin>     the link the page opens with
//
// `window.__harness.setSemanticPath(p)` is the app declaring where in the namespace it is (what a real app does by
// passing `semanticPath`), so the test can move that path without touching the URL.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import { Me } from '@/react/Me';
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';

const params = new URLSearchParams(window.location.search);
// The identity card is a page of the namespace, at /.me; start there so the form is what the test drives.
if (window.location.pathname !== '/.me') window.history.replaceState(null, '', `/.me${window.location.search}`);

function App() {
  const [semanticPath, setSemanticPath] = React.useState('/');
  (window as any).__harness = { setSemanticPath, semanticPath };
  return (
    <Theme>
      <Me>
        <Cleaker
          namespace={params.get('ns') || 'a.test'}
          transport={params.get('transport') || 'http://a.test'}
          semanticPath={semanticPath}
          namespaceSource="declared"
        />
      </Me>
    </Theme>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
