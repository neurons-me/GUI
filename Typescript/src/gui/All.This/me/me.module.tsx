import React from 'react';
import { TextField, Typography } from '@/gui/Atoms';
import { MenuItem, Stack } from '@/gui/Molecules';
import ModuleRow from '../src/ModuleRow/ModuleRow';
import type { RuntimeModuleProps, RuntimeModuleState } from '../All.This.types';

export type MeModuleProps = RuntimeModuleProps & {
  title?: React.ReactNode;
};

function getStateLabel(state: RuntimeModuleState): string {
  if (state === 'on') return 'Loaded';
  if (state === 'off') return 'Not found';
  return 'Pending';
}

function getStateColor(state: RuntimeModuleState): string {
  if (state === 'on') return 'success.main';
  if (state === 'off') return 'error.main';
  return 'warning.main';
}

export default function MeModule({
  'data-gui-node-id': rootNodeId,
  'data-gui-component': rootNodeType = 'MeModule',
  title = '.me',
  source,
  state,
  assetUrl,
  version,
  onSourceChange,
}: MeModuleProps) {
  return (
    <ModuleRow
      data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      title={title}
      subtitle="Runtime"
      meta={assetUrl || 'No asset selected'}
      actions={
        <TextField
          select
          size="small"
          label="Source"
          value={source}
          onChange={(event) => {
            if (!onSourceChange) return;
            const nextSource = event.target.value === 'cdn' ? 'cdn' : 'local';
            onSourceChange(nextSource);
          }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="local">Local</MenuItem>
          <MenuItem value="cdn">CDN</MenuItem>
        </TextField>
      }
    >
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          State
        </Typography>
        <Typography variant="body2" color={getStateColor(state)}>
          {getStateLabel(state)}
        </Typography>
        {version ? (
          <Typography variant="body2" color="text.secondary">
            v{version}
          </Typography>
        ) : null}
      </Stack>
    </ModuleRow>
  );
}
