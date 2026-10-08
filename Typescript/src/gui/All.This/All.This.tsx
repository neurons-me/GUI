import React from 'react';
import { Typography } from '@/gui/Atoms';
import { Page, Stack } from '@/gui/Molecules';
import type { AllThisProps } from './All.This.types';
import ModulesGrid from './src/ModulesGrid/ModulesGrid';
import ModulesList from './src/ModulesList/ModulesList';

export default function AllThis({
  title = 'All.This',
  subtitle,
  children,
  modules = [],
  layout = 'grid',
  gap = 2,
  sx = {},
}: AllThisProps) {
  const content = children || modules;

  return (
    <Page padding={3} sx={sx}>
      <Stack spacing={2}>
        {title ? <Typography variant="h4">{title}</Typography> : null}
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
        {layout === 'list' ? (
          <ModulesList gap={gap}>{content}</ModulesList>
        ) : (
          <ModulesGrid gap={gap}>{content}</ModulesGrid>
        )}
      </Stack>
    </Page>
  );
}
