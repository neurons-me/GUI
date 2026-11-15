// keychainState.ts — the state contract for CleakerKeychain: what each
// screen represents. See CleakerKeychain.tsx's own header comment for
// what's still deliberately out of scope (device-to-device private key
// transfer, netget's own consumption of this) versus what's now real:
// keychainClient.ts is a working protocol client, not a mock.
//
// Two independent axes, never collapsed into one status — this is the
// actual point of the feature, not an implementation detail:
//   - authorization: is this key currently allowed to act for this
//     identity AT ALL, regardless of where its private half lives.
//   - localAvailability: does THIS device hold (and can currently use)
//     that key's private half. A key can be authorized and unavailable
//     here at the same time — e.g. a key registered from a phone,
//     viewed from a laptop that has never held it. The UI must never
//     imply "authorized" means "usable right here."
//
// A key is not intrinsically "a device's key" — it's generic Ed25519
// material; where its private half physically lives is a device fact,
// not what the key IS. "This laptop" is a common label, but so is
// "Netget: my-server" or "Reporting integration".
//
// The keychain itself has an opinion about exactly one thing beyond
// "does this key exist and is it active": can it administer THIS
// keychain (add/revoke other keys) — `admin`. Whether some OTHER system
// (netget accepting a gateway claim, a generic namespace write) trusts a
// signature from an active key for anything specific is that system's
// own decision, checked against its own authorization model, never
// something the keychain pre-declares. A key only proves possession of
// a private key; what that's worth is up to whoever asked for the
// signature.

export type KeyAuthorization = 'active' | 'revoked';

export type KeyLocalAvailability =
  /** Private half lives on this device and is ready to sign right now. */
  | 'available-unlocked'
  /** Private half lives on this device but is passphrase-locked. */
  | 'available-locked'
  /** This device has never held — or no longer holds — this key's private half. */
  | 'not-available';

export interface KeychainKey {
  keyId: string;
  /** Human label, never the raw public key — "This laptop", "Sui's iPhone". */
  label: string;
  /** Can this key administer THIS keychain (register/revoke other keys)? */
  admin: boolean;
  authorization: KeyAuthorization;
  localAvailability: KeyLocalAvailability;
  addedAt: number;
  revokedAt?: number;
}

export type KeychainView =
  | 'list'
  | 'local-key-detail'
  | 'add-key'
  | 'confirm-revoke'
  | 'recover'
  | 'no-local-key';
