import * as React from 'react';
import { useMe } from '@/react/useMe';
import { useMeValue } from '@/react/useMeValue';
import type { AccessConfirmationInput } from '../types';
import AccessConfirmationModal from './AccessConfirmationModal';
import { registerCleakerAccessUiBridge } from './bridge';

type PendingConfirmation = {
  input: AccessConfirmationInput;
  resolve: (approved: boolean) => void;
};

export default function AccessRequestHandler() {
  useMe();
  const stagedAppName = useMeValue<string>('ui.cleaker.access.appName') || '';
  const stagedReason = useMeValue<string>('ui.cleaker.access.reason') || '';
  const stagedRequestedScopes = useMeValue<string[]>('ui.cleaker.access.requestedScopes') || [];
  const stagedNamespace = useMeValue<string>('identity.session.namespace') || '';
  const [pendingConfirmation, setPendingConfirmation] = React.useState<PendingConfirmation | null>(null);
  const confirmationRef = React.useRef<PendingConfirmation | null>(null);

  const closeConfirmation = React.useCallback((approved: boolean) => {
    const current = confirmationRef.current;
    confirmationRef.current = null;
    setPendingConfirmation(null);
    current?.resolve(approved);
  }, []);

  React.useEffect(() => {
    return () => {
      confirmationRef.current?.resolve(false);
      confirmationRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const unregister = registerCleakerAccessUiBridge({
      requestConfirmation: async (input) =>
        await new Promise<boolean>((resolve) => {
          const request = { input, resolve };
          confirmationRef.current = request;
          setPendingConfirmation(request);
        }),
    });

    return unregister;
  }, []);

  const confirmationInput = pendingConfirmation?.input;

  return (
    <AccessConfirmationModal
      open={Boolean(confirmationInput)}
      appName={confirmationInput?.request.appName || stagedAppName}
      reason={confirmationInput?.request.reason || stagedReason}
      requestedScopes={confirmationInput?.request.requestedScopes || stagedRequestedScopes}
      namespace={confirmationInput?.session.namespace || stagedNamespace}
      onApprove={() => closeConfirmation(true)}
      onDeny={() => closeConfirmation(false)}
    />
  );
}
