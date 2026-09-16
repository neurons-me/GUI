/**
 * NRP Expression parser.
 *
 * Parses .me algebra into a strict AST. The client sends { raw, canonical, ast }
 * as intent/hint. The NRP server has semantic authority — it re-parses and
 * resolves against the actual .me kernel.
 *
 * Rule: Beatle parses intent. NRP resolves route. .me resolves meaning.
 *
 * Grammar (left-associative for binary ops):
 *   expr    = term ('+' term)*
 *   term    = factor ('∩' factor)*
 *   factor  = atom ('@' overlaySurface)?
 *   atom    = '~' atom | '(' expr ')' | NAMESPACE
 *   overlaySurface = QUOTED_URI | NS_TOKEN
 *
 * Precedence (high → low): ~ (prefix) > @ (postfix) > ∩ > +
 *
 * Namespace tokens: cleaker-style — alphanum, dots, hyphens, underscores,
 *   brackets [...], colons (operation), slashes (path). E.g.:
 *     jabellae
 *     jabellae.suis-macbook-air.local
 *     cleaker.me[host:localhost|protocol:http|port:8161]:open/profile
 *
 * Important NRP distinction:
 *   namespace[selector]/path  → selector is a technical monad route override.
 *   expression @ surface      → surface is a projection/overlay context.
 *
 * In NRP v0.2.1, [surface:name] is legacy compatibility for old drafts.
 * New selectors should be monad selectors ([monadlisa], [current], [], etc.).
 * Physical targets like "iphone" are placement metadata resolved by NetGet,
 * not canonical selector names unless they are also actual monad names.
 *
 * Quoted overlay: @ "https://wikipedia.com/Scarab"
 * Bare overlay:   @ wikipedia.com
 */

import { parseNamespaceExpression as cleakerParse, isValidDomainShape } from 'cleaker';
import type { ParsedNamespaceExpression } from 'cleaker';

export type NRPNodeKind = 'namespace' | 'union' | 'intersection' | 'overlay' | 'complement';

export type NamespaceLeaf = {
  kind: 'namespace';
  value: string;
  /** Cleaker-parsed result when valid */
  parsed?: ParsedNamespaceExpression;
  /** Reason Cleaker rejected this leaf */
  parseError?: string;
};

export type NRPNode =
  | NamespaceLeaf
  | { kind: 'complement';   operand: NRPNode }
  | { kind: 'union';        left: NRPNode; right: NRPNode }
  | { kind: 'intersection'; left: NRPNode; right: NRPNode }
  /** Projection overlay. This is not the same as an NRP [monad] selector. */
  | { kind: 'overlay';      namespace: NRPNode; surface: string };

export type NRPExpression = {
  raw: string;
  canonical: string;
  ast: NRPNode;
  /** Algebra parsed without syntax errors */
  syntaxValid: boolean;
  /** All namespace leaves passed Cleaker validation */
  namespaceValid: boolean;
  /**
   * All namespace leaves have real FQDN shape (2+ DNS-label-shaped segments —
   * cleaker's isValidDomainShape). A namespace can be namespaceValid (parses,
   * can be claimed/written to `.me`) without being domainShapeValid — that's
   * the "invalid claim, never resolves" case, not a parse error.
   */
  domainShapeValid: boolean;
  /** syntaxValid — safe to send to NRP server */
  valid: boolean;
  error?: string;
};

// ── Operator precedence ────────────────────────────────────────────────────
// Higher = tighter binding. Used by canonicalize to insert parens correctly.

const PREC = {
  union:        1,
  intersection: 2,
  overlay:      3,
  // complement is prefix — handled separately
} as const;

// ── Tokenizer ──────────────────────────────────────────────────────────────

type Token =
  | { type: 'ns';     value: string }
  | { type: 'quoted'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'op';     value: '+' | '∩' | '@' | '~' }
  | { type: 'end' };

class ParseError extends Error {
  constructor(msg: string, public pos: number) { super(msg); }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.trim();

  while (i < s.length) {
    const ch = s[i];

    if (ch === ' ' || ch === '\t') { i++; continue; }
    if (ch === '+') { tokens.push({ type: 'op', value: '+' }); i++; continue; }
    if (ch === '∩') { tokens.push({ type: 'op', value: '∩' }); i++; continue; }
    if (ch === '@') { tokens.push({ type: 'op', value: '@' }); i++; continue; }
    if (ch === '~') { tokens.push({ type: 'op', value: '~' }); i++; continue; }
    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue; }

