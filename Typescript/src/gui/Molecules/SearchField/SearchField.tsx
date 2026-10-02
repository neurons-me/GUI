import * as React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Icon from '@/gui/Atoms/Icon/Icon';
import IconButton from '@/gui/Atoms/IconButton/IconButton';
import Typography from '@/gui/Atoms/Typography/Typography';
import Avatar from '@/gui/Atoms/Avatar/Avatar';
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
  placeholder = 'Search',
  emptyLabel,
  ariaLabel = 'Search',
  onExpandedChange,
  maxResults = 6,
  className,
  sx,
  'data-gui-node-id': dataGuiNodeId = 'SearchField',
  'data-gui-component': dataGuiComponent = 'SearchField',
}: SearchFieldProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
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
  const resultsOpen = focused && query.trim().length > 0;

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
            width: 40,
            height: 40,
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
        <Box sx={{ position: 'relative', width: 'min(280px, calc(100vw - 32px))' }}>
          <TextField
            inputRef={inputRef}
            data-gui-node-id={`${dataGuiNodeId}.input`}
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => {
              setFocused(false);
              if (!query.trim()) { setExpanded(false); onExpandedChange?.(false); }
            }, 120)}
            onKeyDown={(e) => { if (e.key === 'Escape') collapse(); }}
            fullWidth
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon name="search" fontSize={18 as any} style={{ opacity: 0.6 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Close search"
                      onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); collapse(); }}
                      sx={{ p: 0.25 }}
                    >
                      <Icon name="close" fontSize={16 as any} style={{ opacity: 0.6 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              bgcolor: 'background.default',
              '& .MuiOutlinedInput-root': { borderRadius: 999 },
            }}
          />
          {resultsOpen && (
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
                visibleResults.map((result) => (
                  <Box
                    key={result.id}
                    component="button"
                    type="button"
                    onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); onSelectResult(result); }}
                    data-gui-node-id={`${dataGuiNodeId}.results.${result.id}`}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      border: 'none',
                      background: 'transparent',
                      color: 'text.primary',
                      cursor: 'pointer',
                      textAlign: 'left',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Avatar
                      src={result.avatarSrc || undefined}
                      alt={result.label}
                      sx={{ width: 24, height: 24, fontSize: 12, fontWeight: 700 }}
                    >
                      {(result.avatarFallback || result.label).slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {result.label}
                    </Typography>
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
