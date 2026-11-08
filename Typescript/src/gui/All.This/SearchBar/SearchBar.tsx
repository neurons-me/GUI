import React, { useEffect, useMemo, useRef, useState } from 'react';
import { dropdownMaxHeight, readVisibleViewport } from './SearchBar.viewport';
import { useGuiTheme } from '@/gui-internals/Hooks';
import type { SearchBarProps, JsonSearchIcon, JsonSearchItem, JsonSearchTile } from './SearchBar.types';
import SearchBarMonadIcon from './SearchBarMonadIcon';

export type { SearchBarProps, JsonSearchItem };

const DEFAULT_KIND_ORDER = ['root', 'doc', 'source'];

function matches(item: JsonSearchItem, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    (item.desc ?? '').toLowerCase().includes(q) ||
    (item.repo ?? '').toLowerCase().includes(q)
  );
}

function rankIndex(kind: string | undefined, order: string[]): number {
  const i = order.indexOf(kind ?? '');
  return i === -1 ? order.length : i;
}

const isUrl = (s?: string) => !!s && /^https?:\/\//.test(s);

function resolveIcon(icon: JsonSearchIcon | undefined, isLight: boolean): string | undefined {
  if (!icon) return undefined;
  if (typeof icon === 'string') return icon;
  return isLight ? icon.light : icon.dark;
}

function isDarkCssColor(value: string): boolean {
  const rgba = value.match(/rgba?\(([^)]+)\)/i);
  if (!rgba) return false;
  const parts = rgba[1].split(',').map((part) => Number.parseFloat(part.trim()));
  const [r, g, b, a = 1] = parts;
  if ([r, g, b].some((n) => Number.isNaN(n)) || a === 0) return false;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
}

function detectPageDarkMode(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const root = document.documentElement;
  const attrTheme = root.dataset.theme || root.getAttribute('color-scheme');
  if (root.classList.contains('dark') || attrTheme === 'dark') return true;
  if (root.classList.contains('light') || attrTheme === 'light') return false;

  for (const element of [document.body, root]) {
    if (!element) continue;
    const bg = window.getComputedStyle(element).backgroundColor;
    if (bg && bg !== 'transparent' && isDarkCssColor(bg)) return true;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function usePageDarkMode(enabled: boolean): boolean {
  const [isDark, setIsDark] = useState(() => (enabled ? detectPageDarkMode() : false));

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const update = () => setIsDark(detectPageDarkMode());
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener?.('change', update);

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(update)
      : null;
    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'color-scheme', 'style'],
    });

    update();

    return () => {
      media?.removeEventListener?.('change', update);
      observer?.disconnect();
    };
  }, [enabled]);

  return isDark;
}

function Icon({
  icon,
  size,
  isLight,
  plate,
}: {
  icon?: JsonSearchIcon;
  size: number;
  isLight: boolean;
  plate?: boolean;
}) {
  if (icon && typeof icon === 'object' && icon.monad) return <SearchBarMonadIcon monad={icon.monad} size={size} />;
  const resolved = resolveIcon(icon, isLight);
  if (isUrl(resolved)) {
    const img = (
      <img
        src={resolved}
        alt=""
        style={{ width: plate ? size * 0.72 : size, height: plate ? size * 0.72 : size, objectFit: 'contain' }}
      />
    );
    if (plate) {
      return (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.22,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {img}
        </span>
      );
    }
    return <span style={{ display: 'inline-flex', flexShrink: 0 }}>{img}</span>;
  }
  return (
    <span aria-hidden style={{ fontSize: size * 0.7, lineHeight: 1, flexShrink: 0 }}>
      {resolved || '•'}
    </span>
  );
}

/**
 * The icon of a quick-access tile, as its entry's `tile` asks: a set width (a wordmark), the tile's width cropped to
 * fit ("cover", a wide picture), or painted in the accent color ("tint": the image becomes a mask). Without those, or
 * for an icon that is not an image, the plain Icon.
 */
