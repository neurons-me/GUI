import React from 'react';
import { Stack } from '@/gui/Molecules';
import type { ModuleCollectionProps } from '../../All.This.types';

export default function ModulesList({
  children,
  gap = 2,
  sx = {},
}: ModuleCollectionProps) {
  return (
    <Stack spacing={gap} sx={sx}>
      {children}
    </Stack>
  );
}
