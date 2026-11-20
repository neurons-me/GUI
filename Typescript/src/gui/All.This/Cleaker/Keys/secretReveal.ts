// secretReveal.ts — pure rules for the eye / copy buttons on a secret input.
// A typed (unsaved) value is already in the page: show/copy act on it
// directly. A saved value is NOT in the page: it must be decrypted on
// demand with the card's passphrase, shown briefly, then dropped.

/** How long a decrypted saved value stays visible before it hides itself. */
export const REVEAL_MS = 10_000;
/** How long the "Copied" confirmation stays. */
export const COPIED_MS = 1_500;

export type SecretAction = 'typed' | 'decrypt' | 'need-passphrase' | 'none';

/** What the eye / copy button should do for this input right now. */
export function secretAction({ typed, saved, passphrase }: { typed: string; saved: boolean; passphrase: string }): SecretAction {
  if (typed.length > 0) return 'typed';
  if (!saved) return 'none';
  return passphrase.length > 0 ? 'decrypt' : 'need-passphrase';
}

/** User-facing message for a failed decrypt — never echoes a value. */
export function revealErrorMessage(code: unknown): string {
  return String(code ?? '') === 'WRONG_PASSPHRASE' ? 'Wrong passphrase.' : 'Could not unlock.';
}
