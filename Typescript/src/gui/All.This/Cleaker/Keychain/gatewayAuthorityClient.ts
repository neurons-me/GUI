// gatewayAuthorityClient.ts — signs and submits gateway grant/revoke/
// transfer actions using an already-registered, active keychain key. This
// is the reusable building block for the E+A signed-delegation mechanism
// (modules/monad/Typescript's claim/gatewayAuthority.ts + modules/netget's
// gatewayAdminActions.ts) — NOT yet wired into any admin-panel UI
// (GatewaySetup.tsx or otherwise). That wiring is a deliberate follow-up,
// same reasoning as the backend/monad work it sits on top of: this closes
// the small, real case (a human administers their own gateway with their
// own key) without building the whole admin-panel experience in the same
// pass.
//
// Reuses signWithKeychainKey from keychainClient.ts — no new crypto here,
// no private key material ever touches this module directly (same
// guarantee keychainClient.ts itself already provides).
import { normalizeProofMessage } from 'this.me';
import type { KeychainClient } from './keychainClient';

export interface GatewayActionOutcome {
  ok: boolean;
  status: number;
  error?: string;
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function postJson(netgetBase: string, path: string, body: unknown): Promise<GatewayActionOutcome> {
  try {
    const res = await fetch(`${netgetBase.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.ok === true, status: res.status, error: json?.error };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'NETWORK_ERROR' };
  }
}

export function createGatewayAuthorityClient(opts: { netgetBase: string; keychain: KeychainClient }) {
  const { netgetBase, keychain } = opts;

  async function grantAdmin(input: {
    gatewayId: string;
    namespace: string;
    actingKeyId: string;
    targetIdentityHash: string;
    targetNamespace: string;
    targetPublicKey?: string | null;
    targetUsername?: string | null;
    scopes: string[];
  }): Promise<GatewayActionOutcome> {
    const nonce = randomNonce();
    const timestamp = Date.now();
    const signedFields = {
      op: 'gateway-grant-admin',
      gatewayId: input.gatewayId,
      namespace: input.namespace,
      targetIdentityHash: input.targetIdentityHash,
      targetNamespace: input.targetNamespace,
      targetPublicKey: input.targetPublicKey ?? null,
      targetUsername: input.targetUsername ?? null,
      scopes: input.scopes,
      nonce,
      timestamp,
    };
    const signature = await keychain.signWithKeychainKey(input.actingKeyId, normalizeProofMessage(signedFields));
    return postJson(netgetBase, '/gateway-admin/grant', {
      ...input, nonce, timestamp, signature,
    });
  }

  async function revokeAdmin(input: {
    gatewayId: string;
    namespace: string;
    actingKeyId: string;
    targetIdentityHash: string;
  }): Promise<GatewayActionOutcome> {
    const nonce = randomNonce();
    const timestamp = Date.now();
    const signedFields = {
      op: 'gateway-revoke-admin',
      gatewayId: input.gatewayId,
      namespace: input.namespace,
      targetIdentityHash: input.targetIdentityHash,
      nonce,
      timestamp,
    };
    const signature = await keychain.signWithKeychainKey(input.actingKeyId, normalizeProofMessage(signedFields));
    return postJson(netgetBase, '/gateway-admin/revoke', {
      ...input, nonce, timestamp, signature,
    });
  }

  async function transferOwner(input: {
    gatewayId: string;
    namespace: string;
    actingKeyId: string;
    targetIdentityHash: string;
  }): Promise<GatewayActionOutcome> {
    const nonce = randomNonce();
    const timestamp = Date.now();
    const signedFields = {
      op: 'gateway-transfer-owner',
      gatewayId: input.gatewayId,
      namespace: input.namespace,
      targetIdentityHash: input.targetIdentityHash,
      nonce,
      timestamp,
    };
    const signature = await keychain.signWithKeychainKey(input.actingKeyId, normalizeProofMessage(signedFields));
    return postJson(netgetBase, '/gateway-admin/transfer', {
      ...input, nonce, timestamp, signature,
    });
  }

  return { grantAdmin, revokeAdmin, transferOwner };
}

export type GatewayAuthorityClient = ReturnType<typeof createGatewayAuthorityClient>;
