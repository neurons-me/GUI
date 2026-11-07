import React from 'react';
import Link from '@/gui/Atoms/Link/Link'; // Adjust import path if necessary
import Icon from '@/gui/Atoms/Icon/Icon'; // Import Icon component
import type { TopBarLinkProps } from './TopBarLink.types';
const TopBarLink: React.FC<TopBarLinkProps> = ({ label, href, onClick, active, icon, iconColor, external, showLabel = true, 'data-gui-node-id': guiNodeId }) => {
  const content = (
    <>
      {icon && (
        <Icon
          name={icon}
          iconColor={iconColor || 'currentColor'}
          style={{ marginRight: 3, fontSize: 20, position: 'relative', top: -1 }}
        />
      )}
      {showLabel && <span>{label}</span>}
    </>
  );

  // no place to go, something to do: a button that looks like the links beside it
  if (!href && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={showLabel ? undefined : label}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        data-gui-node-id={guiNodeId || undefined}
        style={{ display: 'inline-flex', alignItems: 'center', color: 'inherit', font: 'inherit', background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href ?? '#'}
      target={external ? '_blank' : '_self'}
      data-gui-node-id={guiNodeId || undefined}
      style={{ display: 'inline-flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}
    >
      {content}
    </Link>
  );
};

export default TopBarLink;