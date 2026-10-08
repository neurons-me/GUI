import React from 'react';
import { useGuiTheme } from '@/gui-internals/Hooks';
import Box from '@/gui/Atoms/Box/Box';
import Modal from '@/gui/Molecules/Modal/Modal';

export interface HostModalProps {
  open: boolean;
  onClose: () => void;
  label?: string;
  description?: React.ReactNode;
}

export default function HostModal({
  open,
  onClose,
  label = 'localhost:8161',
  description,
}: HostModalProps) {
  const theme = useGuiTheme();

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 320,
          maxWidth: 420,
        }}
      >
        <Box
          sx={{
            borderRadius: '14px',
            border: `1px solid ${theme.palette.divider}`,
            background:
              theme.palette.mode === 'dark'
                ? theme.palette.section.default
                : theme.palette.section.subtle,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              color: theme.palette.text.secondary,
            }}
          >
            Cleaker
          </Box>

          <Box
            sx={{
              alignSelf: 'flex-end',
              borderRadius: '999px',
              border: `1px solid ${theme.palette.divider}`,
              px: 1.1,
              py: 0.55,
              fontSize: '10px',
              fontFamily: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
              color: theme.palette.text.secondary,
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(180deg, ${theme.palette.common.black}66 0%, ${theme.palette.section.default}cc 100%)`
                  : `linear-gradient(180deg, ${theme.palette.background.paper}cc 0%, ${theme.palette.section.subtle}e6 100%)`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {label}
          </Box>
        </Box>

        <Box
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </Box>
      </Box>
    </Modal>
  );
}