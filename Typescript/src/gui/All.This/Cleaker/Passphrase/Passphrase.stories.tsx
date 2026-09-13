import type { Meta } from '@storybook/react';
import { useState } from 'react';
import Theme from '@/gui/Theme/Theme';
import Passphrase from './Passphrase';

// Isolated so it can be iterated on visually before it's wired into the
// registration/recovery flows in CleakerLanding — see RegisterMe.tsx for
// the sibling "own page, own story" pattern this follows.
const meta: Meta<typeof Passphrase> = {
  title: 'All.This/Cleaker/Passphrase',
  component: Passphrase,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

// Official BIP-39 test vector (entropy = 0x00…00) — real wordlist words,
// not placeholder text, so the layout is judged on real content.
const SAMPLE_WORDS = [
  'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'abandon',
  'abandon', 'abandon', 'abandon', 'abandon', 'abandon', 'about',
];

export const Reveal = () => (
  <Theme>
    <Passphrase mode="reveal" words={SAMPLE_WORDS} />
  </Theme>
);

export const RevealConfirmed = () => (
  <Theme>
    <Passphrase mode="reveal" words={SAMPLE_WORDS} confirmed />
  </Theme>
);

export const Input = () => (
  <Theme>
    <Passphrase mode="input" />
  </Theme>
);

export const InputWithError = () => {
  const [value, setValue] = useState<string[]>(SAMPLE_WORDS.slice(0, 6).concat(Array(6).fill('')));
  return (
    <Theme>
      <Passphrase
        mode="input"
        value={value}
        onChange={setValue}
        error="That phrase doesn't match a known identity."
      />
    </Theme>
  );
};
