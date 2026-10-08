import type { AccessConfirmationInput, PinVerificationInput } from '../types';

type AccessUiBridge = {
  requestConfirmation: (input: AccessConfirmationInput) => Promise<boolean>;
  requestPinVerification?: (input: PinVerificationInput) => Promise<boolean>;
};

let activeBridge: AccessUiBridge | null = null;

export function registerCleakerAccessUiBridge(bridge: AccessUiBridge | null): () => void {
  activeBridge = bridge;
  return () => {
    if (activeBridge === bridge) {
      activeBridge = null;
    }
  };
}

export async function requestAccessConfirmationFromUi(
  input: AccessConfirmationInput
): Promise<boolean | null> {
  if (!activeBridge) return null;
  return activeBridge.requestConfirmation(input);
}

export async function requestPinVerificationFromUi(
  input: PinVerificationInput
): Promise<boolean | null> {
  if (!activeBridge?.requestPinVerification) return null;
  return activeBridge.requestPinVerification(input);
}
