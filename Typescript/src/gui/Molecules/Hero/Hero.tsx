import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import type { HeroProps } from './Hero.types';

function resolveBlurRadius(theme: any, blur?: 'none'|'light'|'medium'|'heavy'|'all'): string {
  if (!blur || blur === 'none') return '0px';
  const fromTheme = theme?.custom?.blurRadius?.[blur];
  return fromTheme ?? '0px';
}

function resolveOverlayColor(
  theme: any,
  blur?: 'none' | 'light' | 'medium' | 'heavy' | 'all',
  customColor?: string,
  overlayColor?: string
): string {
  const paletteBlur = blur ? theme?.palette?.blur?.[blur] : undefined;
  const resolved =
    customColor
      ? customColor
      : paletteBlur?.$value
      ? paletteBlur.$value
      : typeof paletteBlur === 'string'
      ? paletteBlur
      : overlayColor || 'transparent';
  return resolved;
}


function resolveAccentSurface(
  theme: any,
  accent?: 'aurora' | 'ember' | 'monolith' | 'neutral'
): { soft?: string; strong?: string } {
  if (!accent) return {};
  const entry = theme?.visuals?.accents?.[accent];
  if (!entry || typeof entry !== 'object') return {};
  return {
    soft: typeof entry.soft === 'string' ? entry.soft : undefined,
    strong: typeof entry.strong === 'string' ? entry.strong : undefined,
  };
}
function resolveMediaFilter(blurRadius: string, blur?: 'none'|'light'|'medium'|'heavy'|'all'): string | undefined {
  if (!blur || blur === 'none') return 'none';
  return blur === 'all' ? 'saturate(1.05) brightness(0.96)' : 'none';
}

