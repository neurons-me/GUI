# Interface binding principle (proposed)

**Status:** proposed design principle, 2026-11-11. It describes a direction, not what exists. Nothing here is
implemented by this document, and it authorizes no code change, deployment or new operation.

Where its parts are planned or required, it points to the document that owns them instead of restating it:
- module composition (shell, apps that register their parts, publication): [Modules-Plan.md](Modules-Plan.md);
- custody of keys and authorization of operations: [Identity-Custody-Contract.md](Identity-Custody-Contract.md).

## The principle

> `.GUI` presents a declarative interface. Its components are bound to `.me` data and operations. The kernel
> computes; NRP expresses the interactions; each resource verifies the identity and authorizes the operation.
> Secrets stay in custody, and the interface receives only the results it is allowed to see.

## Two explicit conditions

1. **Rendering, navigating or recomputing causes no write and no external action.** A write or an external action
   (a payment, a message, a change on another service) happens only on an explicit invocation, and is authorized by
   the resource that performs it. A binding that only displays a value is a read.
2. **An app's declaration grants nothing.** It describes what the app needs (views, the capabilities it would use).
   The resource decides what it allows, for whom, every time. Showing a control is not authorizing it (Modules Plan,
   principle 4).

## What the parts are, kept apart

- **Shell and declaration.** Every door can share one shell; that does not mean one bundle. The shell loads the
  parts each app declares. A declaration (name, brand, icons, views, required capabilities) connects parts; it does
  not replace an app's components, behavior or backend.
- **Kernel and NRP.** The kernel keeps the graph and evaluates its rules. NRP expresses an interaction with a
  resource, which may be resolved locally or carried to another process. A public kernel may compute in the page;
  privileged operations run where the corresponding authority lives.
- **Capabilities, not credential paths.** An app asks for a concrete capability with limits (for example, create a
  payment up to an amount), never for access to the path where a credential is stored.
- **Custody per responsibility.** Signing an identity operation and using a third-party credential (an API key) are
  different responsibilities and may need different custodians. Encrypted branches in `.me` store data; they do not
  by themselves say who may decrypt it or which code may use it.

## Not settled here

- Any syntax for bindings or operations.

## Discarded

These examples came up while discussing this and are **discarded**. Do not implement them:
- `<% ... %>`-style holes that run an expression while rendering: they make a render able to act (condition 1).
- An operation written as a binding, e.g. `<% me://<ns>:pay/keys.paypal { ... } %>`: a payment triggered by a render.
- `requires: me.keys.<x>`: it names the path where a credential is stored instead of a capability with limits.
- Who custodies third-party credentials, and the approval and duplicate-protection rules for external actions.
- What the root endpoint of a door publishes: a separate pending review,
  [Root-Endpoint-Publication-Review.md](Root-Endpoint-Publication-Review.md).
