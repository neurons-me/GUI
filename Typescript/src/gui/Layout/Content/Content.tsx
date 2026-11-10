import React from 'react';
import type { SxProps, Theme } from '@mui/system';
import { Box } from '@/gui/Atoms';
import { useInsets } from '@/gui-internals/Hooks';
import { CONTENT_GUTTER_PX, CONTENT_MAX_WIDTH_PX, CONTENT_MIN_WIDTH, CONTENT_HEIGHT } from './contentGutter';

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
  const contentGutter = CONTENT_GUTTER_PX;
  const leftPad = leftInset + contentGutter;
  const rightPad = rightInset + contentGutter;
  return (
    <Box
      id="content"
      component="main"
      data-gui-node-id="GUI.window.layout.content"
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
        paddingLeft: `${leftPad}px`,
        paddingRight: `${rightPad}px`,
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
          maxWidth: CONTENT_MAX_WIDTH_PX,
          minWidth: CONTENT_MIN_WIDTH,
          height: CONTENT_HEIGHT,
          position: 'relative',
          // Keep the column centered on the window. When a fixed sidebar grows,
          // only yield if it would overlap; do not stretch edge-to-edge.
          left: `clamp(0px, calc((100vw - min(100%, ${CONTENT_MAX_WIDTH_PX}px)) / 2 - ${leftPad}px), calc(100% - min(100%, ${CONTENT_MAX_WIDTH_PX}px)))`,
          transition: 'left 0.3s ease',
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
