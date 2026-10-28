// Is the monad answering at this transport the one this session runs on? ("monad0": the monad whose runtime the
// signed-in .me is using; the others it can turn on are started from it.)
//
// Read-only and from facts, never from a name or a URL: what the transport itself answered at /__surface (who, for
// which namespace, whether its own signed claim is consistent) against what the session is (opened on which
// transport, in which namespace). The answer carries its evidence, and what it does NOT establish: nothing here
// verifies that the monad's key belongs to the .me identity (no binding exists yet), so even `monad0` rests on the
// monad's own word that it accepted this session.
import { namespaceIsServed, type SignatureCheck } from './verifiedCleakerRoot';

export type Monad0Facts = {
  /** The transport that was asked (/__surface lives under it). */
  transport: string;
  /** What it answered, or null when nothing answered as a monad. */
  answered: {
    monadId: string;
    monadName: string | null;
    /** The namespace it said it answers for, or null when it did not say. */
    namespace: string | null;
    signature: SignatureCheck;
  } | null;
  /** The signed-in session, or null when there is none. */
  session: {
    transportOrigin: string;
    namespace: string | null;
  } | null;
};

export type Monad0Kind = 'none' | 'monad' | 'monad0';

export type Monad0Reading = {
  kind: Monad0Kind;
  /** One line to show. */
  headline: string;
  /** Facts that support `kind`. */
  evidence: string[];
  /** What this reading does not establish. Never empty for `monad0`. */
  caveats: string[];
};

const bareOrigin = (value: string): string => String(value ?? '').trim().toLowerCase().replace(/\/+$/, '');

/** `sessionNamespace` is `answered` itself or a name under it (dot boundary: `evil-x.test` is not under `x.test`). */
function servedNamespaceCovers(answered: string, sessionNamespace: string): boolean {
  if (namespaceIsServed(answered, sessionNamespace)) return true;
  const a = String(answered).trim().toLowerCase().replace(/\.$/, '');
  const s = String(sessionNamespace).trim().toLowerCase().replace(/\.$/, '');
  return !!a && !!s && s.endsWith(`.${a}`);
}

export function readMonad0(facts: Monad0Facts): Monad0Reading {
  const { answered, session } = facts;
  const transport = bareOrigin(facts.transport);

  if (!answered) {
    return { kind: 'none', headline: 'No monad answers here', evidence: [`nothing answered /__surface at ${transport}`], caveats: [] };
  }

  const who = answered.monadName ? `${answered.monadName} (${answered.monadId})` : answered.monadId;
  const evidence = [`${who} answers /__surface at ${transport}`];

  if (answered.signature === 'invalid') {
    return {
      kind: 'monad',
      headline: 'A monad, with a signature that does not verify',
      evidence,
      caveats: ['its signed claim failed to verify: it is not treated as yours'],
    };
  }

  const signatureNote =
    answered.signature === 'valid'
      ? 'its signed claim is consistent with itself (that is not proof of authority over the namespace)'
      : 'it carries no signed claim';

  if (!session) {
    return { kind: 'monad', headline: 'A monad', evidence, caveats: ['no session here: whose it is cannot be told', signatureNote] };
  }
  if (bareOrigin(session.transportOrigin) !== transport) {
    return {
      kind: 'monad',
      headline: 'A monad',
      evidence,
      caveats: [`your session is on ${bareOrigin(session.transportOrigin)}, not here`, signatureNote],
    };
  }
  if (!answered.namespace) {
    return { kind: 'monad', headline: 'A monad', evidence, caveats: ['it did not say which namespace it answers for', signatureNote] };
  }
  if (!session.namespace || !servedNamespaceCovers(answered.namespace, session.namespace)) {
    return {
      kind: 'monad',
      headline: 'A monad',
      evidence: [...evidence, `it answers for ${answered.namespace}`],
      caveats: [`your session is in ${session.namespace ?? 'no namespace'}, which it does not answer for`, signatureNote],
    };
  }

  return {
    kind: 'monad0',
    headline: 'Your monad0',
    evidence: [...evidence, `it answers for ${answered.namespace}`, `your session is open here, in ${session.namespace}`],
    caveats: ['this rests on the monad\'s own word: nothing binds its key to your .me identity yet', signatureNote],
  };
}
