import{u as a,j as e,M as c}from"./iframe-q72FflWy.js";import"./preload-helper-Dp1pzeXC.js";function r(s){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",p:"p",pre:"pre",strong:"strong",...a(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(c,{title:"All.This/NRP/Beatle/Contract"}),`
`,e.jsx(n.h1,{id:"beatle--nrp-algebraic-expression-contract",children:"Beatle — NRP Algebraic Expression Contract"}),`
`,e.jsxs(n.blockquote,{children:[`
`,e.jsx(n.p,{children:e.jsxs(n.strong,{children:["Beatle parses intent. NRP resolves route. ",e.jsx(n.code,{children:".me"})," resolves meaning."]})}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"what-cleaker-is",children:"What Cleaker is"}),`
`,e.jsx(n.p,{children:"A namespace has two modes of existence, and they are not in conflict — they are complementary:"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.strong,{children:"Mode 1 — Direct navigation."})," The namespace is the URL."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`https://jabellae.cleaker.me/photos
`})}),`
`,e.jsxs(n.p,{children:["You navigate to it. The monad serves the view. The browser renders it. This is a normal HTTPS request: the ",e.jsx(n.code,{children:"Host"})," header carries the namespace, the path carries the semantic address. No special client needed."]}),`
`,e.jsxs(n.p,{children:[e.jsx(n.strong,{children:"Mode 2 — Parallel correlation."})," You are anywhere on the web, and your namespace travels with you."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{children:`browser:  https://wikipedia.com/Scarab      ← normal HTTP, any site
Beatle:   me://cleaker.me/jabellae          ← WebSocket, your namespace
`})}),`
`,e.jsxs(n.p,{children:["Beatle holds the channel open. Your identity is present. The browser URL does not change — but your namespace context is active. You can combine both: your data from ",e.jsx(n.code,{children:"jabellae.cleaker.me"})," overlaid on the page you are viewing."]}),`
`,e.jsxs(n.p,{children:["This is what ",e.jsx(n.code,{children:"@ surface"})," expresses in the algebra:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae @ wikipedia.com
`})}),`
`,e.jsx(n.p,{children:"Not a redirect. Not a navigation. A correlation — your namespace data, projected onto where you already are."}),`
`,e.jsx(n.p,{children:e.jsx(n.strong,{children:"The response format follows the channel:"})}),`
`,e.jsxs(n.p,{children:[`| Channel | Trigger | Response | For |
|---|---|---|---|
| HTTPS | URL / link | HTML view (rendered by monad) | human navigation |
| Beatle WS | `,e.jsx(n.code,{children:"nrp.open"})," | JSON ",e.jsx(n.code,{children:"resolved"})," + ",e.jsx(n.code,{children:"data"})," | system composition |"]}),`
`,e.jsx(n.p,{children:"Same namespace. Same path. Same meaning. Different representation based on how you asked."}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"beatles-role",children:"Beatle's role"}),`
`,e.jsxs(n.p,{children:["Beatle is the client of the second channel. It is not a navigation widget — it opens a ",e.jsx(n.strong,{children:"bidirectional WebSocket"})," to a ",e.jsx(n.code,{children:".me"})," namespace and keeps it alive while the browser does whatever it does via HTTP."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"nrp-uri-shape",children:"NRP URI Shape"}),`
`,e.jsx(n.p,{children:"Beatle separates the NRP address from the algebraic expression that runs inside it."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`me://<namespace>[<monad-selector>]/<expression>
`})}),`
`,e.jsxs(n.p,{children:[`| Slot | Meaning |
|---|---|
| `,e.jsx(n.code,{children:"namespace"})," | Semantic parent space, e.g. ",e.jsx(n.code,{children:"cleaker.me"}),` |
| `,e.jsx(n.code,{children:"[monad-selector]"}),` | Optional technical execution override |
| `,e.jsx(n.code,{children:"expression"})," | Algebra resolved relative to the namespace |"]}),`
`,e.jsx(n.p,{children:"The canonical form omits the selector:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`me://cleaker.me/jabellae + alex
`})}),`
`,e.jsx(n.p,{children:"NRP chooses the execution route through Total Monad Synthesis. A selector only appears when the caller needs a technical override:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`me://cleaker.me[monadlisa]/jabellae + alex
me://cleaker.me[current]/profile.name
me://cleaker.me[]/jabellae + alex
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"[iphone]"}),", ",e.jsx(n.code,{children:"[macbook]"}),", and ",e.jsx(n.code,{children:"[local]"})," are not canonical selectors unless those are actual monad names. In NRP v0.2.1, physical targets such as ",e.jsx(n.code,{children:"iphone"})," live as NetGet placement metadata on a monad. ",e.jsx(n.code,{children:"[surface:name]"})," is legacy compatibility from earlier drafts; new implementations should prefer monad selectors."]}),`
`,e.jsxs(n.p,{children:["This is separate from the ",e.jsx(n.code,{children:"@"})," operator below. ",e.jsx(n.code,{children:"[...]"})," chooses or constrains the executor. ",e.jsx(n.code,{children:"@"})," chooses the projection/overlay surface of the result."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"the-grammar",children:"The Grammar"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`expr    = term ('+' term)*           // union
term    = factor ('∩' factor)*       // intersection
factor  = atom ('@' overlaySurface)? // projection overlay
atom    = '~' atom                   // complement
        | '(' expr ')'              // grouping
        | NAMESPACE                  // leaf (Cleaker-parsed)

overlaySurface = '"' URI '"'        // quoted URI
               | NS_TOKEN           // bare hostname
`})}),`
`,e.jsx(n.h3,{id:"operator-precedence",children:"Operator Precedence"}),`
`,e.jsxs(n.p,{children:[`| Operator | Symbol | Binding | Precedence |
|---|---|---|---|
| Complement | `,e.jsx(n.code,{children:"~"}),` | prefix | highest |
| Overlay | `,e.jsx(n.code,{children:"@"}),` | postfix | 3 |
| Intersection | `,e.jsx(n.code,{children:"∩"}),` | infix | 2 |
| Union | `,e.jsx(n.code,{children:"+"})," | infix | 1 (lowest) |"]}),`
`,e.jsxs(n.p,{children:["All binary operators are ",e.jsx(n.strong,{children:"left-associative"}),". Use parentheses to override."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"expression-examples",children:"Expression Examples"}),`
`,e.jsx(n.h3,{id:"relative-handle",children:"Relative handle"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae
`})}),`
`,e.jsxs(n.p,{children:["Resolve ",e.jsx(n.code,{children:"jabellae"})," relative to the active parent namespace selected by Beatle's resolver, for example ",e.jsx(n.code,{children:"cleaker.me"}),"."]}),`
`,e.jsx(n.h3,{id:"union--shared-channel",children:"Union — shared channel"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae + alex
`})}),`
`,e.jsxs(n.p,{children:["Both ",e.jsx(n.code,{children:"jabellae"})," and ",e.jsx(n.code,{children:"alex"})," are in the channel. The NRP server resolves the union and returns the combined audience."]}),`
`,e.jsx(n.h3,{id:"intersection--shared-region-only",children:"Intersection — shared region only"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae ∩ team.acme
`})}),`
`,e.jsx(n.p,{children:"Only the overlapping region of both namespaces. The channel represents what both parties have in common."}),`
`,e.jsx(n.h3,{id:"complement",children:"Complement"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`~jabellae
`})}),`
`,e.jsxs(n.p,{children:["The complement of the ",e.jsx(n.code,{children:"jabellae"})," namespace. In a filter context: everything except ",e.jsx(n.code,{children:"jabellae"}),"."]}),`
`,e.jsx(n.h3,{id:"overlay--expression-over-a-projection-surface",children:"Overlay — expression over a projection surface"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae @ wikipedia.com
`})}),`
`,e.jsxs(n.p,{children:["Open the ",e.jsx(n.code,{children:"jabellae"})," channel projected over the ",e.jsx(n.code,{children:"wikipedia.com"})," overlay surface. The browser keeps its own HTTP connection to Wikipedia — Beatle adds a parallel namespace session."]}),`
`,e.jsx(n.h3,{id:"quoted-uri-overlay",children:"Quoted URI overlay"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae @ "https://wikipedia.com/Scarab"
`})}),`
`,e.jsx(n.p,{children:"Full URI as overlay surface. Must be quoted. Bare tokens are hostname-only."}),`
`,e.jsx(n.h3,{id:"compound-expressions",children:"Compound expressions"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae + alex @ wikipedia.com
`})}),`
`,e.jsxs(n.p,{children:["⚠️ This parses as ",e.jsx(n.code,{children:"jabellae + (alex @ wikipedia.com)"})," — overlay applies to ",e.jsx(n.code,{children:"alex"})," only."]}),`
`,e.jsx(n.p,{children:"To overlay the union:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`(jabellae + alex) @ wikipedia.com
`})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`jabellae ∩ (team + friends) @ wikipedia.com
`})}),`
`,e.jsxs(n.p,{children:["Intersection of ",e.jsx(n.code,{children:"jabellae"})," with ",e.jsx(n.code,{children:"(team ∪ friends)"}),", overlaid on ",e.jsx(n.code,{children:"wikipedia.com"}),"."]}),`
`,e.jsx(n.h3,{id:"nested-complement",children:"Nested complement"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`~(public + spam)
`})}),`
`,e.jsxs(n.p,{children:["Complement of the union. The parentheses are required — without them, ",e.jsx(n.code,{children:"~public + spam"})," = ",e.jsx(n.code,{children:"(~public) + spam"}),"."]}),`
`,e.jsx(n.h3,{id:"full-cleaker-namespace-token",children:"Full Cleaker namespace token"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`cleaker.me[host:localhost|protocol:http|port:8161]:open/profile
`})}),`
`,e.jsx(n.p,{children:"A Cleaker-format namespace leaf with context, operation, and path. The parser accepts the full Cleaker grammar for individual namespace tokens."}),`
`,e.jsxs(n.p,{children:["In NRP v0.2.1, bracket selectors inside a full ",e.jsx(n.code,{children:"me://"})," URI are monad selectors, not UI surfaces:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`me://cleaker.me[monadlisa]/profile
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"monadlisa"})," is a monad execution route. A device like ",e.jsx(n.code,{children:"iphone"})," belongs in the monad placement index unless it is deliberately registered as a monad name."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"canonical-form",children:"Canonical Form"}),`
`,e.jsxs(n.p,{children:["The parser produces a ",e.jsx(n.code,{children:"canonical"})," string that is ",e.jsx(n.strong,{children:"semantically stable"})," across parse/serialize round-trips."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`Input:     a ∩ (b + c)
Canonical: a ∩ (b + c)   ✓

Input:     ~(a + b)
Canonical: ~(a + b)      ✓

Without parenthesization:
  a ∩ b + c  →  parses as  (a ∩ b) + c  ≠  a ∩ (b + c)
`})}),`
`,e.jsxs(n.p,{children:["The client sends ",e.jsx(n.code,{children:"{ raw, canonical, ast }"})," over the wire. The ",e.jsxs(n.strong,{children:["server re-parses ",e.jsx(n.code,{children:"canonical"})," independently"]})," — it does not trust the client AST. ",e.jsx(n.code,{children:"canonical"})," is the agreed contract."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"validity",children:"Validity"}),`
`,e.jsx(n.p,{children:"Every parsed expression carries two flags:"}),`
`,e.jsxs(n.p,{children:[`| Flag | Meaning |
|---|---|
| `,e.jsx(n.code,{children:"syntaxValid"}),` | Algebra structure is correct — safe to send |
| `,e.jsx(n.code,{children:"namespaceValid"})," | All leaves passed Cleaker validation |"]}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"valid = syntaxValid"}),". An expression can be ",e.jsx(n.code,{children:"valid: true"})," but ",e.jsx(n.code,{children:"namespaceValid: false"})," — the server resolves against the real ",e.jsx(n.code,{children:".me"})," kernel and has final authority."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"state-machine",children:"State Machine"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`idle
  ↓ open(expression)
parsing       local NRP algebra parse
  ↓
connecting    WebSocket transport handshake
  ↓
resolving     NRP semantic handshake (server re-parses canonical)
  ↓
connected     channelId, endpoints, audience, capabilities, disclosure
  ↓
streaming     server pushing live updates
  ↓
disconnected  channel closed cleanly
  ↘
error         parse error, connection refused, or resolution failed
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"wire-contract",children:"Wire Contract"}),`
`,e.jsxs(n.h3,{id:"client--server-nrpopen",children:["Client → Server: ",e.jsx(n.code,{children:"nrp.open"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`{
  type: 'nrp.open',
  expression: string,     // raw input
  canonical: string,      // normalized, precedence-correct
  ast: NRPNode,           // hint — server must re-verify
  client: {
    surface?: string,     // current browser/projection surface, not the NRP [monad] selector
    userAgent?: string,
    gui: 'Beatle'
  },
  timestamp: number
}
`})}),`
`,e.jsxs(n.h3,{id:"server--client-resolved",children:["Server → Client: ",e.jsx(n.code,{children:"resolved"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`{
  type: 'resolved',
  channelId: string,
  payload: {
    endpoints: string[],
    audience?: string[],
    capabilities?: string[],
    surface?: string,     // resolved overlay/projection surface, if any
    disclosure: 'public' | 'opened' | 'closed' | 'contested'
  },
  timestamp: number
}
`})}),`
`,e.jsxs(n.h3,{id:"bidirectional-data",children:["Bidirectional: ",e.jsx(n.code,{children:"data"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`{ type: 'data', channelId?, payload: unknown, timestamp: number }
`})}),`
`,e.jsxs(n.h3,{id:"server--client-stream",children:["Server → Client: ",e.jsx(n.code,{children:"stream"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`{ type: 'stream', channelId?, payload?: unknown, timestamp: number }
`})}),`
`,e.jsxs(n.h3,{id:"server--client-error",children:["Server → Client: ",e.jsx(n.code,{children:"error"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`{ type: 'error', channelId?, payload: string, timestamp: number }
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"disclosure-levels",children:"Disclosure Levels"}),`
`,e.jsxs(n.p,{children:["The server returns a ",e.jsx(n.code,{children:"disclosure"})," level based on what the ",e.jsx(n.code,{children:".me"})," kernel reveals:"]}),`
`,e.jsxs(n.p,{children:[`| Level | Meaning |
|---|---|
| `,e.jsx(n.code,{children:"public"}),` | Namespace is readable, endpoints available |
| `,e.jsx(n.code,{children:"opened"}),` | Secret scope, caller presented valid key material |
| `,e.jsx(n.code,{children:"closed"}),` | Namespace exists (or would not confirm existence — A0/A2 stealth axioms), caller has no access |
| `,e.jsx(n.code,{children:"contested"})," | Multiple conflicting monads claim this namespace |"]}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"closed"})," is structural whenever it covers a stealth root — the ",e.jsx(n.code,{children:".me"}),' kernel never confirms existence of a secret scope root, and the wire never distinguishes "no access" from "would not say if it exists." Do not show existence hints to the user when ',e.jsx(n.code,{children:"disclosure === 'closed'"}),"."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"authority-model",children:"Authority Model"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-txt",children:`Client (Beatle)       → parses intent, sends hint
NRP server            → re-parses canonical, resolves route
.me kernel (server)   → resolves meaning: secrets, audience, capabilities
`})}),`
`,e.jsx(n.p,{children:"The client never has semantic authority. It formats and presents. The kernel decides."}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"usebeatle-api",children:"useBeatle API"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const { channel, open, send, disconnect } = useBeatle(nrpEndpoint?, onMessage?);

open('jabellae + alex @ wikipedia.com');  // parse → connect → resolve
send({ type: 'annotation', text: '...' }); // only when connected or streaming
disconnect();                              // close cleanly
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"channel"})," is a ",e.jsx(n.code,{children:"NamespaceChannel"}),":"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`{
  expression,    // NRPExpression (raw, canonical, ast, syntaxValid, namespaceValid)
  resolved,      // string[] — endpoint URLs
  state,         // ResolutionState
  channelId,     // string
  audience,      // string[]
  capabilities,  // string[]
  surface,       // string (from @ operator)
  disclosure,    // NRPDisclosure
  error          // string
}
`})})]})}function o(s={}){const{wrapper:n}={...a(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(r,{...s})}):r(s)}export{o as default};
