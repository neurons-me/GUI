import React from 'react';
import { Box } from '@/gui/Atoms';
import type { ModuleCollectionProps } from '../../All.This.types';

export default function ModulesGrid({
  children,
  gap = 2,
  sx = {},
}: ModuleCollectionProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap,
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(auto-fit, minmax(280px, 1fr))',
        },
        alignItems: 'start',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
