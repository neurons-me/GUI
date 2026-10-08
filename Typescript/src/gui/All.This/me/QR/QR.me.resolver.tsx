import * as React from 'react';
import type { RegistryEntry } from '@/Registry/types';
import QRme, { type QRmeProps } from './QR.me';

type QRmeSpec = {
  type: 'QR.me';
  props?: QRmeProps;
};

export const meta = {
  id: 'components.identity-noise.qr-me',
  type: 'QR.me',
  label: 'QR.me',
  group: 'Components',
  path: ['Identity Noise', '.me'],
  tags: ['qr', '.me', 'avatar', 'identity', 'flip'],
  demoSpec: {
    type: 'QR.me',
    props: {
      value: 'https://jabellae.cleaker.me',
      username: 'jabellae',
      diameter: 112,
      variant: 'md',
      hoverFlip: true,
      clickFlip: true,
    },
  },
} as const;

const QRmeResolver: RegistryEntry = {
  type: 'QR.me',
  resolve(spec: QRmeSpec) {
    const props: Partial<QRmeProps> = spec.props ?? {};
    if (!props.value) return null;

    return (
      <QRme
        value={String(props.value)}
        username={props.username}
        avatarSrc={props.avatarSrc}
        avatarAlt={props.avatarAlt}
        avatarFallback={props.avatarFallback}
        variant={props.variant}
        diameter={props.diameter}
        size={props.size}
        bg={props.bg}
        fg={props.fg}
        defaultFace={props.defaultFace}
        hoverFlip={props.hoverFlip}
        clickFlip={props.clickFlip}
        showAvatarLabel={props.showAvatarLabel}
        className={props.className}
        style={props.style}
      />
    );
  },
};

export default QRmeResolver;
