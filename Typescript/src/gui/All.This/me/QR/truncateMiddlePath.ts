// truncateMiddlePath.ts — hash-style middle ellipsis for a .me address
// (`<handle>.<root>/<path…>`), segment-aware. The START (the username) and
// the END (the deepest segment) always stay. The host suffix goes FIRST
// (`.cleaker.me` says the least — `jabellae…/` already reads), then path
// segments from the first one down:
//
//   jabellae.cleaker.me/keys/paypal/sandbox
//   jabellae…/keys/paypal/sandbox
//   jabellae…/paypal/sandbox
//   jabellae…/sandbox
//   jabel…/sandbox   (char-level, last resort; then the end shrinks too)
//
//   jabellae.cleaker.me → jabellae…   (no path)
//
// `fits` decides (callers measure real rendered width). Pure; no DOM.

export const ELLIPSIS = '…';

/** Every candidate from longest to shortest, in the order the middle is eaten. */
export function middlePathCandidates(text: string): string[] {
  const full = String(text ?? '');
  const slash = full.indexOf('/');
  const host = slash < 0 ? full : full.slice(0, slash);
  const path = slash < 0 ? [] : full.slice(slash + 1).split('/').filter(Boolean);
  const labels = host.split('.').filter(Boolean);
  const out: string[] = [full];
  const push = (s: string) => { if (s && s !== out[out.length - 1]) out.push(s); };

  const user = labels[0] ?? host;
  if (path.length) {
    const tail = (k: number) => path.slice(k).join('/');
    const last = path[path.length - 1];
    // 1) The host suffix first (only when there is one to eat).
    if (labels.length > 1) push(`${user}${ELLIPSIS}/${tail(0)}`);
    // 2) Then path segments, from the first one down (the last always stays).
    for (let k = 1; k < path.length; k++) push(`${user}${ELLIPSIS}/${tail(k)}`);
    if (labels.length <= 1 && path.length === 1) push(`${user}${ELLIPSIS}/${last}`);
    // 3) Char-level: shrink the username (keep one char), then the end from its left.
    for (let c = user.length - 1; c >= 1; c--) push(`${user.slice(0, c)}${ELLIPSIS}/${last}`);
    for (let c = last.length - 1; c >= 1; c--) push(`${user.slice(0, 1)}${ELLIPSIS}${last.slice(-c)}`);
  } else if (labels.length > 1) {
    // Host only: the username stays, the suffix goes.
    push(`${user}${ELLIPSIS}`);
    for (let c = user.length - 1; c >= 1; c--) push(`${user.slice(0, c)}${ELLIPSIS}`);
  } else {
    // One word: classic middle cut.
    for (let keep = full.length - 1; keep >= 2; keep--) {
      const head = Math.ceil(keep / 2); push(`${full.slice(0, head)}${ELLIPSIS}${full.slice(full.length - (keep - head))}`);
    }
  }
  return out;
}

/** The longest candidate that `fits` (falls back to the shortest). */
export function truncateMiddlePath(text: string, fits: (candidate: string) => boolean): string {
  const list = middlePathCandidates(text);
  for (const c of list) if (fits(c)) return c;
  return list[list.length - 1];
}

/** Convenience for monospace: fit by character count (grapheme-naive; addresses are ASCII). */
export function truncateMiddlePathToChars(text: string, maxChars: number): string {
  return truncateMiddlePath(text, (c) => Array.from(c).length <= maxChars);
}
