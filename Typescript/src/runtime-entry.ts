export type {
  MountDevtoolsOptions,
  MountOptions,
  MountTarget,
} from './runtime/mount';
export { mount } from './runtime/mount';
export * from './runtime/adapter';
export * from './runtime/parts';
export * from './runtime/provider';
export * from './runtime/monads';
export * from './runtime/run-me';
export { createWsMeRuntime } from './runtime/createWsMeRuntime';
export type { CreateWsMeRuntimeOptions, WsMeRuntime } from './runtime/createWsMeRuntime';
export * from './runtime/runtimeContext';
export * from './runtime/start-app';
export * from './runtime/renderer';
export { mountApp, declareApp, defineSpecView, isSpecViewFactory } from './runtime/mountApp';
export type { AppDeclaration, MountAppOptions } from './runtime/mountApp';
export { SpecBoundary } from './runtime/SpecBoundary';
export type { SpecBoundaryProps } from './runtime/SpecBoundary';
export { AppShell } from './runtime/AppShell';
export type { AppShellProps, AppShellNavItem } from './runtime/AppShell';
// GuiRegistry (the aggregated { [type]: RegistryEntry } map built from every
// component's own .resolver.tsx — meta.demoSpec included) had no public
// export path at all before this line — only reachable via the internal
// `@/Registry` alias. Exposing the existing object here, not duplicating
// or rebuilding it: a spec-driven catalog app needs this to resolve
// `type` strings and to enumerate demoSpecs for live previews.
export { GuiRegistry } from './Registry';
export type { RegistryEntry, RegistryMeta, RegistryKind, GuiRegistry as GuiRegistryType } from './Registry';
