import type { RegistryEntry } from '@/Registry/types';
import RightSidebar from './RightBar';
import type { RightSidebarElement } from './RightBar.types';

type RightBarSpec = {
  type: 'RightBar';
  props?: {
    elements?: RightSidebarElement[];
    collections?: any[];
    footerElements?: RightSidebarElement[];
    footerCollections?: any[];
    initialView?: 'rail' | 'expanded' | 'mobile';
    className?: string;
    id?: string;
    'data-testid'?: string;
    'data-gui-node-id'?: string;
    'data-gui-component'?: string;
  };
};

const RIGHT_BAR_META: RegistryEntry['meta'] = {
  id: 'layout.rightbar',
  label: 'RightBar',
  kind: 'layout',
  group: 'Layout',
  path: ['Layout', 'Sidebars'],
  tags: ['sidebar', 'navigation', 'drawer', 'right', 'bar'],
  demoSpec: {
    type: 'RightBar',
    props: {
      elements: [{ type: 'link', props: { label: 'Docs', href: '/docs' } }],
    },
  },
};

const RightBarResolver: RegistryEntry = {
  type: 'RightBar',
  meta: RIGHT_BAR_META,
  resolve(spec: RightBarSpec) {
    const props = spec.props ?? {};
    return (
      <RightSidebar
        elements={props.elements ?? []}
        collections={Array.isArray(props.collections) ? props.collections : []}
        footerElements={props.footerElements ?? []}
        footerCollections={Array.isArray(props.footerCollections) ? props.footerCollections : []}
        initialView={props.initialView}
        className={props.className}
        id={props.id}
        data-testid={props['data-testid']}
        data-gui-node-id={props['data-gui-node-id']}
        data-gui-component={props['data-gui-component']}
      />
    );
  },
};

export default RightBarResolver;
