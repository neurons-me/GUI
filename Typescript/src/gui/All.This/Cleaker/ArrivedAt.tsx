// ArrivedAt.tsx -- "someone sent you to a place": the card a namespace's door shows when it is opened with `at=`.
//
// A QR.me carries `https://<namespace>/?at=<exact place>` (arrivalPlace.ts). The door shows where that is, in full,
// and takes the person there only when they choose to (never on its own: see arrivalPlace.ts). Dismissing it, or
// going, forgets it for this tab (the address bar was already cleaned when <Cleaker> took it).
import * as React from 'react';
import { Box, Typography } from '@/gui/Atoms';
import Button from '@/gui/Atoms/Button/Button';
import Icon from '@/gui/Atoms/Icon/Icon';
import { forgetArrival, type ArrivalPlace } from './arrivalPlace';

/** `place` is taken by <Cleaker> before the shell renders (arrivalPlace.ts takeArrival), so no label ever shows `?at=`. */
export default function ArrivedAt({ place: initial, nodeId = 'Cleaker.arrivedAt' }: { place: ArrivalPlace | null; nodeId?: string }) {
  const [place, setPlace] = React.useState<ArrivalPlace | null>(initial);
  if (!place) return null;
  const close = () => { forgetArrival(); setPlace(null); };
  return (
    <Box
      role="dialog"
      aria-label="A place was shared with you"
      data-gui-node-id={nodeId}
      data-arrival-url={place.url}
      sx={{
        position: 'fixed', zIndex: 1400, left: '50%', top: 72, transform: 'translateX(-50%)',
        width: 'min(560px, calc(100vw - 32px))', boxSizing: 'border-box',
        p: 2, borderRadius: 3, border: 1, borderColor: 'divider',
        bgcolor: 'background.paper', color: 'text.primary', boxShadow: 8,
        display: 'flex', flexDirection: 'column', gap: 1.25,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name="place" fontSize="1.2rem" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Someone shared a place with you</Typography>
        <Box component="button" type="button" onClick={close} aria-label="Dismiss" data-gui-node-id={`${nodeId}.dismiss`}
          sx={{ border: 0, background: 'none', color: 'text.secondary', cursor: 'pointer', p: 0.5, lineHeight: 0 }}>
          <Icon name="close" fontSize="1.1rem" />
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        It is on <Box component="strong" sx={{ color: 'text.primary' }}>{place.host}</Box>. Check it before you go:
      </Typography>
      <Box component="code" title={place.url} data-gui-node-id={`${nodeId}.place`}
        sx={{ display: 'block', p: 1, borderRadius: 1.5, bgcolor: 'action.hover', fontSize: '0.8rem', wordBreak: 'break-all', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {place.label}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        {place.openable ? (
          <Button
            variant="contained"
            size="small"
            component="a"
            href={place.url}
            rel="noopener noreferrer"
            onClick={() => forgetArrival()}
            data-gui-node-id={`${nodeId}.go`}
            // an <a>: without this it takes the theme's link colour, which can vanish on the button's own fill
            sx={{
              fontWeight: 700,
              '&, &:hover, &:visited': {
                color: (t: any) => t.palette.getContrastText(t.palette.primary.main),
                textDecoration: 'none',
              },
            }}
          >
            Go there
          </Button>
        ) : (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            A file opens only on the device that shared it.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
