import React from 'react';
import Link from '@/gui/Atoms/Link/Link'; // Adjust import path if necessary
import Icon from '@/gui/Atoms/Icon/Icon'; // Import Icon component
import type { TopBarLinkProps } from './TopBarLink.types';
const TopBarLink: React.FC<TopBarLinkProps> = ({ label, href, icon, iconColor, external, showLabel = true, 'data-gui-node-id': guiNodeId }) => {
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