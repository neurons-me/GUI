import type { TwitchChatMessage } from './Twitch.types';

/** EXAMPLE DATA ONLY — fictional users and messages for stories. */
export const SAMPLE_CHAT: TwitchChatMessage[] = [
  { id: '1', time: '13:01', user: 'example_mod', badges: ['MOD'], text: 'Welcome in. Sample chat, not live data.' },
  { id: '2', time: '13:01', user: 'viewer_one', text: 'the overlay looks clean today' },
  { id: '3', time: '13:02', user: 'sub_example', badges: ['SUB', '12'], text: 'can you push opacity to 100?' },
  { id: '4', time: '13:02', user: 'neurons_demo', badges: ['VIP'], text: 'drag the circle: left/right hue, up/down opacity' },
  { id: '5', time: '13:03', user: 'viewer_two', text: 'what is a .me bubble?' },
  { id: '6', time: '13:03', user: 'example_mod', badges: ['MOD'], text: 'a namespace you own, rendered on stream' },
  { id: '7', time: '13:04', user: 'lurker_42', text: 'first time here, nice layout' },
  { id: '8', time: '13:04', user: 'sub_example', badges: ['SUB', '12'], text: 'opacity 0 = clean camera' },
];
