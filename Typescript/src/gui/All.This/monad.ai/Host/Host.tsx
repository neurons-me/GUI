import HostCompact from './Host_Compact';
import HostModal from './Host_Modal';

export type HostStatus = 'online' | 'offline' | 'checking' | 'unknown';
export type HostVariant = 'compact' | 'modal';

export interface HostProps {
  label?: string;
  status?: HostStatus;
  title?: string;
  variant?: HostVariant;
}

export default function Host({ variant = 'compact', ...props }: HostProps) {
  if (variant === 'modal') {
    return <HostModal open={false} onClose={function (): void {
        throw new Error('Function not implemented.');
    } } {...props} />;
  }

  return <HostCompact {...props} />;
}