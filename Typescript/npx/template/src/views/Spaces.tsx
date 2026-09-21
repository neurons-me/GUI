import { useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, IconButton } from 'this.gui/atoms';
import { Icon } from 'this.gui';
import { useMeAction, useMeValue, useSessionSurface } from 'this.gui/react';

const SPACES_PATH = 'apps.__APP_ID__.spaces';

type SpaceEntry = { name: string; path: string; createdAt: number };
type Member = Record<string, unknown>;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The generic space browser — this is the actual thesis of the template,
 * and the app's authoring surface ("Admin" in the nav). Instead of one
 * hand-written React view per "table" (Tractos.tsx, Remolques.tsx, ...),
 * any plural anyone declares under apps.__APP_ID__.* shows up and opens
 * here, with no code change. `.me`'s own algebra (see
 * Algebra-of-Contexts.md / Plurality-Is-Grammar.md) doesn't require a
 * table/schema to exist before you write to it — this view just reflects
 * that: creating a space is nothing more than writing an entry into the
 * registry below and initializing an empty array at its path.
 *
 * The whole view — not just the write actions — is gated on `authenticated`:
 * this is the Finder-style authoring tool, not something a published site's
 * visitors should see at all. That gate is app-level UI, not kernel
 * enforcement (the monad doesn't check identity on writes today), so:
 *
 *   v1 admin = authenticated.
 *   future admin = capability-gated (see the algebra's `C` axis — a
 *   separate, not-yet-built policy layer that would validate WHAT a given
 *   session can write, not just whether one exists).
 *
 * A real published app (a polls site, a news site) would never route its
 * visitors into this view at all — they'd get purpose-built views (vote,
 * like, comment) that only ever touch specific, pre-declared paths. This
 * explorer is for whoever is building the namespace, not consuming it.
 */
export default function Spaces() {
  const { authenticated, pending, error, enter } = useSessionSurface();
  const spaces = useMeValue<SpaceEntry[]>(SPACES_PATH) ?? [];
  const setSpaces = useMeAction(SPACES_PATH);
  const [selected, setSelected] = useState<SpaceEntry | null>(null);
  const [newSpaceName, setNewSpaceName] = useState('');

  if (!authenticated) {
    return (
      <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Admin
        </Typography>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This is the authoring surface — creating or editing spaces requires a session.
            </Typography>
            {error && (
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {error.message}
              </Typography>
            )}
            <Button variant="contained" onClick={enter} disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in with .me'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const createSpace = () => {
    const name = newSpaceName.trim();
    if (!name) return;
    const path = `apps.__APP_ID__.${slugify(name)}`;
    if (spaces.some((s: SpaceEntry) => s.path === path)) return;
    setSpaces([...spaces, { name, path, createdAt: Date.now() }]);
    setNewSpaceName('');
  };

  if (selected) {
    return <SpaceDetail space={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 640 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Spaces
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Each space is just a path under <code>apps.__APP_ID__</code> with members
        (<code>[]</code>). Creating one needs no new code.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {spaces.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            There are no spaces yet.
          </Typography>
        )}
        {spaces.map((space: SpaceEntry) => (
          <Card key={space.path} sx={{ cursor: 'pointer' }} onClick={() => setSelected(space)}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {space.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {space.path}
                </Typography>
              </Box>
              <Icon name="chevron_right" />
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          placeholder="Space name (e.g. tractors)"
          value={newSpaceName}
          onChange={(e: any) => setNewSpaceName(e.target.value)}
        />
        <Button variant="contained" onClick={createSpace}>
          + New space
        </Button>
      </Box>
    </Box>
  );
}

function inferColumns(members: Member[]): string[] {
  const keys = new Set<string>();
  for (const member of members) {
    for (const key of Object.keys(member)) keys.add(key);
  }
  return Array.from(keys);
}

function SpaceDetail({ space, onBack }: { space: SpaceEntry; onBack: () => void }) {
  const members = useMeValue<Member[]>(space.path) ?? [];
  const setMembers = useMeAction(space.path);
  const columns = useMemo(() => inferColumns(members), [members]);
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);

  const addFieldRow = () => setFields([...fields, { key: '', value: '' }]);
  const updateField = (index: number, patch: Partial<{ key: string; value: string }>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const saveMember = () => {
    const member: Member = {};
    for (const { key, value } of fields) {
      if (key.trim()) member[key.trim()] = value;
    }
    if (Object.keys(member).length === 0) return;
    setMembers([...members, member]);
    setFields([{ key: '', value: '' }]);
  };

  return (
    <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 720 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={onBack}>
          <Icon name="arrow_back" />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {space.name}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {space.path} · {members.length} member{members.length === 1 ? '' : 's'}
      </Typography>

      {columns.length > 0 && (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member: Member, i: number) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} style={{ padding: '6px 10px' }}>
                      {member[col] !== undefined ? String(member[col]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            + New member
          </Typography>
          {fields.map((field, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                placeholder="field"
                value={field.key}
                onChange={(e: any) => updateField(i, { key: e.target.value })}
              />
              <TextField
                placeholder="value"
                value={field.value}
                onChange={(e: any) => updateField(i, { value: e.target.value })}
              />
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={addFieldRow}>
              + Field
            </Button>
            <Button variant="contained" onClick={saveMember}>
              Save member
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
