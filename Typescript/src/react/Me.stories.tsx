// <Me> — the contract, on one page. It draws nothing, so each row is a probe: the exact JSX on the left, what a component
// under it reads from the `.me` on the right. The play function checks every row. A `.me` says nothing about namespaces:
// those are links made from outside it (<Cleaker namespace>).
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import ME from 'this.me';
import Theme from '@/gui/Theme/Theme';
import { Box, Typography } from '@/gui/Atoms';
import { Me } from './Me';
import { useOptionalMe } from './useMe';
import { readMeUsername, writeMeUsername } from './meIdentity';

const meta: Meta = { title: 'All.This/Me', component: Me, parameters: { layout: 'padded' } };
export default meta;

function Reading({ id }: { id: string }) {
  const found = useOptionalMe();
  return (
    <Box data-testid={`${id}.reading`} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, fontFamily: 'monospace', fontSize: 13 }}>
      <span style={{ opacity: 0.55 }}>found</span>
      <span data-testid={`${id}.found`}>{found ? 'yes' : 'no'}</span>
      <span style={{ opacity: 0.55 }}>username</span>
      <span data-testid={`${id}.username`}>{readMeUsername(found?.me) || '—'}</span>
    </Box>
  );
}

class Catch extends React.Component<{ id: string; children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Box data-testid={`${this.props.id}.error`} sx={{ fontFamily: 'monospace', fontSize: 13, color: 'error.main' }}>
          throws: {this.state.error.message}
        </Box>
      );
    }
    return this.props.children;
  }
}

const existing: any = new (ME as any)();
writeMeUsername(existing, 'robot-1');

const ROWS: Array<{ id: string; code: string; note: string; render: (probe: React.ReactElement) => React.ReactElement }> = [
  { id: 'bare', code: '<Me>', note: 'a local runtime: made here, no handle, no permission, no network', render: (p) => <Me>{p}</Me> },
  { id: 'handle', code: '<Me username="Ana">', note: 'the handle is normalized; it proves nothing about who is here', render: (p) => <Me username="Ana">{p}</Me> },
  { id: 'existing', code: '<Me me={kernel}>', note: 'a .me that already exists, provided as it is', render: (p) => <Me me={existing}>{p}</Me> },
  { id: 'through', code: '<Me username="outer"><Me me={null}>', note: 'null provides nothing here: what sits above passes through', render: (p) => <Me username="outer"><Me me={null}>{p}</Me></Me> },
  { id: 'both', code: '<Me me={kernel} username="ana">', note: 'two sources for one .me: an error, not a precedence rule', render: (p) => <Me me={existing} username="ana">{p}</Me> },
  { id: 'none', code: '(no <Me>)', note: 'nothing is found, nothing is invented', render: (p) => p },
];

export const Contract: StoryObj = {
  render: () => (
    <Theme>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 760 }}>
        {ROWS.map((row) => (
          <Box key={row.id} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 3, alignItems: 'start' }}>
            <Box>
              <Typography component="code" sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.code}</Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.65, mt: 0.5 }}>{row.note}</Typography>
            </Box>
            <Catch id={row.id}>{row.render(<Reading id={row.id} />)}</Catch>
          </Box>
        ))}
      </Box>
    </Theme>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const c = within(canvasElement);
    const text = (id: string) => c.getByTestId(id).textContent;
    expect(text('bare.found')).toBe('yes');
    expect(text('bare.username')).toBe('—');
    expect(text('handle.username')).toBe('ana');
    expect(text('existing.username')).toBe('robot-1');
    expect(text('through.username')).toBe('outer');
    expect(c.getByTestId('both.error').textContent).toMatch(/either `me` or `username`, not both/);
    expect(text('none.found')).toBe('no');
  },
};
