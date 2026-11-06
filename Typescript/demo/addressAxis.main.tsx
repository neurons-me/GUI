// addressAxis.main.tsx — the harness for tests/integration/addressAxis.browser.test.mjs.
//
// The REAL <Cleaker> (as netget mounts it), opened on a page of the GUI (`?path=/GUI/layout`, default), so the test can
// measure the address in the top bar against the page's first lines. The transport is a name nothing answers for; the
// test aborts its requests at the network layer, so the address reads `? @ <host>` as it does when no .me answers.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import Theme from '@/gui/Theme/Theme';
import { Me } from '@/react/Me';
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';

const params = new URLSearchParams(window.location.search);
const path = params.get('path') || '/GUI/layout';
if (window.location.pathname !== path) window.history.replaceState(null, '', `${path}${window.location.search}`);

createRoot(document.getElementById('root')!).render(
  <Theme>
    <Me>
      <Cleaker namespace={params.get('ns') || 'axis.test'} transport={params.get('transport') || 'http://axis.test'} namespaceSource="address" />
    </Me>
  </Theme>,
);
