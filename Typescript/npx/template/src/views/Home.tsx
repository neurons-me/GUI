import { Box, Card, CardContent, Typography, Button, Progress } from 'this.gui/atoms';
import { useMeAction } from 'this.gui/react';
import { useSessionSurface } from 'this.gui/react';

const ROUTE_PATH = 'apps.__APP_ID__.route';

/**
 * The public surface — renders identically with or without a session.
 * "Sign in with .me" is a visible action here, not something that happens
 * for you: SessionSurface never auto-enters, so a first-time visitor always
 * sees this choice before anything is claimed on their behalf.
 */
export default function Home() {
  const { authenticated, handle, pending, error, enter } = useSessionSurface();
  const setRoute = useMeAction(ROUTE_PATH);

  return (
    <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 640 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        __APP_TITLE__
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        This is a semantic namespace, not a fixed set of pages. Anything written
        under <code>apps.__APP_ID__</code> becomes a space you can open, list,
        and grow — no table or view has to exist ahead of time.
      </Typography>

      <Card sx={{ maxWidth: 420 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {authenticated ? (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Entered as
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {handle}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Public data is visible without a session. Enter with `.me` to write.
              </Typography>
              {error && (
                <Typography variant="body2" sx={{ color: 'error.main' }}>
                  {error.message}
                </Typography>
              )}
              <Button variant="contained" onClick={enter} disabled={pending}>
                {pending ? <Progress kind="circular" size={16} /> : 'Sign in with .me'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => setRoute('admin')}>
        Open Admin
      </Button>
    </Box>
  );
}
