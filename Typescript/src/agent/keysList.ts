// keys.list: an app asks the agent for the NAMES of your keys. PROTOTYPE, agent page only.
//
// The keys live in the agent's own origin (the service-key vault, encrypted under your passphrase). An app may
// learn which keys exist -- their public paths under `<your namespace>.keys` and that they are set -- after you
// approve it in the agent window. It never receives a value, a field's content, or the vault itself: the listing
// is built from the vault's public index and nothing is decrypted to build it. Nothing is signed and nothing goes
// to a server; this is not a login proof.
//
// Same discipline as a write (approval.ts): the request is copied, validated, frozen and digested; the person
// approves THAT digest; answering recomputes it from the request pending NOW. A replacement from the app with the
// same id invalidates the approval. The words on screen and the effects are the agent's own (below), never the
// app's. `keys.netget*` (the gateway's own material) is never listed.
import { canonicalBody, sha256Hex, validateOperation, type KeyListing, type KeysListOperation } from './protocol';
import { deepFreeze, ApprovalInvalidated, type Approval } from './approval';
import type { EffectRule, Fact } from './admittedOperations';
import { listCustomKeyGroups, listSavedServices } from '../gui/All.This/Cleaker/Keys/serviceKeyVault';
import { KEYS_ROOT, servicePath } from '../gui/All.This/Cleaker/Keys/keyPaths';
import { isLoginExcluded } from '../gui/All.This/Cleaker/Keys/keyVisibility';

export const KEYS_LIST_BYTES_TAG = 'me-agent-keys-list/1\n';

export { LOGIN_EXCLUDED_ROOTS, isLoginExcluded } from '../gui/All.This/Cleaker/Keys/keyVisibility';

export type ValidatedKeysList = Readonly<{
  requestId: string;
  origin: string;
  operation: Readonly<KeysListOperation>;
  digest: string;
}>;

const bytesOf = (requestId: string, origin: string, op: KeysListOperation) =>
  KEYS_LIST_BYTES_TAG + canonicalBody({ requestId, origin, action: op.action, namespace: op.namespace });

export async function validateKeysListRequest(requestId: string, raw: unknown, origin: string):
  Promise<{ ok: true; validated: ValidatedKeysList } | { ok: false; reason: string }> {
  let copy: Record<string, unknown>;
  try { copy = JSON.parse(JSON.stringify(raw)); } catch { return { ok: false, reason: 'not plain JSON' }; }
  const shape = validateOperation(copy);
  if (shape) return { ok: false, reason: shape };
  if (copy.action !== 'keys.list') return { ok: false, reason: 'not keys.list' };
  const op = { action: 'keys.list', namespace: copy.namespace as string } as KeysListOperation;
  return { ok: true, validated: deepFreeze({ requestId, origin, operation: op, digest: await sha256Hex(bytesOf(requestId, origin, op)) }) };
}

export const approvalForKeys = (shown: ValidatedKeysList): Approval => Object.freeze({ digest: shown.digest });

/** Refuses (ApprovalInvalidated) unless the request pending NOW recomputes to the approved digest. */
export async function assertKeysApproval(approval: Approval, current: ValidatedKeysList): Promise<void> {
  const recomputed = await sha256Hex(bytesOf(current.requestId, current.origin, current.operation));
  if (recomputed !== approval.digest || current.digest !== approval.digest) throw new ApprovalInvalidated();
}

/** The agent's own words for keys.list. */
export const KEYS_LIST_TEXT = Object.freeze({
  title: 'See the names of your keys',
  app: 'any app you sign in to',
  description: 'The app will see which keys you have (their names under your namespace) and that they are set. It will not see any value: values stay in this window.',
  facts: (resource: string): Record<string, Fact> => ({ listsNames: true, sendsValues: false, leavesDevice: false, resource }),
  rules: Object.freeze([
    { name: 'namesShared', formula: 'request.listsNames', whenTrue: 'The app learns the names under {resource}.', whenFalse: 'The app learns nothing.' },
    { name: 'valuesShared', formula: 'request.sendsValues', whenTrue: 'Values are sent to the app.', whenFalse: 'No value is sent. Values stay in this window.' },
    { name: 'leavesDevice', formula: 'request.leavesDevice', whenTrue: 'Something is sent to a server.', whenFalse: 'Nothing is sent to any server: only to the app, in this browser.' },
  ]) as readonly EffectRule[],
});

/**
 * The listing for one identity, from the vault's public index: built-in services that are saved and custom groups,
 * as full paths under `keys`. Field names are NOT listed. Never decrypts; never returns a value.
 */
export function listKeysFor(namespace: string): KeyListing {
  const entries: KeyListing['entries'] = [];
  for (const id of listSavedServices(namespace)) {
    const path = servicePath(id);
    if (!isLoginExcluded(path.slice(KEYS_ROOT.length + 1))) entries.push({ path, status: 'set' });
  }
  for (const g of listCustomKeyGroups(namespace)) {
    if (!isLoginExcluded(g.name)) entries.push({ path: `${KEYS_ROOT}.${g.name}`, status: 'set' });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return { resource: `${namespace}.${KEYS_ROOT}`, entries };
}
