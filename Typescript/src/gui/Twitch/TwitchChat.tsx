import React, { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Button from '@mui/material/Button';
import type { TwitchChatProps } from './Twitch.types';

/** TwitchChat — stream chat panel (messages, text badges, input), theme-token styled. */
const TwitchChat: React.FC<TwitchChatProps> = ({
  messages, title = 'Stream chat', caption, placeholder = 'Send a message', onSend, readOnly = false,
  width = 340, height = 540, className, style, 'data-testid': dataTestId,
}) => {
  const t = useTheme();
  const [draft, setDraft] = useState('');
  const send = () => { const v = draft.trim(); if (!v) return; onSend?.(v); setDraft(''); };
  return (
    <Box className={['gui-twitch-chat', className].filter(Boolean).join(' ')} data-testid={dataTestId}
      sx={{ width, height, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
      style={style}>
      <Box sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Typography>
        {caption && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{caption}</Typography>}
      </Box>
      <Box role="log" sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {messages.map((m) => (
          <Typography key={m.id} variant="body2" component="div" sx={{ lineHeight: 1.5, wordBreak: 'break-word' }}>
            {m.time && <Box component="span" sx={{ color: 'text.disabled', mr: 0.75, fontSize: 11, fontFamily: 'monospace' }}>{m.time}</Box>}
            {m.badges?.map((b) => (
              <Box key={b} component="span" sx={{ display: 'inline-block', mr: 0.5, px: 0.5, fontSize: 10, fontWeight: 700, lineHeight: '16px', borderRadius: 0.5, border: 1, borderColor: 'text.secondary', color: 'text.secondary', verticalAlign: 'middle' }}>{b}</Box>
            ))}
            <Box component="span" sx={{ fontWeight: 700, color: m.color ?? 'text.primary' }}>{m.user}</Box>
            <Box component="span" sx={{ color: 'text.secondary' }}>: </Box>
            <span>{m.text}</span>
          </Typography>
        ))}
      </Box>
      {!readOnly && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <InputBase value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={placeholder} inputProps={{ 'aria-label': placeholder }}
            sx={{ flex: 1, px: 1.25, fontSize: 14, borderRadius: 1, bgcolor: alpha(t.palette.text.primary, 0.06) }} />
          <Button size="small" variant="contained" disableElevation onClick={send}>Chat</Button>
        </Box>
      )}
    </Box>
  );
};

export default TwitchChat;
