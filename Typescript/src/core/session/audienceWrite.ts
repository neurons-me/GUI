// Writing a value FOR an audience through a link, and reading it back as one of its members.
//
// The value is sealed with the audience algebra (this.me: OR / AND over identities, see AudienceAlgebra) and the
// envelope is what the link writes, signed as any other write. The ledger therefore holds ciphertext at that path, and
// what it can tell anyone is who the audience is (its canonical id), not what was said. Opening needs the held keys.
//
// Key distribution is NOT done here, as in the algebra itself: the caller gives `{ identityHash, publicKey }` to seal
// to and `{ identityHash, privateKey }` to open with. (`publishEncryptionKey` / `discoverEncryptionKey` below are one
// way to carry public keys through the ledgers themselves.)
import ME from 'this.me';
import type { SeedSession } from './createSeedSession';

export type AudienceIdentity = { identityHash: string; publicKey: Record<string, unknown> };
export type AudienceKey = { identityHash: string; privateKey: CryptoKey };
/** An array is OR, `{ and: [...] }` is AND, nested freely; members are identities. */
export type AudienceFormula = unknown;
export type AudienceEnvelope = { version: 1; audience: string; epoch: number; ciphertext: unknown; tree: unknown };

function algebra(): {
  sealAudience(value: unknown, audience: AudienceFormula, options?: { epoch?: number }): Promise<AudienceEnvelope>;
  openAudience(envelope: AudienceEnvelope, keys: ReadonlyArray<AudienceKey>): Promise<unknown>;
} {
  const kernel = ME as any;
  if (typeof kernel?.sealAudience !== 'function' || typeof kernel?.openAudience !== 'function') {
    throw new Error('this.me does not expose the audience algebra (ME.sealAudience / ME.openAudience).');
  }
  return kernel;
}

/** Seals `value` for `audience` and writes the envelope at `expression` through the session's link. */
export async function writeForAudience<TValue = unknown>(
  session: Pick<SeedSession, 'signAndWrite'>,
  expression: string,
  value: TValue,
  audience: AudienceFormula,
  options: { epoch?: number } = {},
): Promise<{ envelope: AudienceEnvelope; audienceId: string }> {
  if (typeof session.signAndWrite !== 'function') {
    throw new Error('This session cannot sign writes (signAndWrite is missing).');
  }
  // What goes on the wire is JSON, so the envelope is made JSON FIRST. The algebra's wrapped leaves carry properties set
  // to `undefined` (policy, publicKey); `normalizeProofMessage` serializes those literally when it builds the string that
  // is signed, while the server only ever sees the JSON, which drops them. The signed string and the received body then
  // differ and the write is refused (NAMESPACE_WRITE_FORBIDDEN). Round-tripping makes both sides see the same thing.
  const envelope = JSON.parse(JSON.stringify(await algebra().sealAudience(value, audience, options))) as AudienceEnvelope;
  await session.signAndWrite(expression, envelope);
  return { envelope, audienceId: envelope.audience };
}

/** Reads the envelope at `expression` through the link and opens it with `keys`. `undefined` when nothing is there. */
export async function readForAudience<TValue = unknown>(
  session: Pick<SeedSession, 'readConfirmed'>,
  expression: string,
  keys: ReadonlyArray<AudienceKey>,
): Promise<TValue | undefined> {
  if (typeof session.readConfirmed !== 'function') {
    throw new Error('This session cannot read confirmed values (readConfirmed is missing).');
  }
  const envelope = await session.readConfirmed<AudienceEnvelope>(expression);
  if (!envelope) return undefined;
  const opened = await algebra().openAudience(envelope, keys);
  // the algebra seals `[value]` (one blob per envelope); hand back the value itself
  return (Array.isArray(opened) ? opened[0] : opened) as TValue;
}

/** Opens an envelope already in hand (a copy kept from an earlier epoch, for instance). */
export function openEnvelope(envelope: AudienceEnvelope, keys: ReadonlyArray<AudienceKey>): Promise<unknown> {
  return algebra().openAudience(envelope, keys);
}