    // Quoted overlay surface string: "..."
    if (ch === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') j++;
      if (j >= s.length) throw new ParseError('Unterminated quoted string', i);
      tokens.push({ type: 'quoted', value: s.slice(i + 1, j) });
      i = j + 1;
      continue;
    }

    // Cleaker-style namespace token.
    // Accepts: alphanum, ., -, _, [, ], |, :, /
    // Track bracket depth so | inside [...] doesn't confuse anything.
    if (/[a-zA-Z0-9]/.test(ch)) {
      let j = i;
      let depth = 0;
      while (j < s.length) {
        const c = s[j];
        if (c === '[') { depth++; j++; continue; }
        if (c === ']') { depth--; j++; continue; }
        if (depth > 0) { j++; continue; }
        if (/[a-zA-Z0-9.\-_:\/]/.test(c)) { j++; continue; }
        break;
      }
      tokens.push({ type: 'ns', value: s.slice(i, j) });
      i = j;
      continue;
    }

    throw new ParseError(`Unexpected character '${ch}' at position ${i}`, i);
  }

  tokens.push({ type: 'end' });
  return tokens;
}

// ── Recursive descent parser ───────────────────────────────────────────────

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos] ?? { type: 'end' }; }
  private consume(): Token { return this.tokens[this.pos++] ?? { type: 'end' }; }
  private isOp(value: string): boolean {
    const t = this.peek();
    return t.type === 'op' && (t as any).value === value;
  }

  parse(): NRPNode {
    const node = this.parseUnion();
    if (this.peek().type !== 'end') {
      throw new ParseError(`Unexpected token after expression at position ${this.pos}`, this.pos);
    }
    return node;
  }

  private parseUnion(): NRPNode {
    let left = this.parseIntersection();
    while (this.isOp('+')) {
      this.consume();
      const right = this.parseIntersection();
      left = { kind: 'union', left, right };
    }
    return left;
  }

  private parseIntersection(): NRPNode {
    let left = this.parseOverlay();
    while (this.isOp('∩')) {
      this.consume();
      const right = this.parseOverlay();
      left = { kind: 'intersection', left, right };
    }
    return left;
  }

  private parseOverlay(): NRPNode {
    const ns = this.parseAtom();
    if (this.isOp('@')) {
      this.consume();
      const t = this.peek();
      if (t.type === 'quoted') { this.consume(); return { kind: 'overlay', namespace: ns, surface: t.value }; }
      if (t.type === 'ns')     { this.consume(); return { kind: 'overlay', namespace: ns, surface: t.value }; }
      throw new ParseError('Expected overlay surface after @', this.pos);
    }
    return ns;
  }

  private parseAtom(): NRPNode {
    const t = this.peek();

    if (t.type === 'op' && (t as any).value === '~') {
      this.consume();
      return { kind: 'complement', operand: this.parseAtom() };
    }

    if (t.type === 'lparen') {
      this.consume();
      const inner = this.parseUnion();
      if (this.peek().type !== 'rparen') throw new ParseError('Expected closing )', this.pos);
      this.consume();
      return inner;
    }

    if (t.type === 'ns') {
      this.consume();
      return makeNamespaceLeaf(t.value);
    }

    throw new ParseError(`Expected namespace or expression, got '${t.type}'`, this.pos);
  }
}

// ── Cleaker leaf parsing ───────────────────────────────────────────────────

function makeNamespaceLeaf(value: string): NamespaceLeaf {
  try {
    const parsed = cleakerParse(value);
    return { kind: 'namespace', value, parsed };
  } catch (e) {
    return { kind: 'namespace', value, parseError: String(e) };
  }
}

function allNamespacesValid(node: NRPNode): boolean {
  switch (node.kind) {
    case 'namespace':    return node.parsed !== undefined;
    case 'complement':   return allNamespacesValid(node.operand);
    case 'union':        return allNamespacesValid(node.left) && allNamespacesValid(node.right);
    case 'intersection': return allNamespacesValid(node.left) && allNamespacesValid(node.right);
    case 'overlay':      return allNamespacesValid(node.namespace);
  }
}

function allNamespacesDomainShaped(node: NRPNode): boolean {
  switch (node.kind) {
    case 'namespace':    return node.parsed !== undefined && isValidDomainShape(node.parsed.fqdn);
    case 'complement':   return allNamespacesDomainShaped(node.operand);
    case 'union':        return allNamespacesDomainShaped(node.left) && allNamespacesDomainShaped(node.right);
    case 'intersection': return allNamespacesDomainShaped(node.left) && allNamespacesDomainShaped(node.right);
    case 'overlay':      return allNamespacesDomainShaped(node.namespace);
  }
}

