import { Typography, Button } from 'this.gui/atoms';
import { Hero, Stack } from 'this.gui/molecules';
import { useMeAction } from 'this.gui/react';

const ROUTE_PATH = 'apps.__APP_ID__.route';

/**
 * The public surface — renders identically with or without a session.
 * Signing in is not here: the `.me` bubble in the left rail offers it, and
 * SessionSurface never enters on its own, so nothing is claimed on a
 * visitor's behalf. "Get started" opens the Admin view (the Spaces explorer),
 * which gates its own content on a session.
 */
export default function Home() {
  const setRoute = useMeAction(ROUTE_PATH);

  return (
    <Hero height="100vh" mode="left" padding={{ xs: 3, md: 8 }} contentMaxWidth={680}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h1">__APP_TITLE__</Typography>
        <Typography variant="h5">Powered by .me</Typography>
        <Button variant="contained" size="large" onClick={() => setRoute('admin')}>
          Get started
        </Button>
      </Stack>
    </Hero>
  );
}
