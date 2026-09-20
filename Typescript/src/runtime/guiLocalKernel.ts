/**
 * Explain for `GUI.*`, asked of the LOCAL kernel first.
 *
 * `GUI.window.location` and `GUI.theme.*` are facts about this browser tab, and
 * they are written to the tab's own kernel (the session's `me`), not to the
 * monad. The Inspector's Explain otherwise asks the monad over HTTP, which
 * has nothing at `GUI` and answers "Value Not Available". For paths under
 * `GUI` the local kernel is asked first; whatever it cannot answer falls
 * through to the monad as before.
 *
 * READ-ONLY. Nothing here writes, and nothing here grants any right to write:
 * who may edit a node is the namespace's business (its owner and admin keys at
 * the root; anyone else only from their own place downward), decided by
 * whoever holds the kernel that is written to -- not by the Inspector.
 * The tab's kernel is the owner's own, so it will hand back what sits under a
 * secret scope. The Inspector is a screen people screenshot and paste, so it
 * does not: anything at or under a secret scope (`inspect().secretScopes`) is
 * reported as closed, and never read.
 */
const KEY = 'GUI-LOCAL-KERNEL';

export function setGuiLocalKernel(me: any | null, onlyIfCurrent?: any): void {
  const g = globalThis as any;
  if (me == null) {
    // Clearing: only if it is still the kernel that is being cleared, so a
    // newer session's kernel is not removed by an older one's cleanup.
    if (onlyIfCurrent === undefined || g[KEY] === onlyIfCurrent) delete g[KEY];
    return;
  }
  g[KEY] = me;
}

export function getGuiLocalKernel(): any | null {
  return (globalThis as any)[KEY] ?? null;
}

export function isGuiPath(path: string): boolean {
  return path === 'GUI' || path.startsWith('GUI.');
}

function setNested(target: Record<string, unknown>, segments: string[], value: unknown) {
  let cursor: any = target;
  segments.forEach((seg, i) => {
    if (i === segments.length - 1) cursor[seg] = value;
    else cursor = cursor[seg] && typeof cursor[seg] === 'object' ? cursor[seg] : (cursor[seg] = {});
  });
}

/**
 * The local kernel's explanation of `path`, or null when it has nothing to say
 * (not a GUI path, no kernel, nothing written there) and the caller should ask
 * the monad instead. A branch (`GUI`, `GUI.theme`) has no value of its own in
 * the kernel, so its value is what is written below it, read back leaf by
 * leaf through the kernel's normal reads.
 */
export async function explainWithLocalKernel(
  me: any,
  path: string
): Promise<{ method: string; payload: any } | null> {
  if (!me || typeof me.explain !== 'function' || !isGuiPath(path)) return null;

  let inspected: any = null;
  try {
    inspected = await Promise.resolve(me.inspect?.({ last: 5000 }));
  } catch {
    inspected = null;
  }
  const secretScopes: string[] = (inspected?.secretScopes ?? []).map(String);
  const isClosed = (p: string) => secretScopes.some((scope) => p === scope || p.startsWith(`${scope}.`));
  if (isClosed(path)) {
    return {
      method: 'local me.explain(path)',
      payload: { path, value: null, meta: { source: 'local kernel', disclosure: 'closed' } },
    };
  }

  const own = await Promise.resolve(me.explain(path));
  if (own && own.value !== undefined) return { method: 'local me.explain(path)', payload: own };

  const memories: any[] = inspected?.memories ?? [];
  const prefix = `${path}.`;
  const leaves = [
    ...new Set<string>(memories.map((m) => String(m?.path ?? '')).filter((p) => p.startsWith(prefix) && !isClosed(p))),
  ];
  if (leaves.length === 0) return null;

  const value: Record<string, unknown> = {};
  const read: string[] = [];
  for (const leaf of leaves) {
    let leafValue: unknown;
    try {
      leafValue = typeof me === 'function' ? await Promise.resolve(me(leaf)) : undefined;
    } catch {
      leafValue = undefined;
    }
    if (leafValue === undefined) continue; // closed or gone: not shown, not guessed
    setNested(value, leaf.slice(prefix.length).split('.'), leafValue);
    read.push(leaf);
  }
  if (read.length === 0) return null;
  return {
    method: 'local me.explain(path) + what is written below',
    payload: { ...(own ?? { path }), path, value, meta: { ...(own?.meta ?? {}), source: 'local kernel', leaves: read } },
  };
}
