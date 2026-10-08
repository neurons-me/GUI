import React from 'react';
import { Box, Button, TextField, Typography } from '@/gui/Atoms';
import { MenuItem, Stack } from '@/gui/Molecules';
import CodeBlock from '@/gui/Molecules/CodeBlock/CodeBlock';
import ModuleCard from '../src/ModuleCard/ModuleCard';
import type { ModuleSource, RuntimeModuleProps, RuntimeModuleState } from '../All.This.types';

export type DOMModuleProps = RuntimeModuleProps & {
  title?: React.ReactNode;
  fetchUrl?: string;
  htmlValue?: string;
  jsonValue?: string;
  statusMessage?: React.ReactNode;
  onFetchUrlChange?: (nextValue: string) => void;
  onHtmlChange?: (nextValue: string) => void;
  onFetchAndParse?: () => void;
  onLoadSample?: () => void;
  onParseHtml?: () => void;
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

export default function DOMModule({
  'data-gui-node-id': rootNodeId,
  'data-gui-component': rootNodeType = 'DOMModule',
  title = 'DOM',
  source,
  state,
  assetUrl,
  version,
  onSourceChange,
  fetchUrl = '',
  htmlValue = '',
  jsonValue = '',
  statusMessage = 'Ready.',
  onFetchUrlChange,
  onHtmlChange,
  onFetchAndParse,
  onLoadSample,
  onParseHtml,
}: DOMModuleProps) {
  return (
    <ModuleCard
      data-gui-node-id={rootNodeId}
      data-gui-component={rootNodeType}
      title={title}
      subtitle="Runtime"
      meta={assetUrl || 'No asset selected'}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            select
            size="small"
            label="Source"
            value={source}
            onChange={(event) => {
              if (!onSourceChange) return;
              const nextSource: ModuleSource = event.target.value === 'cdn' ? 'cdn' : 'local';
              onSourceChange(nextSource);
            }}
            sx={{ minWidth: { xs: '100%', md: 120 } }}
          >
            <MenuItem value="local">Local</MenuItem>
            <MenuItem value="cdn">CDN</MenuItem>
          </TextField>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              State
            </Typography>
            <Typography variant="body2" color={getStateColor(state)}>
              {getStateLabel(state)}
              {version ? ` · v${version}` : ''}
            </Typography>
          </Box>
        </Stack>

        <TextField
          label="URL"
          size="small"
          fullWidth
          value={fetchUrl}
          onChange={(event) => {
            if (!onFetchUrlChange) return;
            onFetchUrlChange(event.target.value);
          }}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button size="small" onClick={onFetchAndParse}>
            Fetch & Parse URL
          </Button>
          <Button size="small" variant="outlined" onClick={onLoadSample}>
            Load Sample
          </Button>
          <Button size="small" variant="outlined" onClick={onParseHtml}>
            Parse HTML
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          }}
        >
          <TextField
            label="HTML"
            multiline
            minRows={14}
            fullWidth
            value={htmlValue}
            onChange={(event) => {
              if (!onHtmlChange) return;
              onHtmlChange(event.target.value);
            }}
          />
          <CodeBlock
            title="JSON"
            code={jsonValue || '{}'}
            language="json"
            maxHeight={320}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {statusMessage}
        </Typography>
      </Stack>
    </ModuleCard>
  );
}