// ── Canonical serializer ───────────────────────────────────────────────────
// Precedence-aware: inserts parens wherever child prec < parent prec,
// preserving semantic stability across parse/serialize round-trips.

function canonicalizeNode(node: NRPNode, minPrec: number): string {
  switch (node.kind) {
    case 'namespace':
      return node.parsed?.expression ?? node.value;

    case 'complement': {
      // ~ is prefix with highest binding — wrap operand if it's any binary op
      const inner = canonicalizeNode(node.operand, PREC.overlay + 1);
      return `~${inner}`;
    }

    case 'union': {
      // Left-associative: left child at same prec, right child at prec+1
      const s = `${canonicalizeNode(node.left, PREC.union)} + ${canonicalizeNode(node.right, PREC.union + 1)}`;
      return minPrec > PREC.union ? `(${s})` : s;
    }

    case 'intersection': {
      const s = `${canonicalizeNode(node.left, PREC.intersection)} ∩ ${canonicalizeNode(node.right, PREC.intersection + 1)}`;
      return minPrec > PREC.intersection ? `(${s})` : s;
    }

    case 'overlay': {
      // namespace side: must be atom-level (no binary ops without parens)
      const ns = canonicalizeNode(node.namespace, PREC.overlay + 1);
      const surface = node.surface.includes('://') ? `"${node.surface}"` : node.surface;
      const s = `${ns} @ ${surface}`;
      return minPrec > PREC.overlay ? `(${s})` : s;
    }
  }
}

export function canonicalize(node: NRPNode): string {
  return canonicalizeNode(node, 0);
}

// ── Public API ─────────────────────────────────────────────────────────────

export function parseNRPExpression(raw: string): NRPExpression {
  try {
    const tokens = tokenize(raw.trim());
    const ast = new Parser(tokens).parse();
    const canonical = canonicalize(ast);
    const namespaceValid = allNamespacesValid(ast);
    const domainShapeValid = namespaceValid && allNamespacesDomainShaped(ast);
    return { raw, canonical, ast, syntaxValid: true, namespaceValid, domainShapeValid, valid: true };
  } catch (e) {
    const fallback: NRPNode = { kind: 'namespace', value: raw.trim(), parseError: String(e) };
    return {
      raw,
      canonical: raw.trim(),
      ast: fallback,
      syntaxValid: false,
      namespaceValid: false,
      domainShapeValid: false,
      valid: false,
      error: String(e),
    };
  }
}

export function isSimpleNamespace(expr: NRPExpression): boolean {
  return expr.ast.kind === 'namespace';
}

// ── Bare-handle expansion ──────────────────────────────────────────────────
// A "bare handle" is a namespace token with no dots — e.g. "jabellae".
// When a resolver root is known, bare handles expand to handle.namespaceRoot.
// "jabellae + alex" + "cleaker.me" → "jabellae.cleaker.me + alex.cleaker.me"

function isBareHandle(value: string): boolean {
  return !value.includes('.') && !value.includes('/') && !value.includes('[');
}

function expandNode(node: NRPNode, namespaceRoot: string): NRPNode {
  switch (node.kind) {
    case 'namespace':
      return isBareHandle(node.value)
        ? makeNamespaceLeaf(`${node.value}.${namespaceRoot}`)
        : node;
    case 'complement':
      return { kind: 'complement', operand: expandNode(node.operand, namespaceRoot) };
    case 'union':
      return { kind: 'union', left: expandNode(node.left, namespaceRoot), right: expandNode(node.right, namespaceRoot) };
    case 'intersection':
      return { kind: 'intersection', left: expandNode(node.left, namespaceRoot), right: expandNode(node.right, namespaceRoot) };
    case 'overlay':
      return { kind: 'overlay', namespace: expandNode(node.namespace, namespaceRoot), surface: node.surface };
  }
}

export function expandBareHandles(expr: NRPExpression, namespaceRoot: string): NRPExpression {
  const ast = expandNode(expr.ast, namespaceRoot);
  const canonical = canonicalize(ast);
  const namespaceValid = allNamespacesValid(ast);
  return { ...expr, ast, canonical, namespaceValid, domainShapeValid: namespaceValid && allNamespacesDomainShaped(ast) };
}

