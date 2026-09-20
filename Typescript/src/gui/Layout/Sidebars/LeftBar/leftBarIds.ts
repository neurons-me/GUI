/**
 * The id of an element of the left bar, as a path under the bar's own id.
 *
 * Links and menus are numbered (`GUI.bars.left.link.0`). A footer action that
 * has a label is named by it -- `GUI.bars.left.footer.theme`,
 * `GUI.bars.left.footer.devtools` -- so a launcher that lives there and hangs
 * its own parts under that id (`...footer.theme.avatar`) reads the same in
 * every app, whatever position it sits in. An element can still name itself
 * with `data-gui-node-id`.
 */
export type LeftBarElementLike = {
  type: 'link' | 'menu' | 'action';
  props?: Record<string, any>;
};

const COMPONENT_BY_TYPE = { link: 'link', menu: 'menu', action: 'action' } as const;

/** "Dev Tools" -> "devtools": one word, letters and digits. */
export function leftBarSlug(label: unknown): string {
  return String(label ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function getSidebarRootPath(nodeId: string): string {
  const normalized = String(nodeId || '').trim();
  if (!normalized) return 'GUI.bars.left';
  const parts = normalized.split(':');
  if (parts.length > 1) return parts.slice(1).join(':');
  return normalized.replace(/[^\w.-]+/g, '.');
}

export function buildLeftSidebarElementMeta(
  el: LeftBarElementLike,
  rootNodeId: string,
  section: 'elements' | 'footerElements',
  idx: number
) {
  const explicitNodeId = el?.props?.['data-gui-node-id'];
  const explicitComponent = el?.props?.['data-gui-component'];
  const rootPath = getSidebarRootPath(rootNodeId);
  const componentName = explicitComponent || COMPONENT_BY_TYPE[el.type];
  const footer = section === 'footerElements';
  const named = footer && el.type === 'action' ? leftBarSlug(el.props?.label) : '';
  const path = named
    ? `${rootPath}.footer.${named}`
    : `${rootPath}.${footer ? 'footer.' : ''}${el.type}.${idx}`;
  const nodeId = explicitNodeId || path;
  return { nodeId, path, componentName };
}
