// A tiny grammar for writing an audience over NAMES, so an experiment can be typed:
//
//   ana | bob              OR
//   ana & bob              AND
//   (ana & bob) | carol    nested
//
// `&` binds tighter than `|`. The result is the algebra's own shape: an array is OR, `{ and: [...] }` is AND.
export type NameFormula = string | NameFormula[] | { and: NameFormula[] };

type Token = '(' | ')' | '|' | '&' | { name: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < source.length; ) {
    const c = source[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === '(' || c === ')' || c === '|' || c === '&') { tokens.push(c); i += 1; continue; }
    const m = /^[A-Za-z0-9_.-]+/.exec(source.slice(i));
    if (!m) throw new Error(`Unexpected "${c}" at ${i}`);
    tokens.push({ name: m[0].toLowerCase() });
    i += m[0].length;
  }
  return tokens;
}

export function parseAudience(source: string): NameFormula {
  const tokens = tokenize(source);
  if (!tokens.length) throw new Error('The audience is empty.');
  let pos = 0;
  const peek = () => tokens[pos];

  const or = (): NameFormula => {
    const parts = [and()];
    while (peek() === '|') { pos += 1; parts.push(and()); }
    return parts.length === 1 ? parts[0] : parts;
  };
  const and = (): NameFormula => {
    const parts = [atom()];
    while (peek() === '&') { pos += 1; parts.push(atom()); }
    return parts.length === 1 ? parts[0] : { and: parts };
  };
  const atom = (): NameFormula => {
    const t = tokens[pos];
    if (t === undefined) throw new Error('The audience ends where a name was expected.');
    pos += 1;
    if (t === '(') {
      const inner = or();
      if (tokens[pos] !== ')') throw new Error('Missing ")".');
      pos += 1;
      return inner;
    }
    if (typeof t === 'object') return t.name;
    throw new Error(`Expected a name, got "${t}".`);
  };

  const result = or();
  if (pos < tokens.length) throw new Error(`Unexpected "${String(tokens[pos])}".`);
  return result;
}

/** Every name an audience mentions. */
export function namesIn(formula: NameFormula, into = new Set<string>()): Set<string> {
  if (typeof formula === 'string') into.add(formula);
  else if (Array.isArray(formula)) formula.forEach((f) => namesIn(f, into));
  else formula.and.forEach((f) => namesIn(f, into));
  return into;
}

/** Replaces each name with what `resolve` gives for it (an identity), keeping the algebra's shape. */
export function mapNames<T>(formula: NameFormula, resolve: (name: string) => T): unknown {
  if (typeof formula === 'string') return resolve(formula);
  if (Array.isArray(formula)) return formula.map((f) => mapNames(f, resolve));
  return { and: formula.and.map((f) => mapNames(f, resolve)) };
}
