// The Cleaker playground (demo/cleaker.html): mounts Cleaker from SOURCE, so an edit reloads this page.
//   ?corner=top-left   the author's default corner
//   ?namespace=        start with none (absent: cleaker.me)
//   ?reset             forget the person's choices (corner, namespace, bars) kept in this browser
//   ?plain             the earlier hand-drawn corner (cleakerCorner.ts), to compare
import { mountCleaker, type CleakerCorner } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';
import { mountCleakerGui } from '@/gui/All.This/Cleaker/Corner/CleakerCornerGui';

const params = new URLSearchParams(window.location.search);
if (params.has('reset')) {
  for (const key of ['cleaker:corner', 'cleaker:namespace', 'cleaker:bars']) {
    try { localStorage.removeItem(key); } catch { /* blocked storage */ }
  }
}
const corner = (params.get('corner') as CleakerCorner) || undefined;
const namespace = params.has('namespace') ? params.get('namespace') : undefined;
const inline = document.querySelector('script[type="application/json"][data-cleaker-document]');
const doc = inline?.textContent ? JSON.parse(inline.textContent) : undefined;
if (params.has('plain')) mountCleaker({ corner, namespace, document: doc });
else mountCleakerGui({ corner, namespace, document: doc });
