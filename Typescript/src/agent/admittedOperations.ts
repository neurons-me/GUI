// The agent's ADMITTED operations (Agent-Protocol.md section 3a). PROTOTYPE: not deployed anywhere.
//
// The envelope of a write (`call`, protocol.ts) is common to every app. What it MEANS is not: each admitted kind has
// a schema for its body, the path it must go to, and the AGENT'S OWN words and effect rules. Nothing an app sends --
// a label, a description, a formula -- is used for what the person is shown. A kind that is not in this table is
// refused, whatever the app calls it. Adding an app operation means adding an entry here (the agent evolves).
//
// Effect rules are `.me` formulas over facts taken from the validated request (approvalKernel.ts evaluates them in a
// temporary kernel and shows each one with its me.explain() trace). They describe the operation for the person; they
// AUTHORIZE NOTHING. The authority (the audience) verifies the proof and decides on its own state: whether the key is
// active, whether there is already an owner, whether the install code was presented. That is listed in
// `serverDecides`, so the screen says it out loud.
import { canonicalBody, sha256Hex, type CallOperation } from './protocol';

export type Fact = string | number | boolean;

export type EffectRule = {
  /** The derived path is `effect.<name>`. */
  name: string;
  /** A `.me` formula over `request.*` facts. Numbers and booleans only (the kernel's evaluator). */
  formula: string;
  /** The agent's words when the rule is true / false. `{fact}` placeholders are filled from the facts. */
  whenTrue: string;
  whenFalse: string;
};

export type AdmittedOperation = {
  kind: string;
  /** Which app this operation belongs to, in the agent's words. */
  app: string;
  method: 'POST';
  /** Exactly these body fields; any other is refused. */
  bodyKeys: readonly string[];
  checkBody(body: Record<string, unknown>): string | null;
  /** The only path this operation may be sent to, derived from the body. */
  pathFor(body: Record<string, unknown>): string;
  /** The operation, in the agent's words (shown as "Operation"). */
  title(body: Record<string, unknown>): string;
  /** Facts written into the temporary kernel. Keys are plain identifiers. */
  facts(body: Record<string, unknown>, ctx: { ttlMs: number; origin: string; audience: string }): Record<string, Fact>;
  rules: readonly EffectRule[];
  /** What this screen does NOT decide: the authority checks it on its own state. */
  serverDecides: readonly string[];
};

const GATEWAY_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const NONCE_RE = /^[A-Za-z0-9_-]{16,128}$/;

/** netget's challenge, as gatewaySetupSession.ts issueClaimChallenge builds it (normalizeProofMessage: sorted keys). */
function checkGatewayClaimChallenge(challenge: unknown, gatewayId: string): string | null {
  if (typeof challenge !== 'string' || challenge.length > 1024) return 'challenge must be a string';
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(challenge); } catch { return 'challenge is not JSON'; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 'challenge is not an object';
  const keys = Object.keys(parsed).sort().join(',');
  if (keys !== 'gatewayId,nonce,purpose,timestamp') return 'challenge fields are not netget\'s gateway-claim fields';
  if (parsed.purpose !== 'gateway-claim') return 'challenge purpose is not gateway-claim';
  if (parsed.gatewayId !== gatewayId) return 'challenge is for another gateway';
  if (typeof parsed.nonce !== 'string' || !NONCE_RE.test(parsed.nonce)) return 'challenge nonce is not acceptable';
  if (!Number.isInteger(parsed.timestamp)) return 'challenge timestamp is not acceptable';
  if (canonicalBody(parsed) !== challenge) return 'challenge is not canonical';
  return null;
}

