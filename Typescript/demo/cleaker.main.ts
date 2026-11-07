// The Cleaker playground (demo/cleaker.html): mounts Cleaker from SOURCE, so an edit reloads this page.
//   ?corner=top-left   the author's default corner
//   ?namespace=        start with none (absent: cleaker.me)
//   ?reset             forget the person's choices (corner, namespace, bars) kept in this browser
import { mountCleaker, type CleakerCorner } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';

const params = new URLSearchParams(window.location.search);
if (params.has('reset')) {
  for (const key of ['cleaker:corner', 'cleaker:namespace', 'cleaker:bars']) {
    try { localStorage.removeItem(key); } catch { /* blocked storage */ }
  }
}
const inline = document.querySelector('script[type="application/json"][data-cleaker-document]');
const handle = mountCleaker({
  corner: (params.get('corner') as CleakerCorner) || undefined,
  namespace: params.has('namespace') ? params.get('namespace') : undefined,
  document: inline?.textContent ? JSON.parse(inline.textContent) : undefined,
});
(window as unknown as { cleaker: typeof handle }).cleaker = handle;   // for poking at it from the console
