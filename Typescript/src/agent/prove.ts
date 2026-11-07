// Signing inside the identity agent (Identity-Custody-Contract.md). PROTOTYPE. Agent-only: a host page must never
// import this -- it is the one place a secret becomes a key.
//
// It derives the .me kernel from name + secret (the same compound seed signedRequest.ts's deriveCleakerNode uses)
// and calls the kernel's own prove() -- what cleaker's proveKernelNamespace calls -- directly. It does NOT bind the
// kernel with cleaker(me, namespace): binding discovers hosts and signs in automatically (a POST to
// https://<namespace>/claims/signIn), and the agent makes no network request nobody approved. The kernel is created
// for this one proof and dropped; the secret is not kept.
import MeKernel from 'this.me';

const ME_RESEED = Symbol.for('me.internal.reseed');

export type MeProof = { identityHash: string; message: string; signature: string; publicKey: string; namespace: string; [k: string]: unknown };

export async function proveWithSecret(input: { username: string; secret: string; rootNamespace: string; challenge: string }): Promise<MeProof> {
  const me = new (MeKernel as any)();
  me[ME_RESEED](input.username, input.secret);
  const runtime = me['!'];
  const method = runtime?.prove;
  const prove: ((i: { rootNamespace: string; challenge: string }) => Promise<unknown>) | null =
    typeof method === 'function' ? method
      : method && typeof method.call === 'function' ? (...args: unknown[]) => method.call(...args)
        : null;
  if (!prove) throw new Error('PROVE_UNSUPPORTED');
  const proof = (await prove({ rootNamespace: input.rootNamespace, challenge: input.challenge })) as MeProof | null;
  if (!proof || typeof proof.message !== 'string' || typeof proof.signature !== 'string' || typeof proof.publicKey !== 'string') {
    throw new Error('PROOF_INVALID');
  }
  return proof;
}
