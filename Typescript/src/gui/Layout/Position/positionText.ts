// The position split between the two marks (Roles-and-Territories.md §3): `who @ where` -- the person's half (who:
// their username, their namespace) goes beside their QR, the place's half (@where) beside the site's brand. Pure.

export type PositionParts = { who: string; where: string };

/** `a @ b` → { who: 'a', where: 'b' }; text without ` @ ` is all `who`. */
export function splitPosition(text: string): PositionParts {
  const at = text.indexOf(' @ ');
  return at < 0 ? { who: text.trim(), where: '' } : { who: text.slice(0, at).trim(), where: text.slice(at + 3).trim() };
}

/** `@where` as it is drawn beside a brand (the default port of the page's scheme is already absent from a host). */
export const atWhere = (where: string) => (where ? `@${where}` : '');

export type WhoLines = { primary: string; secondary: string | null };

/**
 * The person's half in two lines: their username on top and the namespace below when there is a username
 * (`jabellae` / `cleaker.me`), else the namespace alone. A username is the first label of the namespace it is read
 * from (`jabellae.cleaker.me`), or given apart.
 */
export function whoLines(who: string, username?: string | null): WhoLines {
  const name = (username ?? '').trim();
  if (!name) return { primary: who, secondary: null };
  const namespace = who.startsWith(`${name}.`) ? who.slice(name.length + 1) : who;
  return { primary: name, secondary: namespace && namespace !== name ? namespace : null };
}
