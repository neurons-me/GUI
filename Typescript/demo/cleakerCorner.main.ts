// Mounts Cleaker's corner the way an app would (`this.gui/cleaker`), configured by the query string:
//   /cleakerCorner.html?corner=bottom-left&namespace=cleaker.me
import { mountCleaker, type CleakerCorner } from '@/gui/All.This/Cleaker/Corner/cleakerCorner';

const params = new URLSearchParams(window.location.search);
const handle = mountCleaker({
  corner: (params.get('corner') as CleakerCorner) || undefined,
  namespace: params.get('namespace'),
});
(window as unknown as { __events: string[] }).__events = [];
handle.host.addEventListener('cleaker:namespace', (e) => (window as unknown as { __events: string[] }).__events.push((e as CustomEvent).detail.namespace));