/** First admitted operation: claim (bootstrap) a netget gateway. Field shapes from monad claim/gatewayAuthority.ts. */
export const NETGET_GATEWAY_BOOTSTRAP: AdmittedOperation = {
  kind: 'netget.gateway.bootstrap',
  app: 'netget',
  method: 'POST',
  bodyKeys: ['challenge', 'gatewayId'],
  checkBody(body) {
    if (typeof body.gatewayId !== 'string' || !GATEWAY_ID_RE.test(body.gatewayId)) return 'gatewayId is not acceptable';
    return checkGatewayClaimChallenge(body.challenge, body.gatewayId);
  },
  pathFor: (body) => `/api/v1/gateway/${encodeURIComponent(String(body.gatewayId))}/bootstrap`,
  title: (body) => `Claim gateway ${String(body.gatewayId)}`,
  facts: (body, ctx) => ({
    gatewayId: String(body.gatewayId),
    audience: ctx.audience,
    origin: ctx.origin,
    claimsGateway: true,          // fixed by the kind, not by anything the app sent
    hasTarget: false,             // a bootstrap names no other identity
    ttlSeconds: Math.round(ctx.ttlMs / 1000),
  }),
  rules: [
    {
      name: 'makesYouOwner',
      formula: 'request.claimsGateway && !request.hasTarget',
      whenTrue: 'You become the owner and first admin of gateway {gatewayId}, if {audience} confirms it.',
      whenFalse: 'This does not make you the owner of anything.',
    },
    {
      name: 'givesControlAway',
      formula: 'request.hasTarget',
      whenTrue: 'Control of gateway {gatewayId} goes to another identity.',
      whenFalse: 'Nothing is given to any other identity.',
    },
    {
      name: 'shortLived',
      formula: 'request.ttlSeconds <= 600',
      whenTrue: 'Usable once, within {ttlSeconds} s, only at {audience}.',
      whenFalse: 'This approval would last longer than 10 minutes.',
    },
  ],
  serverDecides: [
    'whether your key is active',
    'whether the install code was presented to netget',
    'whether the gateway already has an owner',
    'whether this approval was already used',
  ],
};

export const ADMITTED_OPERATIONS: Readonly<Record<string, AdmittedOperation>> = Object.freeze({
  [NETGET_GATEWAY_BOOTSTRAP.kind]: NETGET_GATEWAY_BOOTSTRAP,
});

export type CallCheck =
  | { ok: true; admitted: AdmittedOperation; canonicalBody: string }
  | { ok: false; reason: string };

/**
 * The agent's check of a call, after its shape (protocol.ts validateOperation): the kind is admitted, the body has
 * exactly its fields and passes its schema, the path is the one the body implies, and bodyHash is the hash of the
 * canonical body. Any failure refuses the request before anything is shown.
 */
export async function validateCall(op: CallOperation): Promise<CallCheck> {
  const admitted = Object.prototype.hasOwnProperty.call(ADMITTED_OPERATIONS, op.kind) ? ADMITTED_OPERATIONS[op.kind] : undefined;
  if (!admitted) return { ok: false, reason: `operation not admitted: ${op.kind}` };
  if (op.method !== admitted.method) return { ok: false, reason: 'method does not match the admitted operation' };
  const keys = Object.keys(op.body).sort();
  if (keys.join(',') !== [...admitted.bodyKeys].sort().join(',')) return { ok: false, reason: 'body fields do not match the admitted operation' };
  const problem = admitted.checkBody(op.body);
  if (problem) return { ok: false, reason: problem };
  if (op.path !== admitted.pathFor(op.body)) return { ok: false, reason: 'path does not match the admitted operation' };
  const canonical = canonicalBody(op.body);
  if ((await sha256Hex(canonical)) !== op.bodyHash) return { ok: false, reason: 'bodyHash does not match the body' };
  return { ok: true, admitted, canonicalBody: canonical };
}

/** Fills `{fact}` placeholders with the request's facts (agent words + validated values only). */
export function fillWords(template: string, facts: Record<string, Fact>): string {
  return template.replace(/\{([A-Za-z]+)\}/g, (_m, k: string) => (k in facts ? String(facts[k]) : `{${k}}`));
}
