import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Channel from './Channel';
import type { ChannelProps } from './Channel.types';
import { SAMPLE_CHAT, SAMPLE_PROFILE, SAMPLE_STREAM, SAMPLE_CHANNEL, SAMPLE_FOLLOWERS } from '../sampleData';

const Slot = ({ label }: { label: string }) => (
  <Box sx={{ p: 2 }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>{label} slot (supplied by the host app)</Typography></Box>
);

/** Story wrapper: local chat state so onSend appends (example only, nothing leaves the page). */
export function ExampleChannel(props: Partial<ChannelProps>) {
  const [msgs, setMsgs] = useState(SAMPLE_CHAT);
  const [path, setPath] = useState<string>('twitch.stream');
  return (
    <Channel profile={SAMPLE_PROFILE} messages={msgs} stream={SAMPLE_STREAM} channel={SAMPLE_CHANNEL} followers={SAMPLE_FOLLOWERS}
      caption="Example data — not live Twitch" selectedPath={path} onSelect={setPath}
      onSend={(text) => setMsgs((m) => [...m, { id: String(m.length + 1), user: 'you', text }])}
      obs={<Slot label="OBS" />} face={<Slot label="Face tracking" />} inspector={<Slot label="Inspector (kernel tree / console)" />}
      {...props} />
  );
}

