import React, { useMemo, useState } from 'react';
import { useGuiTheme } from '@/gui-internals/Hooks';
import Box from '@/gui/Atoms/Box/Box';
import Button from '@/gui/Atoms/Button/Button';
import HostModal from './Host_Modal';
import type { HostProps, HostStatus } from './Host';

const statusLabel = (status: HostStatus): string => {
  switch (status) {
    case 'online':
      return 'Local daemon reachable';
    case 'offline':
      return 'No local daemon detected';
    case 'checking':
      return 'Checking local host';
    default:
      return 'Local host state unknown';
  }
};

export default function HostCompact({
  label = 'localhost:8161',
  status = 'unknown',
  title,
}: HostProps) {
  const theme = useGuiTheme();
  const [open, setOpen] = useState(false);

  const resolvedTitle = title || label;
  const description = useMemo(() => statusLabel(status), [status]);

  return (
    <>
      <Button
        variant="text"
        onClick={() => setOpen(true)}
        title={resolvedTitle}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          maxWidth: '100%',
          minWidth: 0,
          width: 'fit-content',
          borderRadius: '999px',
          border: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${theme.palette.common.black}66 0%, ${theme.palette.section.default}cc 100%)`
              : `linear-gradient(180deg, ${theme.palette.background.paper}cc 0%, ${theme.palette.section.subtle}e6 100%)`,
          boxShadow: `inset 0 1px 0 ${theme.palette.common.white}08`,
          overflow: 'hidden',
          backdropFilter: 'blur(10px) saturate(110%)',
          opacity: 0.82,
          px: 0.7,
          py: 0.42,
          textAlign: 'right',
          textTransform: 'none',
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            fontSize: '8px',
            fontWeight: 500,
            color: theme.palette.text.secondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1,
            letterSpacing: 0.18,
            textTransform: 'lowercase',
            fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
            opacity: 0.82,
          }}
        >
          {label}
        </Box>
      </Button>

      <HostModal
        open={open}
        onClose={() => setOpen(false)}
        label={label}
        description={description}
      />
    </>
  );
}