// One validated, frozen request; one approval bound to its digest (Agent-Protocol.md R6, section 3a). PROTOTYPE.
//
// The screen and the signature come from the SAME object: validateCallRequest() copies the request out of the
// message, checks it (shape + admitted operation + bodyHash), deep-freezes it and captures its canonical bytes and
// their digest. The person approves THAT digest. Signing recomputes the digest from the request that is pending at
// that moment; if anything changed after it was shown (a new message from the app, a mutation), the approval is
// invalid and nothing is signed: the person has to look at the new request and approve again.
import { buildCallFields, buildV2Bytes, canonicalBody, sha256Hex, validateOperation, type CallOperation, type V2CallFields } from './protocol';
import { validateCall, type AdmittedOperation } from './admittedOperations';

export const APPROVAL_BYTES_TAG = 'me-agent-approval/1\n';

/** What is shown and signed: never the app's label. */
export type ShownCall = Omit<CallOperation, 'appLabel'>;

export type ValidatedCall = Readonly<{
  requestId: string;
  /** The requesting origin AS THE BROWSER REPORTED IT (MessageEvent.origin). */
  origin: string;
  operation: Readonly<ShownCall>;
  canonicalBody: string;
  /** Canonical bytes of everything this approval is about (tag + canonical JSON). */
  approvalBytes: string;
  /** sha256 of approvalBytes. */
  digest: string;
}>;

export type ValidationResult = { ok: true; validated: ValidatedCall; admitted: AdmittedOperation } | { ok: false; reason: string };

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}

function approvalBytesOf(requestId: string, origin: string, op: ShownCall): string {
  return APPROVAL_BYTES_TAG + canonicalBody({
    requestId, origin, kind: op.kind, namespace: op.namespace, audience: op.audience, method: op.method, path: op.path,
    body: op.body, bodyHash: op.bodyHash, ttlMs: op.ttlMs,
  });
}

/** Copies, validates and freezes one call request. The app's `appLabel` is dropped here: it is never shown or signed. */
export async function validateCallRequest(requestId: string, rawOperation: unknown, origin: string): Promise<ValidationResult> {
  let copy: Record<string, unknown>;
  try { copy = JSON.parse(JSON.stringify(rawOperation)); } catch { return { ok: false, reason: 'not plain JSON' }; }
  const shape = validateOperation(copy);
  if (shape) return { ok: false, reason: shape };
  if (copy.action !== 'call') return { ok: false, reason: 'not a call' };
  const { appLabel: _ignored, ...shown } = copy as unknown as CallOperation;
  const check = await validateCall(shown as CallOperation);
  if (!check.ok) return { ok: false, reason: check.reason };
  const approvalBytes = approvalBytesOf(requestId, origin, shown as ShownCall);
  const validated: ValidatedCall = deepFreeze({
    requestId, origin, operation: shown as ShownCall, canonicalBody: check.canonicalBody, approvalBytes, digest: await sha256Hex(approvalBytes),
  });
  return { ok: true, validated, admitted: check.admitted };
}

/** The person's approval: only the digest of what was on the screen when they clicked. */
export type Approval = Readonly<{ digest: string }>;

export function approvalFor(shown: ValidatedCall): Approval {
  return Object.freeze({ digest: shown.digest });
}

export class ApprovalInvalidated extends Error {
  constructor() { super('APPROVAL_INVALIDATED'); }
}

/**
 * The exact bytes to sign for an approval, built from the request pending NOW. Refuses (ApprovalInvalidated) unless
 * that request's freshly recomputed digest is the approved one -- whatever its stored `digest` field says.
 */
export async function approvedCallBytes(
  approval: Approval,
  current: ValidatedCall,
  signer: { identityHash: string; keyId: string; identityNamespace: string },
  nonce: string,
  issuedAt: number,
): Promise<{ fields: V2CallFields; bytes: string }> {
  const recomputed = await sha256Hex(approvalBytesOf(current.requestId, current.origin, current.operation));
  if (recomputed !== approval.digest || current.digest !== approval.digest) throw new ApprovalInvalidated();
  if ((await sha256Hex(canonicalBody(current.operation.body))) !== current.operation.bodyHash) throw new ApprovalInvalidated();
  const fields = buildCallFields({
    operation: current.operation, requestingOrigin: current.origin,
    identityHash: signer.identityHash, keyId: signer.keyId, identityNamespace: signer.identityNamespace, nonce, issuedAt,
  });
  return { fields, bytes: buildV2Bytes(fields) };
}
