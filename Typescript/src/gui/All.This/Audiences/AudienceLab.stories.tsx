// The Audience Lab. Needs local ledgers (`npm run lab:ledgers`) and a this.me that exposes the audience algebra
// (`THIS_ME_SRC=../../me-export-audience/Typescript/index.ts npm run storybook`).
import type { Meta, StoryObj } from '@storybook/react';
import Theme from '@/gui/Theme/Theme';
import AudienceLab from './AudienceLab';
import AudienceCircles from './AudienceCircles';

const meta: Meta = { title: 'All.This/Audiences', parameters: { layout: 'fullscreen' } };
export default meta;

export const Lab: StoryObj = {
  render: () => (
    <Theme>
      <AudienceLab />
    </Theme>
  ),
};

// The drawing alone, with a fixed result: no ledgers, no keys. What the lab's circles are made of.
export const Circles: StoryObj = {
  render: () => (
    <Theme>
      <div style={{ maxWidth: 640, margin: '24px auto', padding: 16 }}>
        <AudienceCircles
          ledgers={[{ id: 'A', root: 'a-test.local' }, { id: 'B', root: 'b-test.local' }, { id: 'C', root: 'c-test.local' }]}
          parties={[
            { id: 'ana', ledgers: ['A', 'B'] }, { id: 'bob', ledgers: ['A'] }, { id: 'carol', ledgers: ['B', 'C'] },
            { id: 'robot', ledgers: ['A', 'B', 'C'] }, { id: 'dave', ledgers: [] },
          ]}
          coalitions={[['ana', 'bob'], ['carol']]}
          writtenIn="A"
          epoch={1}
        />
      </div>
    </Theme>
  ),
};
