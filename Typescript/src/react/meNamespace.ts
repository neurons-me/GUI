// The one place that knows where a `.me` keeps the namespace it stands in and the handle it declares. Everything else
// asks for "the .me's namespace" / "its username" and gets a string back (empty when the .me has none).
//
// Three different things live here, and none of them is a login:
//   root          cleaker.me        where this .me stands
//   username      ana               the handle it declares
//   named         ana.cleaker.me    the username inside the root (only when it has both)
// Declaring a username says nothing about who is holding the .me: signing in is what proves that, and it happens in the
// session `<Cleaker>` opens, never here.
import type { MeLike } from './types';
import { readMeValue, writeMeValue } from '@/runtime/run-me';

const ROOT_PATH = 'profile.rootNamespace';
const USERNAME_PATH = 'profile.username';
const NAMED_PATH = 'profile.namespace';

const read = (me: MeLike | null | undefined, path: string): string => {
  if (!me) return '';
  return String(readMeValue(me, path, { allowBarePath: true }) || '').trim();
};

const write = (me: MeLike, path: string, value: string): void => {
  writeMeValue(me, path, value, { allowBarePath: true });
};

export function normalizeMeUsername(username: string): string {
  return String(username || '').trim().toLowerCase();
}

/** The root this `.me` stands in (`cleaker.me`). */
export function readMeNamespace(me: MeLike | null | undefined): string {
  return read(me, ROOT_PATH);
}

/** The handle this `.me` declares (`ana`). */
export function readMeUsername(me: MeLike | null | undefined): string {
  return read(me, USERNAME_PATH);
}

/** The username inside the root (`ana.cleaker.me`); empty unless the `.me` declares both. */
export function readMeNamedNamespace(me: MeLike | null | undefined): string {
  return read(me, NAMED_PATH);
}

export function writeMeNamespace(me: MeLike, namespace: string): void {
  write(me, ROOT_PATH, namespace);
}

/**
 * Declares a root and/or a handle on a `.me`. TEMPORARY: it writes by hand the fields `createThisMe` (this.me) writes,
 * because the `.me` this package resolves today (the live checkout, 4.1.0) rejects a root of a single label such as
 * `localhost`. `feat/known-root-single-label` (.me 4.2.0, not merged) accepts it, and strips a port from the root. Once
 * that lands, this should call the factory and this second description of an identity should go. Not identical yet: the
 * factory also sets `profile.name` and the kernel's active expression (`@`); this does not.
 */
export function writeMeIdentity(me: MeLike, { namespace, username }: { namespace?: string; username?: string }): void {
  const root = String(namespace || '').trim();
  const handle = normalizeMeUsername(username || '');
  if (root) write(me, ROOT_PATH, root);
  if (handle) write(me, USERNAME_PATH, handle);
  if (root && handle) write(me, NAMED_PATH, `${handle}.${root}`);
}
