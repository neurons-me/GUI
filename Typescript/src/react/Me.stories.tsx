// <Me> — the contract, on one page. It draws nothing, so each row is a probe: the exact JSX on the left, what a
// component under it reads from the `.me` on the right. The play function checks every row.
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import ME from 'this.me';
import Theme from '@/gui/Theme/Theme';
import { Box, Typography } from '@/gui/Atoms';
import { Me } from './Me';
import { useOptionalMe } from './useMe';
import { readMeNamespace, readMeNamedNamespace, readMeUsername } from './meNamespace';

const meta: Meta = { title: 'All.This/Me', component: Me, parameters: { layout: 'padded' } };
export default meta;

function Reading({ id }: { id: string }) {
  const found = useOptionalMe();
  const fields: Array<[string, string]> = [
    ['root', readMeNamespace(found?.me)],
    ['username', readMeUsername(found?.me)],
    ['named', readMeNamedNamespace(found?.me)],
    ['transport', found?.transport ?? ''],
  ];
  return (
    <Box data-testid={`${id}.reading`} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.25, fontFamily: 'monospace', fontSize: 13 }}>
      {fields.map(([name, value]) => (
        <React.Fragment key={name}>
          <span style={{ opacity: 0.55 }}>{name}</span>
          <span data-testid={`${id}.${name}`}>{value || '—'}</span>
        </React.Fragment>
      ))}
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

const existing = new (ME as any)('verify-user', 'verify-throwaway-secret', { namespace: 'disposable-test.local' });

const ROWS: Array<{ id: string; code: string; note: string; render: (probe: React.ReactElement) => React.ReactElement }> = [
  { id: 'root', code: '<Me namespace="cleaker.me">', note: 'a namespace is enough: the .me carries only that', render: (p) => <Me namespace="cleaker.me">{p}</Me> },
  { id: 'named', code: '<Me username="Ana" namespace="cleaker.me">', note: 'the handle is normalized and named inside the root; it proves nothing about who is here', render: (p) => <Me username="Ana" namespace="cleaker.me">{p}</Me> },
  { id: 'one-label', code: '<Me username="ana" namespace="localhost">', note: 'a gateway can serve a single-label root', render: (p) => <Me username="ana" namespace="localhost">{p}</Me> },
  { id: 'transport', code: '<Me namespace="localhost" transport="http://localhost/apps/netget">', note: 'where it is reached, when that is not the namespace itself', render: (p) => <Me namespace="localhost" transport="http://localhost/apps/netget">{p}</Me> },
  { id: 'handle-only', code: '<Me username="ana">', note: 'a handle with no root names nothing', render: (p) => <Me username="ana">{p}</Me> },
  { id: 'existing', code: '<Me me={kernel}>', note: 'a .me that already exists, read as it is', render: (p) => <Me me={existing}>{p}</Me> },
  { id: 'both', code: '<Me me={kernel} namespace="cleaker.me">', note: 'two sources for one .me: an error, not a precedence rule', render: (p) => <Me me={existing} namespace="cleaker.me">{p}</Me> },
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
    expect(text('root.root')).toBe('cleaker.me');
    expect(text('root.username')).toBe('—');
    expect(text('named.username')).toBe('ana');
    expect(text('named.named')).toBe('ana.cleaker.me');
    expect(text('one-label.named')).toBe('ana.localhost');
    expect(text('transport.transport')).toBe('http://localhost/apps/netget');
    expect(text('handle-only.username')).toBe('ana');
    expect(text('handle-only.named')).toBe('—');
    expect(text('existing.root')).toBe('disposable-test.local');
    expect(c.getByTestId('both.error').textContent).toMatch(/either `me` or `namespace` \/ `username`, not both/);
  },
};
