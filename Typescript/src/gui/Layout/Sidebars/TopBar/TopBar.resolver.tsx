// src/components/generics/AppBars/TopBar/TopBar.resolver.tsx
import TopBar from './TopBar';
import type { RegistryEntry, ResolveCtx } from '@/Registry/types';
/** Declarative shape the renderer/LLM can emit for a TopBar */
type TopBarLinkChildSpec = {
  label: string;
  href?: string;
  external?: boolean;
  icon?: string;
  iconColor?: string;
};

type TopBarLinkSpec = {
  label: string;
  href?: string;
  external?: boolean;
  icon?: string;
  iconColor?: string;
  children?: TopBarLinkChildSpec[];
};

type TopBarSpec = {
  type: 'TopBar';
  props?: {
    title?: string;
    logo?: string;
    NavBarLinks?: TopBarLinkSpec[];
    elementsCenter?: Array<{ type: 'link' | 'menu' | 'action'; props: Record<string, any> }>;
    elementsRight?: Array<{ type: 'link' | 'menu' | 'action'; props: Record<string, any> }>;
    collectionsCenter?: any[];
    collectionsRight?: any[];
    showMenuButton?: boolean;
    showThemeToggle?: boolean;
    homeTo?: string;
    position?: 'fixed' | 'static' | 'sticky';
    /** Optional event id to resolve from ctx.actions (e.g., 'openLeftDrawer') */
    onMenuClickId?: string;
    /** Pass-through styling slot (sx forwarded to AppBar/Toolbar usage inside) */
    sx?: any;
    /** Misc passthroughs */
    id?: string;
    className?: string;
    'data-testid'?: string;
  };
};

const TOP_BAR_META: RegistryEntry['meta'] = {
  id: 'layout.topbar',
  label: 'TopBar',
  kind: 'layout',
  group: 'Layout',
  path: ['Layout', 'Sidebars'],
  tags: ['topbar', 'navigation', 'header', 'appbar'],
  demoSpec: {
    type: 'TopBar',
    props: {
      title: 'neurons.me',
    },
  },
};

/**
 * TopBarResolver
 * - Maps a JSON-friendly spec → real <TopBar />.
 * - Handlers can be injected from ResolveCtx via `onMenuClickId`.
 */
const TopBarResolver: RegistryEntry = {
  type: 'TopBar',
  meta: TOP_BAR_META,
  resolve(spec: TopBarSpec, ctx?: ResolveCtx) {
    const p = spec.props ?? {};

    // Resolve optional handler from ctx if provided
    const onMenuClick =
      (p.onMenuClickId && ctx?.actions && typeof ctx.actions[p.onMenuClickId] === 'function')
        ? ctx.actions[p.onMenuClickId]
        : undefined;

    return (
      <TopBar
        title={p.title ?? 'neurons.me'}
        logo={p.logo ?? 'https://neurons.me/neurons.me.png'}
        elementsCenter={
          Array.isArray(p.elementsCenter) && p.elementsCenter.length
            ? p.elementsCenter as any
            : (p.NavBarLinks ?? []).map(link => ({
                type: 'link',
                props: {
                  label: link.label ?? '',
                  href: link.href ?? '',
                  external: link.external ?? false,
                  icon: link.icon,
                  iconColor: link.iconColor,
                  children: link.children ?? [],
                }
              }))
        }
        elementsRight={Array.isArray(p.elementsRight) ? p.elementsRight as any : []}
        collectionsCenter={Array.isArray(p.collectionsCenter) ? p.collectionsCenter : []}
        collectionsRight={Array.isArray(p.collectionsRight) ? p.collectionsRight : []}
        homeTo={p.homeTo ?? '/'}
        position={p.position ?? 'fixed'}
        // passthroughs
        sx={p.sx}
        id={p.id}
        className={p.className}
        data-testid={p['data-testid']}
      />
    );
  },
};

export default TopBarResolver;
