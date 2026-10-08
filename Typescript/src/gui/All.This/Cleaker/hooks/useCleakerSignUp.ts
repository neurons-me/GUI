import { useCallback, useState } from 'react';

export type ClaimResolution = 'idle' | 'checking' | 'openable' | 'locked' | 'unclaimed' | 'error';
export type AuthStatus = 'idle' | 'checking' | 'ok' | 'error';

export type CleakerProfileSnapshot = {
  username: string;
  name: string;
  email: string;
  phone: string;
  namespace: string;
  claimedAt: number | null;
};

export type CleakerSignUpSubmitInput = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
};

export type UseCleakerSignUpOptions = {
  username: string;
  secret: string;
  validateUsername: (raw: string) => { value: string; error: string | null };
  onSubmit: (input: CleakerSignUpSubmitInput) => Promise<boolean> | boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export type UseCleakerSignUpResult = {
  registerOpen: boolean;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  registerFullName: string;
  setRegisterFullName: React.Dispatch<React.SetStateAction<string>>;
  registerUsername: string;
  setRegisterUsername: React.Dispatch<React.SetStateAction<string>>;
  registerEmail: string;
  setRegisterEmail: React.Dispatch<React.SetStateAction<string>>;
  registerPhone: string;
  setRegisterPhone: React.Dispatch<React.SetStateAction<string>>;
  registerPassword: string;
  setRegisterPassword: React.Dispatch<React.SetStateAction<string>>;
  registerConfirmPassword: string;
  setRegisterConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
  registerError: string | null;
  setRegisterError: React.Dispatch<React.SetStateAction<string | null>>;
  handleRegisterSubmit: () => Promise<boolean>;
};

function cleanString(value: unknown): string {
  return String(value || '').trim();
}

function validateEmail(raw: string): string | null {
  const value = cleanString(raw);
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
  return null;
}

function validatePhone(raw: string): string | null {
  const value = cleanString(raw);
  if (!value) return 'Phone number is required';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return 'Invalid phone number';
  return null;
}

function validateFullName(raw: string): string | null {
  const value = cleanString(raw).replace(/\s+/g, ' ');
  if (!value) return 'Full name is required';
  if (value.length < 2) return 'Full name is too short';
  return null;
}

export default function useCleakerSignUp(
  options: UseCleakerSignUpOptions,
): UseCleakerSignUpResult {
  const {
    username,
    secret,
    validateUsername,
    onSubmit,
    onOpen,
    onClose,
  } = options;

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerFullName, setRegisterFullNameState] = useState('');
  const [registerUsername, setRegisterUsernameState] = useState('');
  const [registerEmail, setRegisterEmailState] = useState('');
  const [registerPhone, setRegisterPhoneState] = useState('');
  const [registerPassword, setRegisterPasswordState] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPasswordState] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);

  const setRegisterFullName = useCallback((next: React.SetStateAction<string>) => {
    setRegisterFullNameState(next);
    setRegisterError(null);
  }, []);

  const setRegisterUsername = useCallback((next: React.SetStateAction<string>) => {
    setRegisterUsernameState(next);
    setRegisterError(null);
  }, []);

  const setRegisterEmail = useCallback((next: React.SetStateAction<string>) => {
    setRegisterEmailState(next);
    setRegisterError(null);
  }, []);

  const setRegisterPhone = useCallback((next: React.SetStateAction<string>) => {
    setRegisterPhoneState(next);
    setRegisterError(null);
  }, []);

  const setRegisterPassword = useCallback((next: React.SetStateAction<string>) => {
    setRegisterPasswordState(next);
    setRegisterError(null);
  }, []);

  const setRegisterConfirmPassword = useCallback((next: React.SetStateAction<string>) => {
    setRegisterConfirmPasswordState(next);
    setRegisterError(null);
  }, []);

  const openRegisterModal = useCallback(() => {
    const validated = validateUsername(username);
    setRegisterFullNameState('');
    setRegisterUsernameState(validated.error ? '' : validated.value);
    setRegisterEmailState('');
    setRegisterPhoneState('');
    setRegisterPasswordState(secret);
    setRegisterConfirmPasswordState(secret);
    setRegisterError(null);
    setRegisterOpen(true);
    onOpen?.();
  }, [onOpen, secret, username, validateUsername]);

  const closeRegisterModal = useCallback(() => {
    setRegisterOpen(false);
    setRegisterFullNameState('');
    setRegisterUsernameState('');
    setRegisterEmailState('');
    setRegisterPhoneState('');
    setRegisterPasswordState('');
    setRegisterConfirmPasswordState('');
    setRegisterError(null);
    onClose?.();
  }, [onClose]);

  const handleRegisterSubmit = useCallback(async () => {
    const fullNameError = validateFullName(registerFullName);
    const validated = validateUsername(registerUsername);
    const emailError = validateEmail(registerEmail);
    const phoneError = validatePhone(registerPhone);
    const normalizedPassword = String(registerPassword || '');
    const normalizedConfirm = String(registerConfirmPassword || '');

    if (fullNameError) {
      setRegisterError(fullNameError);
      return false;
    }
    if (!validated.value || validated.error) {
      setRegisterError(validated.error || 'Invalid username');
      return false;
    }
    if (emailError) {
      setRegisterError(emailError);
      return false;
    }
    if (phoneError) {
      setRegisterError(phoneError);
      return false;
    }
    if (!normalizedPassword) {
      setRegisterError('Password is required');
      return false;
    }
    if (normalizedPassword !== normalizedConfirm) {
      setRegisterError('Passwords do not match');
      return false;
    }

    setRegisterError(null);

    try {
      const success = await onSubmit({
        fullName: cleanString(registerFullName).replace(/\s+/g, ' '),
        username: validated.value,
        email: cleanString(registerEmail),
        phone: cleanString(registerPhone),
        password: normalizedPassword,
      });

      if (success === false) return false;
      closeRegisterModal();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRegisterError(message);
      return false;
    }
  }, [
    onSubmit,
    registerConfirmPassword,
    registerEmail,
    registerFullName,
    registerPassword,
    registerPhone,
    registerUsername,
    validateUsername,
    closeRegisterModal,
  ]);

  return {
    registerOpen,
    openRegisterModal,
    closeRegisterModal,
    registerFullName,
    setRegisterFullName,
    registerUsername,
    setRegisterUsername,
    registerEmail,
    setRegisterEmail,
    registerPhone,
    setRegisterPhone,
    registerPassword,
    setRegisterPassword,
    registerConfirmPassword,
    setRegisterConfirmPassword,
    registerError,
    setRegisterError,
    handleRegisterSubmit,
  };
}
