// appAdapters.ts — what an APP brings to the generic challenge protocol (appChallenge.ts / appGrants.ts).
//
// The protocol is app-agnostic: any app (audience) can send a challenge asking the user's .me to sign one
// operation on one of its resources, under the path that app's key lives at (`keys.<app>` by default). An adapter
// only declares the app's vocabulary: its ops, which of them may NEVER be signed automatically, how its authority
// decides who may do what, and the exact message its authority verifies. netget is the first adapter; the second
// one here (`polls`) is a pure mock that exists to show the core does not know about netget.

/** One operation an app can ask the .me to sign. */
export interface AppOpDef {
  /** Button / consent wording: "Claim", "Transfer". */
  label: string;
  /** Never signed by a standing grant or a wire: always asks, every time (e.g. transferring ownership). */
  neverAuto?: boolean;
  /** First-write-wins claim of an unowned resource (bootstrap). */
  claims?: boolean;
  /** Only the current owner may sign it. */
  ownerOnly?: boolean;
  /** Owner or an admin may sign it. */
  adminOnly?: boolean;
  /** Acts on another identity (grant / revoke / transfer). */
  needsTarget?: boolean;
  /** What the authority does with the record once the proof is accepted. */
  effect?: 'claim' | 'grant-admin' | 'revoke-admin' | 'transfer-owner' | 'none';
}

/** Everything the signed message can be built from. `challenge` is the DIGEST of the nonce, never the nonce. */
export interface AppSignInput {
  op: string;
  resource: string;
  namespace: string;
  identityHash: string;
  keyId: string;
  challenge: string;
  timestamp: number;
  target?: string;
}

export interface AppAdapter {
  /** The audience id: who the challenge is for and who the response goes back to. */
  id: string;
  label: string;
  /** Material icon name. */
  icon: string;
  /** The .me path the app asks for (relative to the user): `keys.netget`. */
  keyPath: string;
  /** "gateway", "poll" — wording only. */
  resourceKind: string;
  /** Where the authority keeps a resource's record: `daemon.gateways` → `daemon.gateways.<id>`. */
  authorityRoot: string;
  defaultResource: string;
  ops: Record<string, AppOpDef>;
  /** The exact fields the app's authority verifies (normalizeProofMessage of this is what gets signed). */
  signedFields(input: AppSignInput): Record<string, unknown>;
  /** Simulated (Storybook) vs. the shape of a real backend. */
  note: string;
}

// ── netget ───────────────────────────────────────────────────────────────────────────────────────────────────────
// Field shapes copied from modules/monad/Typescript/src/claim/gatewayAuthority.ts (bootstrapGatewayAuthority,
// grantGatewayAdmin, revokeGatewayAdmin, transferGatewayOwner) and Keys/gatewayAuthorityClient.ts. One deliberate
// difference: in the real calls the client picks its own `nonce`; here the APP issues it inside the encrypted
// challenge and the signed value is its digest, so the .me can only sign after decrypting.
export const NETGET_ADAPTER: AppAdapter = {
  id: 'netget',
  label: 'netget',
  icon: 'router',
  keyPath: 'keys.netget',
  resourceKind: 'gateway',
  authorityRoot: 'daemon.gateways',
  defaultResource: 'gw-demo-01',
  ops: {
    bootstrap: { label: 'Claim', claims: true, effect: 'claim' },
    grant: { label: 'Grant admin', adminOnly: true, needsTarget: true, effect: 'grant-admin' },
    revoke: { label: 'Revoke admin', adminOnly: true, needsTarget: true, effect: 'revoke-admin' },
    transfer: { label: 'Transfer', ownerOnly: true, needsTarget: true, neverAuto: true, effect: 'transfer-owner' },
  },
  signedFields({ op, resource, namespace, identityHash, keyId, challenge, timestamp, target }) {
    switch (op) {
      case 'bootstrap':
        return { op: 'netget-claim-gateway', gatewayId: resource, namespace, identityHash, keyId, challenge, timestamp };
      case 'grant':
        return {
          op: 'gateway-grant-admin', gatewayId: resource, namespace, targetIdentityHash: target ?? null, targetNamespace: namespace,
          targetPublicKey: null, targetUsername: null, scopes: [], nonce: challenge, timestamp,
        };
      case 'revoke':
        return { op: 'gateway-revoke-admin', gatewayId: resource, namespace, targetIdentityHash: target ?? null, nonce: challenge, timestamp };
      case 'transfer':
        return { op: 'gateway-transfer-owner', gatewayId: resource, namespace, targetIdentityHash: target ?? null, nonce: challenge, timestamp };
      default:
        throw new Error(`netget: unknown op ${op}`);
    }
  },
  note: 'Message shapes match monad claim/gatewayAuthority.ts; netget, the monad and the keychain are simulated in the browser.',
};

// ── polls (mock) ─────────────────────────────────────────────────────────────────────────────────────────────────
// A second, entirely invented app: same protocol, different vocabulary. Not a real backend.
export const POLLS_ADAPTER: AppAdapter = {
  id: 'polls',
  label: 'Polls (mock)',
  icon: 'how_to_vote',
  keyPath: 'keys.polls',
  resourceKind: 'poll',
  authorityRoot: 'daemon.polls',
  defaultResource: 'poll-demo-7',
  ops: {
    claim: { label: 'Claim', claims: true, effect: 'claim' },
    publish: { label: 'Publish results', ownerOnly: true, effect: 'none' },
    delete: { label: 'Delete poll', ownerOnly: true, neverAuto: true, effect: 'none' },
  },
  signedFields({ op, resource, namespace, identityHash, keyId, challenge, timestamp }) {
    return { op: `polls-${op}`, pollId: resource, namespace, identityHash, keyId, challenge, timestamp };
  },
  note: 'Invented app; exists only to show the protocol is not netget-specific.',
};

export const APP_ADAPTERS: readonly AppAdapter[] = [NETGET_ADAPTER, POLLS_ADAPTER];
export const adapterById = (id: string): AppAdapter | undefined => APP_ADAPTERS.find((a) => a.id === id);
