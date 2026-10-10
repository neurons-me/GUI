// Reading by address: `me://ana.a-test.local:read/battery` names a namespace, a user and a path. The runtime resolves it
// with what already exists: cleaker's `parseTarget` for the expression and the `monad` client of an open link of the
// context that serves that root. It copies nothing into any kernel.
//
//   expression ──parseTarget──▶ { namespace, path }
//   namespace  ──a link of THIS context whose root serves it──▶ GET <its transport>/<path>?namespace=<namespace>
//   the answer ──▶ one of the statuses below; none of them is folded into another.
//
// What this does not do:
//   * It is not authorization. A read through the ledger is anonymous: the link supplies a transport, never a proof. What
//     two readers can open differs only by the keys they hold (audience envelopes), never by this function.
//   * It does not discover who serves a root. A root no open link of the context serves is `no_link`, said as such.
//   * It never uses another context's links, and never "the last link opened".
//
// `self` (and `local`) is the context's own `.me`, the one `<Me>` provides: `me://self:read/bateria` reads that kernel
// in place, with no link, no network and no copy into any ledger. Those are local facts: written by whoever owns the
// `<Me>`, readable by everything under it, and NOT authenticated (a declared username is context, not proof of who is
// here), so nothing that reads them should present them as verified claims about the actor.
//
// What is lent is the PUBLIC VIEW of that kernel, the same thing a stranger would get from a ledger (the kernel's own
// `exportSnapshot()`, which carries no secret material, hydrated into a scratch kernel): a path under a secret scope
// reads as nothing, as it does there. Reading with the owner's keys stays what it always was, direct access to the
// kernel by the page's own code. Nothing under a `<Me>` (a link's interface, an agent) gets it through this function.
import ME from 'this.me';
import { parseTarget } from 'cleaker';
import { readMeValue } from '@/runtime/run-me';
import type { SeedSession } from './createSeedSession';
import { MonadClientError } from './monadClient';
import { openLinksOf, type OpenLink } from './heldIdentities';
import type { AudienceEnvelope } from './audienceWrite';

