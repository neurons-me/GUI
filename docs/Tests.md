# Tests

`this.gui` has three test suites. Two run automatically on every build; one requires a compiled dist.

---

## Run all

```bash
npm run test:runtime
```

Runs `markdown-document-core` + `monad-discovery-core` in sequence. This is also the `prebuild` hook — it runs before every `npm run build`.

---

## Suites

### `markdown-document-core.test.ts`

**What it tests:** The markdown → GUI node pipeline.

Parses a markdown document with headings, paragraphs, inline code, links, fenced code blocks, bullet lists, and tables — and asserts the output tree matches the expected GUI node structure. Also tests `resolveMarkdownUrl` for relative and absolute URL resolution.

**How to run:**

```bash
npx tsx tests/markdown-document-core.test.ts
```

**Expected output:**

```
markdown-document-core ok
```

---

### `monad-discovery-core.test.ts`

**What it tests:** The monad discovery and topology scan system.

- `normalizeMonadEndpointInput` — cleans and normalizes endpoint strings
- `mergeDiscoveredMonads` — deduplicates monads by id, merges endpoints and capabilities
- `scanMonadTopology` — full network scan with a fake fetch: surface probing, mesh discovery, netget registry, dead endpoint detection
- `createMonadDiscoveryStore` — reactive store with rescan, race condition handling between slow and fast surface resolvers

**How to run:**

```bash
npx tsx tests/monad-discovery-core.test.ts
```

**Expected output:**

```
monad-discovery-core ok
```

---

### `consume-test.mjs`

**What it tests:** That the compiled dist bundle exports correctly and can be consumed as a package.

- Validates `Theme`, `atoms`, `version` are present in `dist/this.gui.es.js`
- Installs `this.gui` from local dist in a temp directory and imports it — without `react-router-dom`
- Repeats with `react-router-dom` present and validates `QRouter` is importable from `this.gui/router`

**Requires:** A compiled dist — run `npm run build` first.

**How to run:**

```bash
npm run build
node tests/consume-test.mjs
```

**Expected output:**

```
✓ Test 1: Core bundle exports
✓ Test 2: Consumption without react-router-dom
✓ Test 3: Consumption of router subpath
```

---

## Coverage

| Suite | Covers |
|---|---|
| `markdown-document-core` | Markdown parser, node tree output, URL resolution |
| `monad-discovery-core` | Endpoint normalization, topology scan, merge logic, reactive store |
| `consume-test` | Bundle integrity, package consumption, subpath exports |
