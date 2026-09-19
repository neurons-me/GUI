import React from 'react';
import type { SxProps, Theme } from '@mui/system';
import { Box } from '@/gui/Atoms';
import { useInsets } from '@/gui-internals/Hooks';

export type ContentProps = {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  /**
   * If true, Content will not apply left/right padding from GUI insets.
   * Useful for full-bleed pages where the LeftSidebar already provides spacing.
   */
  disableInsetPadding?: boolean;
};

const Content: React.FC<ContentProps> = ({ children, sx, disableInsetPadding = false }) => {
  const insets = useInsets();
  const safeTop = Math.max(0, Number(insets?.top ?? 0));
  const navHeight = Math.max(0, Number(insets?.nav ?? 0));
  const topInset = safeTop + navHeight;
  const bottomInset = Math.max(0, Number(insets?.bottom ?? 0));
  const leftInset = disableInsetPadding ? 0 : Math.max(0, Number(insets?.left ?? 0));
  const rightInset = disableInsetPadding ? 0 : Math.max(0, Number(insets?.right ?? 0));
  const contentGutter = 1.618;
  return (
    <Box
      id="content"
      component="main"
      data-gui-node-id="GUI.content"
      data-gui-component="content"
      sx={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
        paddingTop: `${topInset + contentGutter}px`,
        paddingBottom: `${bottomInset + contentGutter}px`,
        paddingLeft: `${leftInset + contentGutter}px`,
        paddingRight: `${rightInset + contentGutter}px`,
        boxSizing: 'border-box',
        backgroundColor: 'background.default',
        transition: 'padding 0.3s ease',
        ...sx,
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Content;
