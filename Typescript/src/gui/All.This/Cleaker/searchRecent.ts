// Recent search handles on the connected .me, at `search.recent`.
//
// Written only with writeMeValue (local self:write on the kernel you already
// opened by signing in) — the same path as other namespace-scoped facts
// (profile.theme, identity.session.*). Never session.write or signAndWrite:
// those go to the ledger. Nothing here is put on the QR or sent to the network.
//
// Privacy: this is not the service-keys vault. That vault wraps values in
// localStorage under your passphrase (PBKDF2 + AES-256-GCM) and would ask
// for the secret again. The list is a fact on the local kernel. The
// kernel may encrypt its own store; this module does not add a second seal.
import type { MeLike } from '@/react/types';
import { readMeValue, writeMeValue } from '@/runtime/run-me';

export const SEARCH_RECENT_PATH = 'search.recent';
export const SEARCH_RECENT_MAX = 8;

function handleOf(value: unknown): string {
  return String(value ?? '').trim().replace(/^@+/, '');
}

function asList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { handles?: unknown }).handles)) {
    return (raw as { handles: unknown[] }).handles;
  }
  return [];
}

/** Handles most-recent first, capped, empty when there is no kernel or nothing stored. */
export function readSearchRecent(me: MeLike | null | undefined): string[] {
  if (!me) return [];
  try {
    const raw = readMeValue(me, SEARCH_RECENT_PATH, { allowBarePath: true });
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of asList(raw)) {
      const handle = handleOf(
        typeof item === 'string' ? item : (item as { username?: unknown; handle?: unknown })?.username
          ?? (item as { handle?: unknown })?.handle,
      );
      const key = handle.toLowerCase();
      if (!handle || seen.has(key)) continue;
      seen.add(key);
      out.push(handle);
      if (out.length >= SEARCH_RECENT_MAX) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Puts `username` first and writes the list. No-op without a kernel or a handle. */
export function rememberSearchRecent(me: MeLike | null | undefined, username: string): string[] {
  const handle = handleOf(username);
  if (!me || !handle) return readSearchRecent(me);
  const next = [handle, ...readSearchRecent(me).filter((item) => item.toLowerCase() !== handle.toLowerCase())]
    .slice(0, SEARCH_RECENT_MAX);
  try {
    writeMeValue(me, SEARCH_RECENT_PATH, next, { allowBarePath: true });
  } catch {
    // Keep the computed list even if the write is refused.
  }
  return next;
}

/** Drops `username` from the list and writes what's left. */
export function forgetSearchRecent(me: MeLike | null | undefined, username: string): string[] {
  if (!me) return [];
  const handle = handleOf(username);
  const next = readSearchRecent(me).filter((item) => item.toLowerCase() !== handle.toLowerCase());
  try {
    writeMeValue(me, SEARCH_RECENT_PATH, next, { allowBarePath: true });
  } catch {
    /* local write is best-effort */
  }
  return next;
}
