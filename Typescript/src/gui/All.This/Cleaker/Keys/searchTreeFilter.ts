// Filter the Keys tree by a query: a matching leaf stays with its ancestor
// branches; a matching branch keeps all of its children. The search only
// reads labels and paths — never values.
import { GROUP_INFO, type KeyLeaf } from './keyTree';
import { SERVICE_DEFINITIONS } from './serviceKeyVault';
import { PERSONAL_ENTRIES } from '../IdentityIconRow';

export type TreeSearchHit = {
  id: string;
  path: string;
  label: string;
  kind: 'branch' | 'leaf' | 'entry';
  to?: string;
};

export type TreeSearchResult = {
  leaves: KeyLeaf[];
  hits: TreeSearchHit[];
};

function serviceName(path: string): string | undefined {
  return SERVICE_DEFINITIONS.find((d) => d.path === path)?.name;
}

function textsFor(path: string): string[] {
  const segs = path.split('.').filter(Boolean);
  const leaf = segs[segs.length - 1] || path;
  const group = GROUP_INFO[path]?.name;
  const service = serviceName(path);
  return [path, leaf, group, service].filter((item): item is string => !!item);
}

function matches(parts: string[], query: string): boolean {
  return parts.some((part) => part.toLowerCase().includes(query));
}

/** Visible leaves and ranked hits for a case-insensitive substring on path/label. */
export function filterKeyLeaves(leaves: readonly KeyLeaf[], query: string): TreeSearchResult {
  const q = query.trim().toLowerCase();
  if (!q) return { leaves: [...leaves], hits: [] };

  const branchMatch = new Set<string>();
  const leafMatch = new Set<string>();
  const hitMap = new Map<string, TreeSearchHit>();

  const consider = (path: string, kind: 'branch' | 'leaf') => {
    if (!matches(textsFor(path), q) || hitMap.has(path)) return;
    const label = GROUP_INFO[path]?.name || serviceName(path) || path.split('.').pop() || path;
    if (kind === 'leaf') leafMatch.add(path);
    else branchMatch.add(path);
    hitMap.set(path, { id: path, path, label, kind });
  };

  for (const leaf of leaves) {
    const segs = leaf.path.split('.').filter(Boolean);
    for (let i = 1; i < segs.length; i += 1) consider(segs.slice(0, i).join('.'), 'branch');
    consider(leaf.path, 'leaf');
  }

  const visible = leaves.filter((leaf) =>
    leafMatch.has(leaf.path) || [...branchMatch].some((branch) => leaf.path === branch || leaf.path.startsWith(`${branch}.`)),
  );

  const hits = [...hitMap.values()].sort((a, b) => {
    const aExact = a.label.toLowerCase() === q || a.path.toLowerCase() === q ? 0 : a.label.toLowerCase().startsWith(q) ? 1 : 2;
    const bExact = b.label.toLowerCase() === q || b.path.toLowerCase() === q ? 0 : b.label.toLowerCase().startsWith(q) ? 1 : 2;
    if (aExact !== bExact) return aExact - bExact;
    if (a.kind !== b.kind) return a.kind === 'branch' ? -1 : 1;
    return a.path.length - b.path.length;
  });

  return { leaves: visible, hits };
}

/** Personal root entries (wallet, profile, …) that match the same query. */
export function filterPersonalEntries(query: string): TreeSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PERSONAL_ENTRIES.filter((entry) => matches([entry.id, entry.label, entry.to], q)).map((entry) => ({
    id: entry.id,
    path: entry.id,
    label: entry.label,
    kind: 'entry' as const,
    to: entry.to,
  }));
}
