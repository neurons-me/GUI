// The one place that knows where a `.me` keeps the namespace it stands in. Everything else asks for "the .me's
// namespace" and gets a string back (empty when the .me has none).
import type { MeLike } from './types';
import { readMeValue, writeMeValue } from '@/runtime/run-me';

const NAMESPACE_PATH = 'profile.rootNamespace';

export function readMeNamespace(me: MeLike | null | undefined): string {
  if (!me) return '';
  return String(readMeValue(me, NAMESPACE_PATH, { allowBarePath: true }) || '').trim();
}

export function writeMeNamespace(me: MeLike, namespace: string): void {
  writeMeValue(me, NAMESPACE_PATH, namespace, { allowBarePath: true });
}
