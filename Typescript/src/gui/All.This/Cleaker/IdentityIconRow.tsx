// IdentityIconRow.tsx — personal entries under the signed-in QR card:
// keys, wallet, profile, contacts. This card is the username's root tree
// in card mode: it does not show sidebar/.GUI icons, and service icons
// (PayPal, Meta, Grok, …) belong on the keys screen, not here.
//
// By default every entry navigates (QRConnect, MeLoginStatus). Opt-in
// `unfold` lets some entries open in place instead (IdentityTree: 'keys'
// unfolds the keys tree below the row).
import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import NodeTip from './NodeTip';
import { useDockRow } from './useDockRow';
import { NODE_ICON, NODE_SIZE, nodePx } from './treeMetrics';

export const PERSONAL_ENTRIES = [
  { id: 'keys', label: 'Keys', to: '/keychain', icon: 'key' },
  { id: 'wallet', label: 'Wallet', to: '/wallet', icon: 'account_balance_wallet' },
  { id: 'profile', label: 'Profile', to: '/profile', icon: 'person' },
  { id: 'contacts', label: 'Contacts', to: '/contacts', icon: 'contacts' },
] as const;

export type PersonalEntryId = (typeof PERSONAL_ENTRIES)[number]['id'];

export interface IdentityIconRowProps {
  nodeId: string;
  onNavigate: (to: string) => void;
  /** Opt-in: entries that unfold in place instead of navigating. */
  unfold?: {
    ids: readonly PersonalEntryId[];
    expandedId: PersonalEntryId | null;
    onToggle: (id: PersonalEntryId) => void;
    /** Anchor for the tree line drawn under an unfolded entry. */
    entryRef?: (id: PersonalEntryId, el: HTMLElement | null) => void;
  };
  /** When set (a live search), only these personal entries stay visible. */
  visibleIds?: readonly PersonalEntryId[] | null;
}

export default function IdentityIconRow({ nodeId, onNavigate: navigate, unfold, visibleIds }: IdentityIconRowProps) {
  // Theme collection hover: Dock magnification (see useDockRow / dockMagnify.ts).
  const dock = useDockRow(nodePx());
  return (
    <Box
      ref={dock.ref}
      data-identity-actions=""
      onPointerMove={dock.onPointerMove}
      onPointerLeave={dock.onPointerLeave}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 1.5,
        alignItems: 'center',
        mt: '13px',
        width: 'max-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'visible',
        transform: 'translateX(var(--qr-header-shift, 0px))',
      }}
    >
      {PERSONAL_ENTRIES.filter((entry) => !visibleIds || visibleIds.includes(entry.id)).map((entry) => {
        const unfolds = !!unfold?.ids.includes(entry.id);
        const expanded = unfolds && unfold?.expandedId === entry.id;
        return (
          // Tooltip on the stable outer box (the Dock scales the inner button), like every tree node.
          <NodeTip key={entry.id} name={entry.label} path={`.${entry.id}`} off={expanded}>
          <Box
            data-dock-item
            ref={unfolds ? (el: HTMLElement | null) => unfold?.entryRef?.(entry.id, el) : undefined}
            sx={{ display: 'flex', position: 'relative' }}
          >
          <Box
            data-dock-avatar
            component="button"
            type="button"
            aria-label={entry.label}
            aria-expanded={unfolds ? expanded : undefined}
            onClick={() => (unfolds ? unfold!.onToggle(entry.id) : navigate(entry.to))}
            data-gui-node-id={`${nodeId}.${entry.id}`}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: NODE_SIZE, height: NODE_SIZE, boxSizing: 'border-box', p: 0, border: '1px solid', borderColor: expanded ? 'primary.main' : 'divider', borderRadius: 1,
              background: 'transparent', color: expanded ? 'primary.main' : 'inherit', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
            }}
          >
            <Icon name={entry.icon} fontSize={NODE_ICON} />
          </Box>
          </Box>
          </NodeTip>
        );
      })}
    </Box>
  );
}
