/** Roots under `keys` that are never listed to an app nor shown in the agent's login view. */
export const LOGIN_EXCLUDED_ROOTS: readonly string[] = Object.freeze(['netget']);

/** `rel` is a path under `keys` (`netget`, `netget.gateway`, `meta.instagram`). */
export function isLoginExcluded(rel: string): boolean {
  return LOGIN_EXCLUDED_ROOTS.some((r) => rel === r || rel.startsWith(`${r}.`));
}
