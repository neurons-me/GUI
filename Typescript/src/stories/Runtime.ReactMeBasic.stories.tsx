import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import type { Meta, StoryObj } from '@storybook/react';
import ME from 'this.me';

import * as GUI from '../../index';
import Theme from '@/gui/Theme/Theme';
import Me from '@/gui/All.This/me/me';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Paper,
  Typography,
} from '@/gui/Atoms';
import { Stack } from '@/gui/Molecules';
import { MeRuntimeProvider, useMeAction, useMeValue } from '@/react-entry';
import { createMeRuntime, mount, writeMeValue } from '@/runtime-entry';

function ReactBridgePanel({
  me,
  runtime,
}: {
  me: any;
  runtime: ReturnType<typeof createMeRuntime>;
}) {
  const name = useMeValue<string>('name');
  const status = useMeValue<string>('status');
  const count = useMeValue<number>('metrics.count');
  const setStatus = useMeAction('status', { allowCanonicalWrite: true });
  const setCount = useMeAction('metrics.count');

  return (
    <Card variant="outlined">
      <CardHeader
        title="React Bridge"
        subheader="Hooks and the official .me field stay aligned with the same runtime."
      />
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip label={`name: ${name || '-'}`} size="small" />
            <Chip
              label={`status: ${status || '-'}`}
              size="small"
              color={status === 'online' ? 'success' : 'warning'}
            />
            <Chip
              label={`count: ${typeof count === 'number' ? count : '-'}`}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <Button
              variant="contained"
              onClick={() => setStatus(status === 'online' ? 'reviewing' : 'online')}
            >
              Toggle Status
            </Button>
            <Button
              variant="outlined"
              onClick={() => setCount((Number(count) || 0) + 1)}
            >
              Increment Count
            </Button>
            <Button
              variant="text"
              onClick={() => {
                writeMeValue(me, 'name', 'Changed from host');
                runtime.notify?.('name');
              }}
            >
              Host Write + Notify
            </Button>
          </Stack>

          <Divider />

          <Me
            label=".me Name"
            path="name"
            description="Commit mode field backed by the shared runtime."
            mode="commit"
          />

          <Me
            label=".me Count"
            path="metrics.count"
            description="Live mode number field with explicit coercion."
            mode="live"
            type="number"
            coerce="number"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function MountedSpecPanel({
  me,
  runtime,
}: {
  me: any;
  runtime: ReturnType<typeof createMeRuntime>;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!hostRef.current) return undefined;

    const spec = {
      type: 'Page',
      props: {
        title: 'Mounted Spec',
        subtitle: 'Same .me kernel, same runtime, mounted through this.gui/runtime.',
      },
      children: [
        {
          type: 'Paper',
          props: {
            variant: 'outlined',
            sx: {
              p: 2,
              display: 'grid',
              gap: 1.5,
              borderRadius: 3,
            },
          },
          children: [
            {
              type: 'Typography',
              props: {
                variant: 'overline',
                children: 'Mounted spec runtime',
              },
            },
            {
              type: 'Typography',
              props: {
                variant: 'h4',
                children: { read: 'me/profile/name' },
              },
            },
            {
              type: 'Typography',
              props: {
                variant: 'body1',
                children: { read: 'me/profile/status' },
              },
            },
            {
              type: 'Typography',
              props: {
                variant: 'body2',
                children: { read: 'me/metrics/count' },
              },
            },
            {
              type: 'Button',
              props: {
                label: 'Set Reviewing from Spec',
                variant: 'contained',
                onClick: { write: "me/profile/status = 'reviewing'" },
              },
            },
          ],
        },
      ],
    };

    const mounted = mount(spec, hostRef.current, {
      gui: GUI,
      React,
      ReactDOM,
      me,
      runtime,
      devtools: {
        inspector: false,
        inspectorToggleVisible: true,
        adminView: false,
      },
    });

    return () => mounted.unmount();
  }, [me, runtime]);

  return (
    <Card variant="outlined">
      <CardHeader
        title="Mounted Spec"
        subheader="Declarative spec rendered by mount() with opt-in devtools."
      />
      <CardContent>
        <Box
          ref={hostRef}
          sx={{
            minHeight: 320,
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        />
      </CardContent>
    </Card>
  );
}

function RuntimeReactMeBasicDemo() {
  const demo = React.useMemo(() => {
    const me = new ME();
    writeMeValue(me, 'name', 'Ana Runtime');
    writeMeValue(me, 'status', 'online');
    writeMeValue(me, 'metrics.count', 3);
    const runtime = createMeRuntime(me);
    return { me, runtime };
  }, []);

  return (
    <Theme>
      <MeRuntimeProvider me={demo.me} runtime={demo.runtime}>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            p: { xs: 2, md: 4 },
          }}
        >
          <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              <Stack spacing={1.25}>
                <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
                  Runtime / React + .me Basic
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 780, opacity: 0.78 }}>
                  Canonical smoke test for the modern runtime: one shared `.me` kernel, one shared
                  runtime, React hooks on one side, and a spec mounted with `this.gui/runtime` on
                  the other.
                </Typography>
              </Stack>
            </Paper>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', xl: '0.92fr 1.08fr' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              <ReactBridgePanel me={demo.me} runtime={demo.runtime} />
              <MountedSpecPanel me={demo.me} runtime={demo.runtime} />
            </Box>
          </Box>
        </Box>
      </MeRuntimeProvider>
    </Theme>
  );
}

const meta = {
  title: 'Runtime/React + .me Basic',
  component: RuntimeReactMeBasicDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof RuntimeReactMeBasicDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <RuntimeReactMeBasicDemo />,
};
