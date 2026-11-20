// NewKeyCard.tsx — what the keys row's "+" opens: ONE card that creates a
// new key. On top, the presets (keyPresets.ts): one square node per ready-made
// key (its brand mark, the name in the one-line node tooltip) and "+" (new: your own fields) last.
// Custom (the default) is your own group (name, icon/glyph, your own field rows,
// passphrase). A service preset turns the card into that service's form (field
// names from SERVICE_DEFINITIONS, values empty, secrets as dots) and saves into
// the service's own vault slot, exactly like ServiceKeyCard always did. Meta is
// not a form: its preset starts "Connect with Facebook". Inline in the branch,
// straight corners, no modal. The "+" never lists more items; only "…" does.
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import Typography from '@/gui/Atoms/Typography/Typography';
import CustomKeyCard from './CustomKeyCard';
import NodeTip from '../NodeTip';
import ServiceIcon from './ServiceIcons';
import { CardCornerActions, ServiceKeyCard, keyCardShellSx, type KeyCardTone } from './ServiceKeysSection';
import { SERVICE_DEFINITIONS, type ServiceId } from './serviceKeyVault';
import { META_CONNECT_PRESET } from './keyPresets';
import { NODE_ICON, NODE_SIZE } from '../treeMetrics';

export type NewKeySaved = { kind: 'service'; id: ServiceId } | { kind: 'custom'; name: string };

export interface NewKeyCardProps {
  namespace: string;
  /** Built-in services offered under "Start from" (the ones not saved yet). */
  templates: readonly ServiceId[];
  servicePath?: (id: ServiceId, field: string) => string;
  serviceNodeId?: (id: ServiceId, field: string) => string;
  customPath?: (name: string, field: string) => string;
  customNodeId?: (name: string, field: string) => string;
  onSaved: (saved: NewKeySaved) => void;
  /** ✕ in the card corner (no trash: nothing saved yet). */
  onClose?: () => void;
  /** The tree level "+" was pressed on (e.g. "meta"): a custom key is created under it. '' = keys. */
  level?: string;
  /** Human label for a template at this level (default: its tooltip/name). */
  templateLabel?: (id: ServiceId) => string;
  /** Passed through to the service / custom form (tree branch vs standalone card). */
  tone?: KeyCardTone;
  /** Offer Meta's preset: it starts "Connect with Facebook" (no form). Omit when Meta is connected or unavailable. */
  connect?: { onConnect: () => void; message?: string };
  /** Presets shown but not usable yet (e.g. Threads' own connect, Phase 3): dimmed, the tip says why. */
  soon?: readonly { id: string; service: ServiceId; label: string }[];
}

const defOf = (id: ServiceId) => SERVICE_DEFINITIONS.find((d) => d.id === id)!;

type Pick = ServiceId | '' | 'meta.connect';

/** Gap between preset tiles, in theme spacing units. */
const TILE_GAP = 1;