function TileIcon({
  item,
  size,
  isLight,
  accent,
}: {
  item: JsonSearchItem;
  size: number;
  isLight: boolean;
  accent: string;
}) {
  const tile: JsonSearchTile = item.tile ?? {};
  const resolved = resolveIcon(item.icon, isLight);
  const monad = item.icon && typeof item.icon === 'object' && item.icon.monad;
  if (monad || !isUrl(resolved) || !(tile.width || tile.fit === 'cover' || tile.tint)) {
    return <Icon icon={item.icon} size={size} isLight={isLight} plate={item.iconPlate} />;
  }
  const cover = tile.fit === 'cover';
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexShrink: 0,
        width: tile.width ? tile.width : cover ? '89%' : size,
        maxWidth: '85%',
        ...(cover ? { maxWidth: '100%' } : {}),
        ...(tile.tint
          ? {
              backgroundColor: accent,
              WebkitMaskImage: `url(${resolved})`,
              maskImage: `url(${resolved})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }
          : {}),
      }}
    >
      <img
        src={resolved}
        alt=""
        style={{
          width: '100%',
          height: cover ? size : 'auto',
          objectFit: cover ? 'cover' : 'contain',
          borderRadius: cover ? 6 : 0,
          display: 'block',
          // tinted: the image keeps the box's size, the accent color painted through it as a mask shows instead
          opacity: tile.tint ? 0 : 1,
        }}
      />
    </span>
  );
}

const VISUALLY_HIDDEN: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

/**
 * SearchBar
 * -------------
 * A search input whose results come from a generic JSON index
 * (`{ id, title, desc, url, icon, repo, kind }[]`), fetched once from `src`
 * or passed directly via `items`. Filters by title/desc/repo, groups by `kind`.
 */
export default function SearchBar(props: SearchBarProps) {
  const {
    src,
    items: providedItems,
    placeholder = 'Search in All.This',
    maxResults = 8,
    kindOrder = DEFAULT_KIND_ORDER,
    enableSlashShortcut = true,
    themeMode = 'auto',
    density = 'comfortable',
    colors: colorSource = 'fixed',
    onSelect,
    id,
    className,
    sx,
    ...rest
  } = props;

  const guiTheme = useGuiTheme();
  const compact = density === 'compact';
  const pageDarkMode = usePageDarkMode(themeMode === 'auto');
  const isLight = themeMode === 'light'
    ? true
    : themeMode === 'dark'
      ? false
      : guiTheme.palette.mode === 'dark'
        ? false
        : !pageDarkMode;

  const [fetchedItems, setFetchedItems] = useState<JsonSearchItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [panelMaxHeight, setPanelMaxHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (providedItems || !src) return;
    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${src}: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setFetchedItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [src, providedItems]);

  const items = providedItems ?? fetchedItems ?? [];

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return items
      .filter((item) => matches(item, query))
      .sort((a, b) => rankIndex(a.kind, kindOrder) - rankIndex(b.kind, kindOrder))
      .slice(0, maxResults);
  }, [items, query, kindOrder, maxResults]);

  const quickAccessItems = useMemo(
    () => items.filter((item) => item.kind === 'root' || (item.kind === 'source' && !item.repo)),
    [items]
  );
  const showSuggestions = isFocused && !query.trim() && quickAccessItems.length > 0;
  const showResults = query.trim().length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep the open dropdown above the on-screen keyboard: follow visualViewport (the only viewport the
  // keyboard shrinks on iOS/Android), cap the panel to the visible space below the field and let it scroll.
  const panelOpen = showSuggestions || showResults;
  useEffect(() => {
    if (!panelOpen || typeof window === 'undefined') return;
    const vv = (window as any).visualViewport as (EventTarget & { height: number; offsetTop: number }) | undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = fieldRef.current;
        if (!field) return;
        let vp = readVisibleViewport(window);
        let rect = field.getBoundingClientRect();
        // Keyboard covers the field: bring it into the visible area first.
        if (vp && (rect.bottom > vp.top + vp.height || rect.top < vp.top)) {
          field.scrollIntoView({ block: 'nearest' });
          vp = readVisibleViewport(window);
          rect = field.getBoundingClientRect();
        }
        setPanelMaxHeight(dropdownMaxHeight(rect.bottom, vp));
      });
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [panelOpen]);

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay so a click on a suggestion/result registers before we hide the dropdown.
    blurTimeout.current = setTimeout(() => setIsFocused(false), 120);
  };

  useEffect(() => {
    if (!enableSlashShortcut) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableSlashShortcut]);

  const activate = (item: JsonSearchItem) => {
    if (onSelect) onSelect(item);
    else if (typeof window !== 'undefined') window.location.href = item.url;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) activate(item);
    }
  };

  const P = guiTheme.palette;
  const colors = colorSource === 'theme'
    ? {
        border: P.divider,
        borderHover: P.primary.main,
        bg: P.background.paper,
        text: P.text.primary,
        sub: P.text.secondary,
        kbdBg: P.action.hover,
        rowHover: P.action.hover,
      }
    : isLight
    ? {
        border: 'rgba(15,23,32,0.14)',
        borderHover: '#0f6a78',
        bg: '#fff',
        text: '#0f1720',
        sub: '#51606d',
        kbdBg: 'rgba(15,23,32,0.08)',
        rowHover: 'rgba(15,106,120,0.06)',
      }
    : {
        border: 'rgba(232,237,237,0.12)',
        borderHover: '#4fd1c5',
        bg: '#111a1f',
        text: '#e8eded',
        sub: '#98a7b3',
        kbdBg: 'rgba(255,255,255,0.10)',
        rowHover: 'rgba(79,209,197,0.08)',
      };

  return (
    <div
      id={id}
      className={className}
      style={{ position: 'relative', width: '100%', maxWidth: 480, ...(sx as React.CSSProperties) }}
      {...rest}
    >
      <div
        ref={fieldRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          color: colors.text,
        }}
      >
        <span aria-hidden style={{ fontSize: 14, opacity: 0.7 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label="Search in All.This"
          style={{
            flex: 1,
            minWidth: 0, // an input keeps its 20-character width otherwise and pushes the "/" badge out of a narrow box
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: colors.text,
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        {enableSlashShortcut && !query ? (
          <span
            aria-hidden
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 6,
              background: colors.kbdBg,
              color: colors.sub,
            }}
          >
            /
          </span>
        ) : null}
      </div>

      {error ? (
        <div style={{ marginTop: 6, fontSize: 12, color: '#e05c5c' }}>{error}</div>
      ) : null}

      {showSuggestions ? (
        <div
          role="listbox"
          aria-label="Quick access"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 20,
            padding: 10,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            boxShadow: isLight ? '0 8px 24px rgba(15,23,32,0.12)' : '0 8px 24px rgba(0,0,0,0.4)',
            display: 'grid',
            // minmax(0, 1fr), not 1fr: a plain 1fr column grows to its longest word (an icon that failed to load and
            // shows its path as text), past the box
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
            maxHeight: panelMaxHeight,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch' as any,
          }}
        >
          {quickAccessItems.map((item) => (
            <a
              key={item.id}
              role="option"
              href={item.url}
              onMouseDown={(e) => {
                // Prevent the input's blur from firing before the click is registered.
                e.preventDefault();
              }}
              onClick={(e) => {
                if (onSelect) {
                  e.preventDefault();
                  activate(item);
                }
              }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: compact ? 2 : 4,
                padding: compact ? 4 : '8px 4px',
                borderRadius: 8,
                border: item.tile?.frame ? `2px solid ${colors.borderHover}` : `1px solid ${colors.border}`,
                textDecoration: 'none',
                color: colors.text,
                textAlign: 'center',
                minWidth: 0,
                ...(compact ? { aspectRatio: '1 / 1', overflow: 'hidden' } : {}),
              }}
            >
              <TileIcon item={item} size={compact ? 53 : 32} isLight={isLight} accent={colors.borderHover} />
              <span
                style={
                  item.tile?.hideLabel
                    ? VISUALLY_HIDDEN
                    : {
                        fontSize: compact ? 8 : 9,
                        fontWeight: item.tile?.label === 'muted' ? 500 : 600,
                        opacity: item.tile?.label === 'muted' ? 0.7 : 1,
                        lineHeight: 1.15,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: compact ? 1 : 2,
                        WebkitBoxOrient: 'vertical' as any,
                      }
                }
              >
                {item.title}
              </span>
            </a>
          ))}
        </div>
      ) : null}

      {showResults ? (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 20,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            boxShadow: isLight ? '0 8px 24px rgba(15,23,32,0.12)' : '0 8px 24px rgba(0,0,0,0.4)',
            overflowX: 'hidden',
            overflowY: 'auto',
            maxHeight: panelMaxHeight,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch' as any,
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: colors.sub }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item, i) => (
              <a
                key={item.id}
                role="option"
                aria-selected={i === activeIndex}
                href={item.url}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={(e) => {
                  if (onSelect) {
                    e.preventDefault();
                    activate(item);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  textDecoration: 'none',
                  color: colors.text,
                  background: i === activeIndex ? colors.rowHover : 'transparent',
                  borderBottom: i < results.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}
              >
                <Icon icon={item.icon} size={20} isLight={isLight} plate={item.iconPlate} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{item.title}</span>
                  {item.desc ? (
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: colors.sub,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.desc}
                    </span>
                  ) : null}
                </span>
                {item.kind ? (
                  <span
                    aria-hidden
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: colors.sub,
                      flexShrink: 0,
                    }}
                  >
                    {item.kind}
                  </span>
                ) : null}
              </a>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