export type AddressReadOptions = {
  /**
   * Which link to read through, when more than one serves the root and they do not reach it the same way: the link
   * itself or its namespace. It must be one of the context's open links that serves the address's root.
   */
  via?: SeedSession | string | null;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

type Where = { namespace: string; path: string };

export type AddressRead =
  /** The value is readable. `via` is the link's namespace, or `self` for a fact of the context's own `.me`. */
  | ({ status: 'public'; value: unknown; via: string } & Where)
  /** What the ledger holds is an audience envelope: ciphertext, readable by anyone, openable only with a key (`openEnvelope`). */
  | ({ status: 'sealed'; envelope: AudienceEnvelope; via: string } & Where)
  /** The ledger does not disclose it: for every reader, the owner's own session included. */
  | ({ status: 'closed'; via: string } & Where)
  /** Nothing is there. */
  | ({ status: 'absent'; via: string } & Where)
  /** No open link of this context serves that root. `held` lists the roots it does serve. */
  | ({ status: 'no_link'; root: string; held: string[] } & Where)
  /** Several links serve that root through different transports and none was named: say which with `via`. */
  | ({ status: 'ambiguous'; candidates: string[] } & Where)
  /** The expression is not a read of a namespace and a path. */
  | { status: 'invalid_expression'; expression: string; reason: string }
  /** The link answered with an error, or could not be reached (`code` is the client's: NAMESPACE_NOT_SERVED, a network code, …). */
  | ({ status: 'error'; via: string | null; code: string; message: string } & Where);

export function isAudienceEnvelope(value: unknown): value is AudienceEnvelope {
  const v = value as any;
  return !!v && typeof v === 'object' && v.version === 1 && typeof v.audience === 'string' && 'ciphertext' in v && 'tree' in v;
}

// The public view of a local kernel, rebuilt only when the kernel's memories changed.
const PUBLIC_VIEWS = new WeakMap<object, { key: string; view: any }>();
function publicViewOf(kernel: any): any {
  const memories = Array.isArray(kernel.memories) ? kernel.memories : [];
  const key = `${memories.length}:${String(memories[memories.length - 1]?.hash ?? '')}`;
  const cached = PUBLIC_VIEWS.get(kernel);
  if (cached && cached.key === key) return cached.view;
  const view: any = new (ME as any)();
  view.hydrate(kernel.exportSnapshot());
  PUBLIC_VIEWS.set(kernel, { key, view });
  return view;
}

const serves = (link: OpenLink, namespace: string) => namespace === link.root || namespace.endsWith(`.${link.root}`);

/** The link that should carry a read for `namespace`, or why none can. See the rules in `readAddress`. */
export function selectLink(
  links: readonly OpenLink[],
  namespace: string,
  via?: SeedSession | string | null,
): { link: OpenLink } | { none: 'no_link' } | { none: 'ambiguous'; candidates: string[] } | { none: 'via_does_not_serve' } {
  let candidates = links.filter((l) => serves(l, namespace));
  if (candidates.length === 0) return { none: 'no_link' };
  // the most specific root wins (`a.local` over `local`); this is about which root, not about which link
  const longest = Math.max(...candidates.map((l) => l.root.length));
  candidates = candidates.filter((l) => l.root.length === longest);

  if (via) {
    const named = candidates.find((l) => (typeof via === 'string' ? l.namespace === via : l.session === via));
    return named ? { link: named } : { none: 'via_does_not_serve' };
  }
  const exact = candidates.find((l) => l.namespace === namespace);
  if (exact) return { link: exact };
  if (candidates.length === 1) return { link: candidates[0] };
  // several links, same root: a read is anonymous, so links that reach it through the same transport are equivalent and
  // the first by namespace (a sorted list, not an opening order) carries it; otherwise it has to be said.
  const transports = new Set(candidates.map((l) => String(l.session.transportOrigin)));
  if (transports.size === 1) return { link: candidates[0] };
  return { none: 'ambiguous', candidates: candidates.map((l) => l.namespace) };
}

export async function readAddress(
  context: object | null | undefined,
  expression: string,
  options: AddressReadOptions = {},
): Promise<AddressRead> {
  const raw = String(expression ?? '').trim();
  let namespace = '';
  let path = '';
  try {
    const t: any = parseTarget(raw, { defaultMode: 'reactive', allowShorthandRead: true });
    const operation = String(t.operation ?? t.intent?.selector ?? 'read').toLowerCase();
    if (operation !== 'read') {
      return { status: 'invalid_expression', expression: raw, reason: `only reads are resolved by address (got "${operation}")` };
    }
    namespace = String(t.namespace?.fqdn || '').trim().toLowerCase();
    path = String(t.path || '').replace(/^\/+/, '').replace(/\//g, '.');
  } catch (cause) {
    return { status: 'invalid_expression', expression: raw, reason: cause instanceof Error ? cause.message : String(cause) };
  }
  if (!namespace || !path) {
    return { status: 'invalid_expression', expression: raw, reason: namespace ? 'a path is required' : 'a namespace is required' };
  }

  // the context's own `.me`: local facts, read in place
  if (namespace === 'self' || namespace === 'local') {
    if (typeof context !== 'function') {
      // an object that is not a kernel is only a key for the registry: there is no local `.me` to read
      return { status: 'no_link', namespace, path, root: namespace, held: [...new Set(openLinksOf(context).map((l) => l.root))].sort() };
    }
    try {
      const value = readMeValue(publicViewOf(context), path, { allowBarePath: true });
      // The public view answers `undefined` for a path with nothing there and for one under a secret scope; it never
      // says which (that is how a secret scope stays unseen), so neither can this.
      if (value === undefined || value === null) return { status: 'absent', namespace, path, via: 'self' };
      return { status: 'public', namespace, path, via: 'self', value };
    } catch (cause) {
      return { status: 'error', namespace, path, via: 'self', code: 'LOCAL_READ_FAILED', message: cause instanceof Error ? cause.message : String(cause) };
    }
  }

  const links = openLinksOf(context);
  const picked = selectLink(links, namespace, options.via);
  if ('none' in picked) {
    if (picked.none === 'ambiguous') return { status: 'ambiguous', namespace, path, candidates: picked.candidates };
    if (picked.none === 'via_does_not_serve') {
      return { status: 'error', namespace, path, via: null, code: 'VIA_DOES_NOT_SERVE', message: 'The link named in `via` is not an open link of this context that serves that root.' };
    }
    const held = [...new Set(links.map((l) => l.root))].sort();
    // the root as far as it can be said: the namespace without its first label
    const root = namespace.includes('.') ? namespace.split('.').slice(1).join('.') : namespace;
    return { status: 'no_link', namespace, path, root, held };
  }

  const via = picked.link.namespace;
  try {
    const r = await picked.link.session.monad.readNamespacePath({
      semanticNamespace: namespace,
      transportOrigin: picked.link.session.transportOrigin,
      path,
      namedNamespace: true,
      fetchImpl: options.fetchImpl,
      signal: options.signal,
    });
    if (r.disclosure === 'closed') return { status: 'closed', namespace, path, via };
    if (isAudienceEnvelope(r.value)) return { status: 'sealed', namespace, path, via, envelope: r.value };
    return { status: 'public', namespace, path, via, value: r.value };
  } catch (cause) {
    if (cause instanceof MonadClientError && (cause.code === 'NOT_FOUND' || cause.code === 'PATH_NOT_FOUND')) {
      return { status: 'absent', namespace, path, via };
    }
    const code = cause instanceof MonadClientError ? String(cause.code) : String((cause as any)?.code || 'READ_FAILED');
    return { status: 'error', namespace, path, via, code, message: cause instanceof Error ? cause.message : String(cause) };
  }
}
