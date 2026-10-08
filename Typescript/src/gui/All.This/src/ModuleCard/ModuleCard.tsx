import React from 'react';
import { Box, Paper, Typography } from '@/gui/Atoms';
import { Stack } from '@/gui/Molecules';
import type { ModuleFrameProps } from '../../All.This.types';

export default function ModuleCard({
  'data-gui-node-id': rootNodeId,
  'data-gui-component': rootNodeType = 'ModuleCard',
  title,
  subtitle,
  meta,
  actions,
  children,
  sx = {},
}: ModuleFrameProps) {
  return (
    <Paper
      data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          justifyContent="space-between"
        >
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
            {title ? <Typography variant="h6">{title}</Typography> : null}
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
            {meta ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
              >
                {meta}
              </Typography>
            ) : null}
          </Stack>
          {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
        </Stack>
      </Stack>
      {children}
    </Paper>
  );
}