export default function NewKeyCard({ namespace, templates, servicePath, serviceNodeId, customPath, customNodeId, onSaved, onClose, level = '', templateLabel, tone = 'card', connect, soon = [] }: NewKeyCardProps) {
  const [pick, setPick] = React.useState<Pick>('');
  const valid: Pick = pick === 'meta.connect' ? (connect ? pick : '') : pick && templates.includes(pick) ? pick : '';
  const branch = tone === 'branch';
  const labelOf = (id: ServiceId) => (templateLabel ? templateLabel(id) : (defOf(id).tooltip ?? defOf(id).name));

  const tiles: { key: Pick; tip: string; icon: React.ReactNode; off?: boolean; id?: string }[] = [
    ...(connect ? [{ key: 'meta.connect' as Pick, tip: META_CONNECT_PRESET.label, icon: <ServiceIcon service="meta" /> }] : []),
    ...templates.map((id) => ({ key: id as Pick, tip: defOf(id).name, icon: <ServiceIcon service={id} brand /> })),
    ...soon.map((p) => ({ key: '' as Pick, id: p.id, off: true, tip: p.label, icon: <ServiceIcon service={p.service} /> })),
    { key: '' as Pick, tip: 'New · your own fields', icon: <Icon name="add" fontSize={NODE_ICON} /> },
  ];
  // Only a chosen service needs a caption (its name + where it lands); "+" (new) speaks via its tooltip.
  const chosenLabel = valid === 'meta.connect' ? META_CONNECT_PRESET.label : valid ? labelOf(valid) : '';

  // Layout is plain CSS: tiles the tree node's own size (treeMetrics, rem: they grow
  // with the user's font size, never shrink) in a wrapping flex row with a theme
  // spacing gap. They stay on one line whenever the card is wide enough and wrap
  // only when they truly don't fit; nothing is measured, so they can never stack
  // one per line.

  const header = (
    <Box data-new-key-template sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pb: branch ? 0.6 : 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box role="radiogroup" aria-label="Start from" data-new-key-presets sx={{ display: 'flex', flexWrap: 'wrap', gap: TILE_GAP }}>
        {tiles.map((t) => {
          const on = !t.off && valid === t.key;
          const id = t.id ?? (t.key || 'custom');
          return (
            <NodeTip key={id} name={t.tip}>
              <Box
                component="button" type="button" role="radio" aria-checked={on} aria-label={t.tip}
                aria-disabled={t.off || undefined} data-preset={id} data-soon={t.off || undefined}
                onClick={() => { if (t.off) return; setPick(t.key); if (t.key === 'meta.connect') connect?.onConnect(); }}
                sx={{
                  width: NODE_SIZE, height: NODE_SIZE, flex: '0 0 auto', boxSizing: 'border-box', p: 0, display: 'grid', placeItems: 'center',
                  cursor: t.off ? 'default' : 'pointer', opacity: t.off ? 0.45 : 1, borderStyle: t.off ? 'dashed !important' : undefined,
                  border: '1px solid', borderColor: on ? 'primary.main' : 'divider', borderRadius: 0,
                  bgcolor: 'background.default', color: on ? 'primary.main' : 'text.primary',
                  '&:hover': t.off ? undefined : { bgcolor: 'action.hover' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                }}
              >
                {t.icon}
              </Box>
            </NodeTip>
          );
        })}
      </Box>
      {chosenLabel && <Typography variant="caption" data-new-key-label sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{chosenLabel}</Typography>}
    </Box>
  );

  return (
    <Box data-gui-component="NewKeyCard" data-new-key={valid || 'custom'}>
      {valid === 'meta.connect' ? (
        <Box data-new-key-connect sx={keyCardShellSx(tone)}>
          {header}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: branch ? 0.75 : 1 }}>
            <Box sx={{ display: 'flex' }}><ServiceIcon service="meta" /></Box>
            <Typography variant={branch ? 'caption' : 'body2'} sx={{ fontWeight: 700, flex: 1 }}>Meta</Typography>
            <CardCornerActions compact={branch} onClose={onClose} />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {connect?.message ?? 'Facebook opens to connect. Your Pages and Instagram appear under .meta.'}
          </Typography>
        </Box>
      ) : valid ? (
        <ServiceKeyCard
          key={valid} namespace={namespace} def={defOf(valid)} header={header} onClose={onClose} tone={tone} hideLegacy
          fieldPath={servicePath && ((f) => servicePath(valid, f))} fieldNodeId={serviceNodeId && ((f) => serviceNodeId(valid, f))}
          onSaved={() => onSaved({ kind: 'service', id: valid })}
        />
      ) : (
        <CustomKeyCard
          namespace={namespace} group={null} header={header} onClose={onClose} namePrefix={level ? `${level}.` : ''} tone={tone}
          fieldPath={customPath} fieldNodeId={customNodeId}
          onSaved={(name) => onSaved({ kind: 'custom', name })}
        />
      )}
    </Box>
  );
}
