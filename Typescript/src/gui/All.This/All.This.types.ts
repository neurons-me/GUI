import type { ReactNode } from 'react';

export type ModuleSource = 'local' | 'cdn';
export type RuntimeModuleState = 'pending' | 'on' | 'off';

export interface RuntimeModuleProps {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
  source: ModuleSource;
  state: RuntimeModuleState;
  assetUrl?: string;
  version?: string;
  onSourceChange?: (nextSource: ModuleSource) => void;
}

export interface ModuleFrameProps {
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  sx?: Record<string, any>;
}

export interface ModuleCollectionProps {
  children?: ReactNode;
  gap?: number;
  sx?: Record<string, any>;
}

export interface AllThisProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  modules?: ReactNode[];
  layout?: 'grid' | 'list';
  gap?: number;
  sx?: Record<string, any>;
}
