import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Typography from '@/gui/Atoms/Typography/Typography';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
import Tooltip from '@/gui/Atoms/Tooltip/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import type { SearchFieldProps } from './SearchField.types';

// SearchField — a generic collapsible search input: a bare icon button by
// default, expands in place into a full text field + results dropdown on
// click. Same collapse/expand behavior regardless of viewport — no
// breakpoint branch, callers position it (fixed corner, inline, wherever)
// and this owns only the collapse/expand/dropdown chrome.
//
// Deliberately "dumb": takes already-filtered `results` and fires
// `onQueryChange`/`onSelectResult` rather than owning any fetch or
// filtering itself. What it searches over — a docs index, a users
// directory, anything — is the caller's concern; this is the reusable UI
// shell, extracted out of Namespace.tsx (its first real consumer,
// which searches a live .me namespace directory) so it isn't one-off page
// JSX. Not the same component as gui/All.This/SearchBar — that one fetches
// and filters a flat JSON docs index itself and has no collapse/expand
// chrome; different data contract, different embed context (plain-HTML
// doc pages via an IIFE), not a fit to extend for this.
export default function SearchField({
  query,
  onQueryChange,
  results,
  onSelectResult,
  onRemoveResult,
  placeholder = 'Search',
  emptyLabel,
  ariaLabel = 'Search',
  onExpandedChange,
  collapsedSize = 40,
  maxResults = 6,
  resultsMode = 'dropdown',
  className,
  sx,
  'data-gui-node-id': dataGuiNodeId = 'SearchField',
  'data-gui-component': dataGuiComponent = 'SearchField',
}: SearchFieldProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const collapse = () => {
    setExpanded(false);
    setFocused(false);
    onQueryChange('');
    onExpandedChange?.(false);
  };

  const visibleResults = results.slice(0, maxResults);
  const resultsOpen = focused && (query.trim().length > 0 || results.length > 0);
  const showDropdown = resultsMode === 'dropdown' && resultsOpen;

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, results]);

  const choose = (result: (typeof results)[number]) => {
    onSelectResult(result);
    collapse();
  };

  return (
    <Box
      data-gui-node-id={dataGuiNodeId}
      data-gui-component={dataGuiComponent}
      className={className}
      sx={sx}
    >
      {!expanded ? (
        <IconButton
          onClick={() => { setExpanded(true); onExpandedChange?.(true); }}
          aria-label={ariaLabel}
          data-gui-node-id={`${dataGuiNodeId}.toggle`}
          sx={{
            width: collapsedSize,
            height: collapsedSize,
            border: '1px solid',
            borderColor: 'divider',
            // Square (soft corners), not circular -- matches the position
            // QRme badge this sits next to in Namespace.tsx's shared
            // topbar row (same 5px radius QR.me.tsx's own topbar variant
            // uses), flagged live (2026-10-02) as wanting one consistent
            // shape language between the two, not a circle next to a
            // square.
            borderRadius: '5px',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <Icon name="search" fontSize={18 as any} />
        </IconButton>
      ) : (
        <Box
          component="form"
          autoComplete="off"
          onSubmit={(e: React.FormEvent) => { e.preventDefault(); }}
          sx={{ position: 'relative', width: 'min(280px, calc(100vw - 32px))' }}
        >
          <TextField
            inputRef={inputRef}
            data-gui-node-id={`${dataGuiNodeId}.input`}
            placeholder={placeholder}
            value={query}
            autoComplete="off"
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => {
              setFocused(false);
              if (!query.trim()) { setExpanded(false); onExpandedChange?.(false); }
            }, 120)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                collapse();
                return;
              }
              if (!resultsOpen || visibleResults.length === 0) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, visibleResults.length - 1));
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                const result = visibleResults[activeIndex];
                if (result) choose(result);
              }
            }}
            fullWidth
            size="small"
            slotProps={{
              htmlInput: {
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'none',
                spellCheck: false,
                // A name the browser has no saved history for, so it does not
                // open its own suggestions over our results (it ignores
                // autoComplete=off on fields it already knows).
                name: 'gui-directory-q',
                id: `${dataGuiNodeId}-q`,
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="search" fontSize="1rem" style={{ opacity: 0.6 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 0 }}>
                    <IconButton
                      size="small"
                      aria-label="Close search"
                      onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); collapse(); }}
                      sx={{
                        p: 0,
                        width: '1.25rem',
                        height: '1.25rem',
                        color: 'text.secondary',
                        '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                      }}
                    >
                      <Icon name="close" fontSize="0.875rem" style={{ opacity: 0.7 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              // A fill on the FormControl is a rectangle behind the pill and
              // reads as a darker slab on the top bar. Keep the root clear
              // and style only the input, at a height that sits inside the
              // 3rem bar.
              bgcolor: 'transparent',
              '& .MuiOutlinedInput-root': {
                height: '2.25rem',
                typography: 'body2',
                fontSize: '0.875rem',
                borderRadius: '999px',
                bgcolor: 'transparent',
                pl: '0.75rem',
                pr: '0.25rem',
                '& fieldset': {
                  borderColor: 'divider',
                  borderWidth: '1px',
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                  '& fieldset': { borderColor: 'divider' },
                },
                '&.Mui-focused, &.Mui-focused:hover': {
                  bgcolor: 'transparent',
                  '& fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '1px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  py: 0,
                  height: '2.25rem',
                  boxSizing: 'border-box',
                  fontSize: '0.875rem',
                  lineHeight: '2.25rem',
                },
              },
            }}
          />
          {showDropdown && (
            <Box
              data-gui-node-id={`${dataGuiNodeId}.results`}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 10,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: 8,
                overflow: 'hidden',
              }}
            >
              {visibleResults.length > 0 ? (
                visibleResults.map((result, index) => (
                  <Box
                    key={result.id}
                    id={`${dataGuiNodeId}-result-${index}`}
                    component="button"
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); choose(result); }}
                    data-gui-node-id={`${dataGuiNodeId}.results.${result.id}`}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      border: 'none',
                      background: index === activeIndex ? 'action.hover' : 'transparent',
                      color: 'text.primary',
                      cursor: 'pointer',
                      textAlign: 'left',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {result.avatarSrc || result.recent || !result.icon ? (
                      <Avatar
                        src={result.avatarSrc || undefined}
                        alt={result.label}
                        sx={{ width: '1.5rem', height: '1.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {(result.avatarFallback || result.label).slice(0, 1).toUpperCase()}
                      </Avatar>
                    ) : (
                      <Icon name={result.icon} fontSize="1.125rem" style={{ opacity: 0.75, flexShrink: 0 }} />
                    )}
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, flex: 1, minWidth: 0 }}>
                      {result.label}
                    </Typography>
                    {result.recent ? (
                      <Icon name="history" fontSize="1rem" style={{ opacity: 0.55, flexShrink: 0 }} />
                    ) : null}
                    {onRemoveResult && result.recent ? (
                      <Tooltip title="Remove" size="sm" placement="top">
                        <IconButton
                          size="small"
                          aria-label={`Remove ${result.label}`}
                          onMouseDown={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveResult(result);
                          }}
                          sx={{ p: 0.25, flexShrink: 0, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                        >
                          <Icon name="close" fontSize="0.9rem" style={{ opacity: 0.7 }} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ px: 1.5, py: 1, color: 'text.secondary' }}>
                  {emptyLabel ?? `No match for "${query.trim()}"`}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
