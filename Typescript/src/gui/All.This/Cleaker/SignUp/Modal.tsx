//this/GUI/npm/src/gui/All.This/Cleaker/SignUp/Modal.tsx
//this/GUI/npm/src/gui/All.This/Cleaker/SignUp/Modal.tsx
import React from 'react';
import Box from '@/gui/Atoms/Box/Box';
import Button from '@/gui/Atoms/Button/Button';
import TextField from '@/gui/Atoms/TextField/TextField';
import Modal from '@/gui/Molecules/Modal/Modal';

export type CleakerSignUpModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  authStatus: string;
  registerError: string | null;
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
  namespaceSeedHandle: string;
  nodeAttrs?: (segment: string, component: string) => Record<string, unknown>;
};

function emptyNodeAttrs(): Record<string, unknown> {
  return {};
}

export default function CleakerSignUpModal(props: CleakerSignUpModalProps) {
  const {
    open,
    onClose,
    onSubmit,
    authStatus,
    registerError,
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
    namespaceSeedHandle,
    nodeAttrs = emptyNodeAttrs,
  } = props;

  return (
    <Modal open={open} onClose={onClose} title="Sign Up" width={460}>
      <Box
        {...nodeAttrs('register-form', 'Cleaker.RegisterForm')}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}
      >
        <TextField
          {...nodeAttrs('register-username', 'Cleaker.RegisterUsername')}
          label="Username"
          helperText={namespaceSeedHandle
            ? `Use only the handle. Example: jabellae, not jabellae.${namespaceSeedHandle}`
            : 'Use only the handle. Example: jabellae'}
          placeholder="jabellae"
          value={registerUsername}
          onChange={(e) => setRegisterUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          fullWidth
        />

        <TextField
          {...nodeAttrs('register-full-name', 'Cleaker.RegisterFullName')}
          label="Full Name"
          placeholder="Sui Abella"
          helperText="Your full name as it will appear in the profile."
          value={registerFullName}
          onChange={(e) => setRegisterFullName(e.target.value)}
          autoComplete="name"
          fullWidth
        />

        <TextField
          {...nodeAttrs('register-email', 'Cleaker.RegisterEmail')}
          label="Email"
          helperText="We'll store this on the claim as your contact email."
          value={registerEmail}
          onChange={(e) => setRegisterEmail(e.target.value)}
          autoComplete="email"
          fullWidth
        />

        <TextField
          {...nodeAttrs('register-phone', 'Cleaker.RegisterPhone')}
          label="Phone Number"
          helperText="We'll store this on the claim as your contact phone."
          value={registerPhone}
          onChange={(e) => setRegisterPhone(e.target.value)}
          autoComplete="tel"
          fullWidth
        />

        <TextField
          {...nodeAttrs('register-password', 'Cleaker.RegisterPassword')}
          label="Password"
          type="password"
          value={registerPassword}
          onChange={(e) => setRegisterPassword(e.target.value)}
          autoComplete="new-password"
          fullWidth
        />

        <TextField
          {...nodeAttrs('register-confirm-password', 'Cleaker.RegisterConfirmPassword')}
          label="Confirm Password"
          type="password"
          value={registerConfirmPassword}
          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
          autoComplete="new-password"
          fullWidth
        />

        {registerError ? (
          <Box
            {...nodeAttrs('register-error', 'Cleaker.RegisterError')}
            sx={{ fontSize: '11px', lineHeight: 1.35, color: 'error.main' }}
          >
            {registerError}
          </Box>
        ) : null}

        <Box
          {...nodeAttrs('register-actions', 'Cleaker.RegisterActions')}
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}
        >
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void onSubmit()} disabled={authStatus === 'checking'}>
            Sign Up
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}