// The approval screen's temporary `.me` kernel (Agent-Protocol.md section 3a). PROTOTYPE. Agent page only.
//
// A kernel created from an explicit, PUBLIC test seed -- not anyone's identity, not secret, and never persisted: an
// explicit seed is not written to `this.me.seed:v1` (this.me resolveSeed), and this module writes nothing to
// localStorage or IndexedDB. One kernel per validated request, dropped with it.
//
// The validated request's facts go in as `request.*`; the AGENT'S OWN rules (admittedOperations.ts) derive
// `effect.*`; each effect is shown with its me.explain() trace: which exact request fields it was computed from.
// The trace is TRACEABILITY for the person. It is never sent to the app or the server, and no server may accept an
// explanation as proof of authorization: explain() shows how a value was computed from facts, it does not make the
// facts true.
import MeKernel from 'this.me';
import type { AdmittedOperation, EffectRule, Fact } from './admittedOperations';
import { fillWords } from './admittedOperations';
import { deepFreeze, type ValidatedCall } from './approval';

/** Public, explicit, test-only. Not identity material: anyone may know it. */
export const APPROVAL_KERNEL_SEED = 'agent-approval:public-test';

export type EffectView = Readonly<{
  name: string;
  value: boolean;
  sentence: string;
  expr: string;
  inputs: ReadonlyArray<Readonly<{ path: string; value: Fact }>>;
}>;

export type ApprovalView = Readonly<{ facts: Readonly<Record<string, Fact>>; effects: ReadonlyArray<EffectView> }>;

/** Computes the effects of one validated request with the agent's rules. Throws if a rule does not yield a boolean. */
export function approvalView(validated: ValidatedCall, admitted: AdmittedOperation): ApprovalView {
  const op = validated.operation;
  return effectsView(admitted.facts(op.body as Record<string, unknown>, { ttlMs: op.ttlMs, origin: validated.origin, audience: op.audience }), admitted.rules);
}

/** The same, for any fixed facts and the agent's own rules (keysList.ts uses it for keys.list). */
export function effectsView(facts: Record<string, Fact>, rules: readonly EffectRule[]): ApprovalView {
  const me = new (MeKernel as any)(APPROVAL_KERNEL_SEED);
  for (const [k, v] of Object.entries(facts)) me.request[k](v);
  for (const rule of rules) me.effect['='](rule.name, rule.formula);
  const effects = rules.map((rule) => {
    const ex = me.explain(`effect.${rule.name}`);
    if (typeof ex?.value !== 'boolean' || ex.meta?.unresolved) throw new Error(`EFFECT_UNRESOLVED: ${rule.name}`);
    return {
      name: rule.name,
      value: ex.value,
      sentence: fillWords(ex.value ? rule.whenTrue : rule.whenFalse, facts),
      expr: String(ex.expr),
      inputs: (ex.derivation?.inputs ?? []).map((i: any) => ({ path: String(i.path), value: i.value as Fact })),
    };
  });
  return deepFreeze({ facts: { ...facts }, effects });
}
