import React from 'react';
import { Box, Paper, Typography } from '@/gui/Atoms';
import { Stack } from '@/gui/Molecules';
import type { ModuleFrameProps } from '../../All.This.types';

export default function ModuleRow({
  'data-gui-node-id': rootNodeId,
  'data-gui-component': rootNodeType = 'ModuleRow',
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
        ...sx,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', lg: 'center' }}
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
          {actions ? (
            <Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', lg: 'center' } }}>
              {actions}
            </Box>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}
