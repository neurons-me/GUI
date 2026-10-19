import * as React from 'react';
import Modal from '@/gui/Molecules/Modal/Modal';
import Box from '@/gui/Atoms/Box/Box';
import Button from '@/gui/Atoms/Button/Button';
import Paper from '@/gui/Atoms/Paper/Paper';
import Typography from '@/gui/Atoms/Typography/Typography';
import Stack from '@/gui/Molecules/Stack/Stack';
import type { AccessScope } from '../types';

export type AccessConfirmationModalProps = {
  open: boolean;
  appName: string;
  reason?: string;
  requestedScopes: AccessScope[];
  namespace?: string;
  onApprove: () => void;
  onDeny: () => void;
};

/**
 * @deprecated (2026-10-01) Only ever mounted via `<AccessRequestHandler/>`,
 * which the real `Cleaker` entry point no longer mounts (its only caller,
 * `requestAccess()`, has zero callers of its own anywhere in this
 * monorepo). Kept exported, not removed, because it's part of this
 * package's published root (`index.ts`). Do not wire this into new code.
 */
export default function AccessConfirmationModal(props: AccessConfirmationModalProps) {
  const {
    open,
    appName,
    reason,
    requestedScopes,
    namespace,
    onApprove,
    onDeny,
  } = props;

  return (
    <Modal
      open={open}
      onClose={onDeny}
      title="Access Request"
      width={460}
    >
      <Stack spacing={1.5}>
        <Typography variant="body1" sx={{ lineHeight: 1.55 }}>
          <Box component="span" sx={{ fontWeight: 800 }}>
            {appName || 'Unknown app'}
          </Box>{' '}
          wants temporary access to your `.me` session.
        </Typography>

        {reason ? (
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.72 }}>
              Reason
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              {reason}
            </Typography>
          </Paper>
        ) : null}

        {namespace ? (
          <Typography variant="caption" sx={{ opacity: 0.72 }}>
            Active namespace: <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{namespace}</Box>
          </Typography>
        ) : null}

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.9, fontWeight: 800 }}>
            Requested scopes
          </Typography>
          <Stack spacing={0.8}>
            {requestedScopes.map((scope) => (
              <Paper
                key={scope}
                variant="outlined"
                sx={{
                  px: 1.25,
                  py: 0.95,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {scope}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.5 }}>
          Cleaker will only grant the scopes you approve for this session. The app never reads the raw kernel directly.
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="text" onClick={onDeny}>
            Deny
          </Button>
          <Button variant="contained" onClick={onApprove}>
            Continue
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