export const Hero: React.FC<HeroProps & Record<string, any>> = ({
  backgroundSrc,
  backgroundType = 'image',
  backgroundColor,
  overlayColor,
  children,
  height = '100vh',
  padding = 4,
  blur,
  customColor,
  accent,
  brand,
  header,
  subheader,
  typography,
  options,
  mode = 'center',
  contentMaxWidth = 640,
  contentPaddingY,
  contentPaddingTop,
  contentPaddingBottom,
  headerVariant = 'h2',
  subheaderVariant = 'subtitle1',
  typographyVariant = 'body1',
  optionsDirection = 'row',
  optionsGap = 1.5,
  optionsJustify = 'flex-start',
  __renderStructuredChildren,
  layout = 'flow',
  ...rest
}) => {
  const theme = useTheme();
  const { sx: sxProp, ...boxProps } = rest ?? {};
  //console.log('theme.palette.blur:', theme.palette.blur);
  //console.log('theme.custom.blurRadius:', theme.custom.blurRadius);
  //console.log(theme.palette.blur);
  const blurRadius = resolveBlurRadius(theme, blur);
  const accentSurface = resolveAccentSurface(theme, accent);
  const overlayBg  = resolveOverlayColor(
    theme,
    blur,
    customColor,
    overlayColor ?? accentSurface.soft
  );
  const resolvedBackgroundColor =
    backgroundColor
    ?? (backgroundType === 'color' ? accentSurface.strong : undefined)
    ?? (backgroundType === 'color' ? accentSurface.soft : undefined);
  const mediaFilter = resolveMediaFilter(blurRadius, blur);
  const modeConfig = (() => {
    switch (mode) {
      case 'left':
        return { justifyContent: 'flex-start', alignItems: 'center', textAlign: 'left' };
      case 'right':
        return { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'right' };
      case 'top-left':
        return { justifyContent: 'flex-start', alignItems: 'flex-start', textAlign: 'left' };
      case 'top-center':
        return { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'center' };
      case 'top-right':
        return { justifyContent: 'flex-end', alignItems: 'flex-start', textAlign: 'right' };
      case 'bottom-left':
        return { justifyContent: 'flex-start', alignItems: 'flex-end', textAlign: 'left' };
      case 'bottom-center':
        return { justifyContent: 'center', alignItems: 'flex-end', textAlign: 'center' };
      case 'bottom-right':
        return { justifyContent: 'flex-end', alignItems: 'flex-end', textAlign: 'right' };
      case 'center':
      default:
        return { justifyContent: 'center', alignItems: 'center', textAlign: 'center' };
    }
  })();

  const hasStructuredContent = Boolean(
    brand || header || subheader || typography || options
  );
  const renderStructuredFromProps = hasStructuredContent && !__renderStructuredChildren;
  const subheaderIsOverline = subheaderVariant === 'overline';
  const renderSubheader = () =>
    subheader ? (
      <Typography
        variant={subheaderVariant}
        sx={subheaderIsOverline ? { mb: header ? 0.5 : 0 } : { mt: header ? 0.5 : 0 }}
      >
        {subheader}
      </Typography>
    ) : null;
  const brandNode = brand?.src ? (
    <Box
      component="img"
      src={brand.src}
      alt={brand.alt || 'Brand'}
      sx={{
        width: brand.width ?? 220,
        maxWidth: brand.maxWidth ?? '70vw',
        height: brand.height ?? 'auto',
        objectFit: brand.fit ?? 'contain',
        display: 'block',
        mb: 2,
        ...(brand.sx || {}),
      }}
    />
  ) : null;
  const isFixedLayout = layout === 'fixed';
  return (
    <Box
      component="section"
      {...boxProps}
      sx={{
        position: isFixedLayout ? 'fixed' : 'relative',
        top: isFixedLayout ? 0 : 'auto',
        left: isFixedLayout ? 0 : 'auto',
        width: isFixedLayout ? '100vw' : '100%',
        height: isFixedLayout ? height : 'auto',
        minHeight: !isFixedLayout ? height : undefined,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: modeConfig.alignItems,
        justifyContent: modeConfig.justifyContent,
        boxSizing: 'border-box',
        zIndex: 0,
        backgroundColor: backgroundType === 'color' ? (resolvedBackgroundColor || 'transparent') : 'transparent',
        ...(sxProp || {}),
      }}
    >
      {backgroundType === 'color' ? null : backgroundSrc ? (
        <>
          {backgroundType === 'video' ? (
            <Box
              component="video"
              src={backgroundSrc}
              autoPlay
              muted
              loop
              playsInline
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
                filter: mediaFilter,
                willChange: 'transform, filter',
                transform: 'translateZ(0)',
              }}
            />
          ) : (
            <Box
              component="img"
              src={backgroundSrc}
              alt=""
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
                filter: mediaFilter,
                willChange: 'transform, filter',
                transform: 'translateZ(0)',
              }}
            />
          )}

          {/* Overlay Layer */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: overlayBg,
              // backdropFilter: blur ? `blur(${blurRadius})` : undefined,
              // WebkitBackdropFilter: blur ? `blur(${blurRadius})` : undefined,
              zIndex: 2,
              transition: 'opacity 0.4s ease',
            }}
          />
        </>
      ) : null}

      <Box
        sx={{
          position: 'relative',
          zIndex: 3,
          textAlign: modeConfig.textAlign,
          color: 'text.primary',
          px: padding,
          pt: contentPaddingTop ?? contentPaddingY ?? 0,
          pb: contentPaddingBottom ?? contentPaddingY ?? 0,
          maxWidth: contentMaxWidth,
        }}
      >
        {renderStructuredFromProps ? (
          <>
            {brandNode}
            {subheaderIsOverline ? renderSubheader() : null}
            {header ? (
              <Typography variant={headerVariant} sx={{ fontWeight: 800, letterSpacing: '-0.3px' }}>
                {header}
              </Typography>
            ) : null}
            {!subheaderIsOverline ? renderSubheader() : null}
            {typography ? (
              <Typography variant={typographyVariant} sx={{ mt: subheader || header ? 0.75 : 0 }}>
                {typography}
              </Typography>
            ) : null}
            {options ? (
              <Box
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  flexDirection: optionsDirection,
                  gap: optionsGap,
                  justifyContent: optionsJustify,
                  flexWrap: 'wrap',
                }}
              >
                {options}
              </Box>
            ) : null}
            {children}
          </>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};
