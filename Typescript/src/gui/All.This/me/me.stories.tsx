import { useState } from 'react';
import { Box } from '@mui/material';
import Typography from '@/gui/Atoms/Typography/Typography';
import QRme from './QR/QR.me';
import Me from './me';
import { deriveIdentityRootHash } from './identity';

export default {
  title: 'All.This/.me',
  component: Me,
};

// ── Hello, I am .me ────────────────────────────────────────────────────────

function HelloMe() {
  const [username, setUsername] = useState('');
  const hash = username.trim() ? deriveIdentityRootHash(username.trim(), username.trim()) : null;
  const short = hash ? hash.slice(0, 10) + '…' + hash.slice(-8) : null;

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

      {/* Heading */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em', mb: 0.5 }}>
          Hello, I am <span style={{ opacity: 0.45 }}>.me</span>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Every identity is a derivation. Type a username to see yours.
        </Typography>
      </Box>

      {/* Input */}
      <Box sx={{ width: '100%', position: 'relative' }}>
        <Box
          component="input"
          value={username}
          onChange={e => setUsername((e.target as HTMLInputElement).value)}
          placeholder="username"
          spellCheck={false}
          autoComplete="off"
          autoFocus
          sx={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid', borderColor: username ? 'primary.main' : 'divider',
            borderRadius: 2, px: 2, py: 1.5,
            fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600,
            background: 'transparent', color: 'text.primary', outline: 'none',
            transition: 'border-color 0.2s ease',
            '&::placeholder': { color: 'text.disabled', fontWeight: 400 },
          }}
        />
      </Box>

      {/* Hash result */}
      {hash ? (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Namespace form */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.68rem' }}>
              namespace
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 600, mt: 0.25 }}>
              {username.trim()}<span style={{ opacity: 0.4 }}>.cleaker.me</span>
            </Typography>
          </Box>

          {/* Identity hash + QR */}
          <Box sx={{
            p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
            bgcolor: 'action.hover', display: 'flex', gap: 2, alignItems: 'center',
          }}>
            {/* QR encodes the full identityHash */}
            <Box sx={{ flexShrink: 0 }}>
              <QRme value={hash} username={username.trim()} variant="lg" hoverFlip clickFlip showAvatarLabel />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.68rem' }}>
                identityHash
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'primary.main', letterSpacing: '0.02em' }}>
                {short}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'text.disabled', wordBreak: 'break-all', lineHeight: 1.6 }}
              >
                {hash}
              </Typography>
            </Box>
          </Box>

          {/* NRP address */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.68rem' }}>
              me:// address
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.25, color: 'text.secondary' }}>
              me://cleaker.me/<strong>{username.trim()}</strong>
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
          your identity derives from your name
        </Typography>
      )}
    </Box>
  );
}

export const Default = () => <HelloMe />;