// ── NRP URI parsing ────────────────────────────────────────────────────────
// Parses the full me:// form and separates namespace, monad selector, and expression.
//
// Grammar:
//   me-uri   = "me://" namespace [ "[" selector "]" ] "/" expression
//   selector = ""                    → default synthesis (canonical public form)
//            | "current"             → force local monad
//            | monad-name            → [monadlisa]
//            | monad-name "," ...    → [monadlisa,worker-a]
//            | "claim:" token        → pairing handshake
//            | "surface:" name       → legacy compatibility
//
// Bare input without me:// prefix is treated as an expression relative to resolverNamespace.

export type NRPMonadSelector =
  | { kind: 'default' }
  | { kind: 'current' }
  | { kind: 'monad';        name: string }
  | { kind: 'monad-set';    names: string[] }
  | { kind: 'claim';        token: string }
  | { kind: 'legacy-surface'; name: string };

export type NRPURI = {
  raw: string;
  namespace: string;
  monadSelector: NRPMonadSelector;
  expression: NRPExpression;
  /** Canonical form: me://namespace[monad?]/canonical-expression */
  canonical: string;
  valid: boolean;
  error?: string;
};

const ME_PREFIX = 'me://';

function parseMonadSelector(inner: string): NRPMonadSelector {
  if (inner === '')              return { kind: 'default' };
  if (inner === 'current')       return { kind: 'current' };
  if (inner.startsWith('claim:'))   return { kind: 'claim',          token: inner.slice(6) };
  if (inner.startsWith('surface:')) return { kind: 'legacy-surface', name:  inner.slice(8) };
  if (inner.includes(','))       return { kind: 'monad-set', names: inner.split(',').map(s => s.trim()) };
  return { kind: 'monad', name: inner };
}

function monadSelectorStr(sel: NRPMonadSelector): string {
  switch (sel.kind) {
    case 'default':        return '';            // omit [] — canonical public form
    case 'current':        return '[current]';
    case 'monad':          return `[${sel.name}]`;
    case 'monad-set':      return `[${sel.names.join(',')}]`;
    case 'claim':          return `[claim:${sel.token}]`;
    case 'legacy-surface': return `[surface:${sel.name}]`;
  }
}

function makeURIError(raw: string, namespace: string, error: string): NRPURI {
  const expression = parseNRPExpression('');
  return { raw, namespace, monadSelector: { kind: 'default' }, expression, canonical: raw, valid: false, error };
}

/**
 * Parse a full `me://` URI or a bare expression.
 *
 * If `raw` starts with `me://`, the namespace and optional monad selector are
 * extracted from the URI. Otherwise, `raw` is treated as a bare expression
 * relative to `resolverNamespace`, and bare handles are expanded automatically.
 */
export function parseNRPURI(raw: string, resolverNamespace?: string): NRPURI {
  let rest = raw.trim();

  if (!rest.startsWith(ME_PREFIX)) {
    // Bare expression — expand relative to resolver root
    let expr = parseNRPExpression(rest);
    if (resolverNamespace) expr = expandBareHandles(expr, resolverNamespace);
    const ns = resolverNamespace ?? '';
    const canonical = ns ? `me://${ns}/${expr.canonical}` : expr.canonical;
    return { raw, namespace: ns, monadSelector: { kind: 'default' }, expression: expr, canonical, valid: expr.valid, error: expr.error };
  }

  rest = rest.slice(ME_PREFIX.length);

  // Extract namespace (stops at [ or /)
  let i = 0;
  while (i < rest.length && rest[i] !== '[' && rest[i] !== '/') i++;
  const namespace = rest.slice(0, i);
  rest = rest.slice(i);

  if (!namespace) return makeURIError(raw, resolverNamespace ?? '', 'Missing namespace in me:// URI');

  // Optional monad selector [...]
  let monadSelector: NRPMonadSelector = { kind: 'default' };
  if (rest.startsWith('[')) {
    const close = rest.indexOf(']');
    if (close === -1) return makeURIError(raw, namespace, 'Unclosed [ in monad selector');
    monadSelector = parseMonadSelector(rest.slice(1, close));
    rest = rest.slice(close + 1);
  }

  // Consume leading /
  if (rest.startsWith('/')) rest = rest.slice(1);

  const expression = parseNRPExpression(rest);
  const canonical = `me://${namespace}${monadSelectorStr(monadSelector)}/${expression.canonical}`;

  return { raw, namespace, monadSelector, expression, canonical, valid: expression.valid, error: expression.error };
}
