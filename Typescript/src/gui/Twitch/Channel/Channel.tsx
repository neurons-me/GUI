import React, { useId, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import InputBase from '@mui/material/InputBase';
import TextField from '@mui/material/TextField';
import { TwitchGlitch, TwitchWordmark } from './TwitchMarks';
import type { ChannelPanel, ChannelProps, ChannelSection, ChannelWindowMode, ChannelProfile } from './Channel.types';

/* Structure ported from codex-me overlay/spiders.js (side panel), twitch-chat.js, kernel-graph.js,
   twitch-surface.js. Presentational: all data and callbacks come from props. */
const mono = { fontFamily: '"IBM Plex Mono", ui-monospace, monospace' };
const SECTIONS: ChannelSection[] = ['stream', 'channel', 'followers'];
const linkOf = (p: ChannelProfile) => p.url ?? `https://www.twitch.tv/${encodeURIComponent(p.login)}`;

function useControlled<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  return [value ?? inner, (v: T) => { if (value === undefined) setInner(v); onChange?.(v); }];
}

function Note({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <Typography role={error ? 'alert' : 'status'} sx={{ fontSize: 12, color: error ? 'error.main' : 'text.secondary', lineHeight: 1.5 }}>{children}</Typography>;
}

function IconBtn({ label, d, onClick }: { label: string; d: string; onClick: () => void }) {
  return (
    <Tooltip title={label} arrow>
      <Button size="small" aria-label={label} onClick={onClick} sx={{ minWidth: 28, px: 0.5, color: 'inherit' }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden><path d={d} /></svg>
      </Button>
    </Tooltip>
  );
}

/** Profile card (codex-me TwitchProfile): avatar, display name, @login.twitch, glitch "Open in Twitch". */
function Profile({ profile, sel, select }: { profile: ChannelProfile; sel?: string; select: (p: string) => void }) {
  const name = profile.displayName || profile.login, link = linkOf(profile);
  const on = (f: string) => ({ 'aria-pressed': sel === `twitch.profile.${f}`, onClick: () => select(`twitch.profile.${f}`) });
  return (
    <Box data-twitch-profile={profile.login} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, mb: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
      <Button {...on('profileImageUrl')} aria-label="Inspect profile image" sx={{ p: 0, minWidth: 0, borderRadius: '50%', flexShrink: 0 }}>
        <Avatar src={profile.profileImageUrl} alt={`${profile.login}'s Twitch profile`} imgProps={{ referrerPolicy: 'no-referrer' }}
          sx={{ width: 44, height: 44, bgcolor: '#9146ff', color: '#fff', ...mono }}>{profile.login.slice(0, 1).toUpperCase()}</Avatar>
      </Button>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Button {...on('displayName')} aria-label="Inspect profile display name" sx={{ ...mono, display: 'block', p: 0, minWidth: 0, maxWidth: '100%', textTransform: 'none', textAlign: 'left', color: sel === 'twitch.profile.displayName' ? 'primary.main' : 'text.primary', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Button>
        <Typography component="a" href={link} target="_blank" rel="noopener noreferrer"
          sx={{ ...mono, fontSize: 11, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>@{profile.login}.twitch</Typography>
      </Box>
      <Tooltip title="Open in Twitch" describeChild arrow>
        <Box component="a" href={link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${profile.login} on Twitch`} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}><TwitchGlitch /></Box>
      </Tooltip>
    </Box>
  );
}

/** Channel — the codex-me Twitch side panel as a presentational .GUI component. */
const Channel: React.FC<ChannelProps> = (props) => {
  const {
    profile, messages = [], stream, channel, followers, sectionState = {}, onSend, chatPlaceholder = 'Send a message', readOnly = false,
    onSelect, selectedPath, inspector, obs, face, caption, hideWindowControls = false,
    width = 360, height = 560, className, style, 'data-testid': dataTestId,
  } = props;
  const t = useTheme();
  const prefix = useId();
  const [section, setSection] = useControlled<ChannelSection>(props.section, props.defaultSection ?? 'stream');
  const [panel, setPanel] = useControlled<ChannelPanel>(props.panel, props.defaultPanel ?? 'chat', props.onPanelChange);
  const [mode, setMode] = useControlled<ChannelWindowMode>(props.mode, props.defaultMode ?? 'docked', props.onModeChange);
  const [lastExpanded, setLastExpanded] = useState<ChannelWindowMode>(mode === 'minimized' ? 'docked' : mode);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const collapsed = mode === 'minimized';
  const select = (p: string) => { const s = p.split('.')[1] as ChannelSection; if (SECTIONS.includes(s)) setSection(s); onSelect?.(p); };
  const changeMode = (m: ChannelWindowMode) => { if (m !== 'minimized') setLastExpanded(m); setMode(m); };
  const send = () => { const v = draft.trim(); if (!v) return; onSend?.(v); setDraft(''); };
  const choose = (p: ChannelPanel) => { setPanel(p); setMenuOpen(false); };
  const settings = ([['inspector', 'Inspector', true], ['obs', 'OBS', !!obs], ['camera', 'Face tracking', !!face]] as [ChannelPanel, string, boolean][]).filter((x) => x[2]);
  const pick = (f: string) => ({ 'aria-pressed': selectedPath === `twitch.${section}.${f}`, onClick: () => select(`twitch.${section}.${f}`) });
  const hl = (f: string, base = 'text.primary') => (selectedPath === `twitch.${section}.${f}` ? 'primary.main' : base);
  const plain = { p: 0, minWidth: 0, textTransform: 'none' as const, justifyContent: 'flex-start', textAlign: 'left' as const };

  const surface = () => {
    const st = sectionState[section];
    if (st?.error) return <Note error>{st.error}</Note>;
    if (section === 'stream') {
      if (!stream) return <Note>Loading Twitch data…</Note>;
      return (
        <Box data-twitch-surface="stream" sx={{ display: 'grid', gap: 1.25 }}>
          <Button {...pick('live')} aria-label="Inspect stream status" sx={{ ...plain, display: 'flex', alignItems: 'center', gap: 1, color: hl('live') }}>
            <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stream.live ? 'success.main' : 'text.disabled' }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{stream.live ? 'Live now' : 'Offline'}</Typography>
          </Button>
          {(['title', 'category', 'viewers'] as const).filter((f) => stream[f] != null && stream[f] !== '').map((f) => (
            <Button key={f} {...pick(f)} aria-label={`Inspect stream ${f}`} sx={{ ...plain, display: 'block', fontSize: f === 'title' ? 15 : 12, overflowWrap: 'anywhere', color: hl(f, f === 'title' ? 'text.primary' : 'text.secondary') }}>
              {f === 'viewers' ? `${(stream.viewers as number).toLocaleString('en')} viewers` : stream[f]}
            </Button>
          ))}
          {stream.startedAt && <Button {...pick('startedAt')} aria-label="Inspect stream start time" sx={{ ...plain, fontSize: 12, color: hl('startedAt', 'text.secondary') }}>Started {new Date(stream.startedAt).toLocaleString()}</Button>}
        </Box>
      );
    }
    if (section === 'channel') {
      if (!channel) return <Note>Loading Twitch data…</Note>;
      const fp = { size: 'small' as const, fullWidth: true, variant: 'outlined' as const, InputLabelProps: { shrink: true }, InputProps: { readOnly: true } };
      return (
        <Box data-twitch-surface="channel" aria-label="Channel settings" sx={{ display: 'grid', gap: 1.75, pt: 0.5 }}>
          <TextField {...fp} label="Title" value={channel.title} placeholder="No title set" focused={selectedPath === 'twitch.channel.title' || undefined} onClick={() => select('twitch.channel.title')} />
          <TextField {...fp} label="Category" value={channel.category} placeholder="No category set" focused={selectedPath === 'twitch.channel.category' || undefined} onClick={() => select('twitch.channel.category')} />
          <TextField {...fp} label="Language" value={channel.language || 'Not set'} focused={selectedPath === 'twitch.channel.language' || undefined} onClick={() => select('twitch.channel.language')} />
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: -1 }}>Tags</Typography>
          <Button {...pick('tags')} aria-label="Inspect channel tags" sx={{ ...plain, display: 'flex', flexWrap: 'wrap', gap: 0.75, color: 'text.primary' }}>
            {channel.tags.length ? channel.tags.map((tag) => <Box key={tag} component="span" sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'action.hover', fontSize: 12 }}>{tag}</Box>) : <Note>No tags set</Note>}
          </Button>
        </Box>
      );
    }
    if (!followers) return <Note>Loading Twitch data…</Note>;
    return (
      <Box data-twitch-surface="followers" sx={{ py: 2, textAlign: 'center' }}>
        <Button {...pick('total')} aria-label="Inspect follower count" sx={{ fontSize: 44, lineHeight: 1.2, fontWeight: 600, p: 0, minWidth: 0, color: hl('total'), '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>{followers.total.toLocaleString('en')}</Button>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{followers.total === 1 ? 'Follower' : 'Followers'}</Typography>
      </Box>
    );
  };

  const floating = mode !== 'docked';
  return (
    <Box component="aside" aria-label="Side panel" data-panel-mode={mode} data-testid={dataTestId} className={['gui-twitch-channel', className].filter(Boolean).join(' ')} style={style}
      sx={{ width, height: collapsed ? 'auto' : height, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', color: 'text.primary', borderLeft: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden',
        ...(floating ? { border: 1, borderRadius: '8px 8px 0 0', boxShadow: 8, minHeight: collapsed ? 48 : 280 } : {}) }}>
      {/* Header: Twitch wordmark (chat), channel avatar/@login, Settings, window controls */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5, p: 1, borderBottom: collapsed ? 0 : 1, borderColor: 'divider' }}>
        <Button size="small" variant={panel === 'chat' ? 'outlined' : 'text'} onClick={() => choose('chat')} aria-label="Twitch" aria-pressed={panel === 'chat'} sx={{ ...mono, minHeight: 32, color: 'text.primary', borderColor: 'divider' }}>
          <TwitchWordmark width={52} />
        </Button>
        {profile ? (
          <Box data-chat-profile={profile.login} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
            <Avatar src={profile.profileImageUrl} alt={`${profile.login}'s Twitch profile`} sx={{ width: 22, height: 22, fontSize: 11 }}>{profile.login[0]}</Avatar>
            <Typography component="a" href={linkOf(profile)} target="_blank" rel="noopener noreferrer" title="Open in Twitch"
              sx={{ ...mono, fontSize: 12, color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{profile.login}</Typography>
          </Box>
        ) : <Box sx={{ flex: 1 }} />}
        <Tooltip title="Settings" arrow>
          <Button size="small" aria-label="Settings" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} sx={{ minWidth: 28, px: 0.5, color: panel !== 'chat' ? 'primary.main' : 'inherit' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z" /><circle cx={12} cy={12} r={3} /></svg>
          </Button>
        </Tooltip>
        {!hideWindowControls && <>
          <IconBtn label={mode === 'docked' ? 'Float panel' : 'Dock panel'} onClick={() => changeMode(mode === 'docked' ? 'floating' : 'docked')} d={mode === 'docked' ? 'M8 4H4v16h16v-4M12 4h8v8M20 4L10 14' : 'M4 4h16v16H4zM15 4v16'} />
          <IconBtn label={collapsed ? 'Restore panel' : 'Minimize panel'} onClick={() => changeMode(collapsed ? lastExpanded : 'minimized')} d={collapsed ? 'M5 15l7-7 7 7' : 'M5 18h14'} />
        </>}
        {menuOpen && (
          <Box role="menu" aria-label="Panel settings" sx={{ position: 'absolute', zIndex: 2, right: 8, top: 48, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, boxShadow: 6, p: 0.5, display: 'flex', flexDirection: 'column', minWidth: 140 }}>
            {settings.map(([p, label]) => <Button key={p} role="menuitem" onClick={() => choose(p)} sx={{ justifyContent: 'flex-start' }}>{label}</Button>)}
          </Box>
        )}
      </Box>
      {caption && !collapsed && <Box sx={{ px: 1.5, py: 0.5, borderBottom: 1, borderColor: 'divider' }}><Typography variant="caption" sx={{ ...mono, color: 'text.secondary' }}>{caption}</Typography></Box>}

      <Box id={`${prefix}-content`} sx={{ display: collapsed ? 'none' : 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {face !== undefined && <Box sx={{ display: panel === 'camera' ? 'block' : 'none', flex: 1, minHeight: 0, overflowY: 'auto' }}>{face}</Box>}
        {panel === 'obs' && <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{obs}</Box>}
        {panel === 'chat' && (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box role="log" aria-label={profile ? `${profile.login} Twitch chat` : 'Twitch chat'} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {messages.length === 0 && <Note>No messages yet.</Note>}
              {messages.map((m) => (
                <Typography key={m.id} variant="body2" component="div" sx={{ lineHeight: 1.5, wordBreak: 'break-word', fontSize: 13 }}>
                  {m.time && <Box component="span" sx={{ ...mono, color: 'text.disabled', mr: 0.75, fontSize: 11 }}>{m.time}</Box>}
                  {m.badges?.map((b) => <Box key={b} component="span" sx={{ display: 'inline-block', mr: 0.5, px: 0.5, fontSize: 10, fontWeight: 700, lineHeight: '16px', borderRadius: 0.5, border: 1, borderColor: 'text.secondary', color: 'text.secondary', verticalAlign: 'middle' }}>{b}</Box>)}
                  <Box component="span" sx={{ fontWeight: 700, color: m.color ?? 'text.primary' }}>{m.user}</Box>
                  <Box component="span" sx={{ color: 'text.secondary' }}>: </Box>
                  <span>{m.text}</span>
                </Typography>
              ))}
            </Box>
            {!readOnly && onSend && (
              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
                <InputBase value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder={chatPlaceholder}
                  inputProps={{ 'aria-label': chatPlaceholder }} sx={{ flex: 1, px: 1.25, fontSize: 13, borderRadius: 1, bgcolor: alpha(t.palette.text.primary, 0.06) }} />
                <Button size="small" variant="contained" disableElevation onClick={send}>Chat</Button>
              </Box>
            )}
          </Box>
        )}
        {panel === 'inspector' && (
          <Box sx={{ p: 2, overflowY: 'auto', flex: 1, minHeight: 0, '& [aria-pressed="true"]': { outline: '1px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}>
            {profile ? <>
              <Profile profile={profile} sel={selectedPath} select={select} />
              <Box role="tablist" aria-label="Twitch sections" sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
                {SECTIONS.map((name, i) => (
                  <Button key={name} role="tab" id={`${prefix}-${name}`} aria-selected={section === name} tabIndex={section === name ? 0 : -1} onClick={() => select(`twitch.${name}`)}
                    onKeyDown={(e) => {
                      const n = e.key === 'ArrowRight' ? (i + 1) % 3 : e.key === 'ArrowLeft' ? (i + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : null;
                      if (n === null) return; e.preventDefault(); select(`twitch.${SECTIONS[n]}`);
                      (e.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[n] as HTMLElement | undefined)?.focus();
                    }}
                    sx={{ ...mono, fontSize: 11, px: 0.25, minWidth: 0, textTransform: 'none', borderRadius: 0, borderBottom: 2, borderColor: section === name ? 'primary.main' : 'transparent', color: section === name ? 'text.primary' : 'text.secondary' }}>
                    {name[0].toUpperCase() + name.slice(1)}
                  </Button>
                ))}
              </Box>
              <Box role="tabpanel" aria-labelledby={`${prefix}-${section}`}>{surface()}</Box>
              {inspector && <Box sx={{ mt: 2 }}>{inspector}</Box>}
            </> : <Typography role="status" sx={{ ...mono, fontSize: 14, color: 'text.secondary' }}>Select a node</Typography>}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Channel;
