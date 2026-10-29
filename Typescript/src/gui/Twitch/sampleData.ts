import type { ChannelChatMessage, ChannelProfile, ChannelStream, ChannelSettings, ChannelFollowers } from './Channel/Channel.types';

/** EXAMPLE DATA ONLY — fictional channel, users and messages for stories. Not live Twitch data. */
export const SAMPLE_CHAT: ChannelChatMessage[] = [
  { id: '1', time: '13:01', user: 'example_mod', badges: ['MOD'], text: 'Welcome in. Sample chat, not live data.' },
  { id: '2', time: '13:01', user: 'viewer_one', text: 'the overlay looks clean today' },
  { id: '3', time: '13:02', user: 'sub_example', badges: ['SUB'], text: 'can you push opacity to 100?' },
  { id: '4', time: '13:02', user: 'example_channel', badges: ['VIP'], text: 'type !me to get a .me bubble' },
  { id: '5', time: '13:03', user: 'viewer_two', text: 'what is a .me bubble?' },
  { id: '6', time: '13:03', user: 'example_mod', badges: ['MOD'], text: 'a namespace you own, rendered on stream' },
  { id: '7', time: '13:04', user: 'lurker_42', text: '!me' },
];
export const SAMPLE_PROFILE: ChannelProfile = { login: 'example_channel', displayName: 'Example Channel', url: 'https://www.twitch.tv/' };
export const SAMPLE_STREAM: ChannelStream = { live: true, title: 'Example stream title (sample)', category: 'Software and Game Development', viewers: 42, startedAt: '2026-10-29T19:00:00Z' };
export const SAMPLE_CHANNEL: ChannelSettings = { title: 'Example stream title (sample)', category: 'Software and Game Development', language: 'en', tags: ['Example', 'English'] };
export const SAMPLE_FOLLOWERS: ChannelFollowers = { total: 1234 };
