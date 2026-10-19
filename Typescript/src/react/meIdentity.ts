// The one place that knows where a `.me` keeps the handle it declares. Everything else asks for "the .me's username" and
// gets a string back (empty when the .me declares none).
//
// A declared username is context, not a login: it says what this `.me` calls itself, and nothing about who is holding
// it. Signing in is what proves that, in the session `<Cleaker>` opens, never here. The NAME it makes inside a namespace
// (`ana.cleaker.me`) belongs to the link with that namespace (`<Cleaker namespace>`), not to the `.me`: the same `.me`
// can be linked to several.
import type { MeLike } from './types';
import { readMeValue, writeMeValue } from '@/runtime/run-me';

const USERNAME_PATH = 'profile.username';

export function normalizeMeUsername(username: string): string {
  return String(username || '').trim().toLowerCase();
}

/** The handle this `.me` declares (`ana`). */
export function readMeUsername(me: MeLike | null | undefined): string {
  if (!me) return '';
  return String(readMeValue(me, USERNAME_PATH, { allowBarePath: true }) || '').trim();
}

export function writeMeUsername(me: MeLike, username: string): void {
  const handle = normalizeMeUsername(username);
  if (handle) writeMeValue(me, USERNAME_PATH, handle, { allowBarePath: true });
}
