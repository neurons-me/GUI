// logsFlow.main.tsx — REAL browser verification harness for the "netget
// role" side of the logs viewer's admin sign-in (see
// backend/dev-harness/logs-harness-server.mjs for the disposable
// monad + real /logs + /admin-session backend this points at, and
// demo/claimFlow.main.tsx's existing CleakerRole for the "Cleaker role"
// side — reused unchanged here, just pointed at this harness via its
// own ?harness= param).
//
// This mounts the real LogsView exactly as MainServer/Logs stories do,
// just against a real disposable backend instead of a fetch stub.
// Never a mock: clicking "Sign in as admin" performs the real
// cross-origin redirect to CleakerNetgetAdminSignView, a real key signs
// a real challenge, and the returned session is used for a real
// authenticated /logs read.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import LogsView from '@/gui/All.This/netget/MainServer/LogsView';

const params = new URLSearchParams(window.location.search);
const endpoint = params.get('endpoint') || 'http://127.0.0.1:4602';

createRoot(document.getElementById('root')!).render(
  <Theme>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <LogsView endpoint={endpoint} />
    </div>
  </Theme>,
);
