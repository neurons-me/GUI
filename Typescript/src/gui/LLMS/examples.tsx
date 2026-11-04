import type { LLMSProps } from './LLMS.types';

/** e24 example: a café menu. The model only names the formula; the kernel computes the total. */
export const MENU_EN: LLMSProps = {
  phrase: 'Bread now costs 25, the coffee stays at 45; what is the menu total?',
  ops: [
    { op: 'set', path: 'menu.bread.price', value: 25 },
    { op: 'define', path: 'menu', name: 'total', expr: 'coffee.price + bread.price' },
    { op: 'query', paths: ['menu.total'] },
  ],
  graph: {
    nodes: [
      { path: 'menu.coffee.price', value: 45 },
      { path: 'menu.bread.price', value: 25, before: 20 },
      { path: 'menu.total', value: 70, derived: true },
    ],
    edges: [{ from: 'menu.coffee.price', to: 'menu.total' }, { from: 'menu.bread.price', to: 'menu.total' }],
  },
  explain: {
    path: 'menu.total', value: 70, expr: 'coffee.price + bread.price',
    derivation: { inputs: [
      { path: 'menu.coffee.price', value: 45, origin: 'public', masked: false, status: 'ok' },
      { path: 'menu.bread.price', value: 25, origin: 'public', masked: false, status: 'ok' },
    ] },
    meta: { dependsOn: ['menu.coffee.price', 'menu.bread.price'] },
  },
  changed: ['menu.bread.price', 'menu.total'],
};

/** the same step in Spanish: paths in Spanish, accent-insensitive matching (menú = menu, café = cafe) */
export const MENU_ES: LLMSProps = {
  phrase: 'El pan ahora cuesta 25 y el café sigue en 45; ¿cuánto es el total del menú?',
  ops: [
    { op: 'set', path: 'menu.pan.precio', value: 25 },
    { op: 'define', path: 'menu', name: 'total', expr: 'cafe.precio + pan.precio' },
    { op: 'query', paths: ['menu.total'] },
  ],
  graph: {
    nodes: [
      { path: 'menu.cafe.precio', value: 45 },
      { path: 'menu.pan.precio', value: 25, before: 20 },
      { path: 'menu.total', value: 70, derived: true },
    ],
    edges: [{ from: 'menu.cafe.precio', to: 'menu.total' }, { from: 'menu.pan.precio', to: 'menu.total' }],
  },
  explain: {
    path: 'menu.total', value: 70, expr: 'cafe.precio + pan.precio',
    derivation: { inputs: [
      { path: 'menu.cafe.precio', value: 45, origin: 'public', masked: false, status: 'ok' },
      { path: 'menu.pan.precio', value: 25, origin: 'public', masked: false, status: 'ok' },
    ] },
    meta: { dependsOn: ['menu.cafe.precio', 'menu.pan.precio'] },
  },
  changed: ['menu.pan.precio', 'menu.total'],
  labels: {
    changed: '← lo acabas de cambiar',
    recomputed: (i, t) => <>Cambiaste <code>{i}</code>, así que <code>{t}</code> se recalculó solo.</>,
    zoomIn: 'Acercar', zoomOut: 'Alejar', reset: 'Restablecer vista', expand: 'Ampliar', graph: 'grafo de estado',
  },
};

/** a robot that may only proceed with enough battery: a boolean derived from two numbers */
export const ROBOT: LLMSProps = {
  phrase: 'The robot can proceed only when its battery is at least the minimum battery. Battery is 82, minimum battery 30.',
  ops: [
    { op: 'set', path: 'robot.battery', value: 82 },
    { op: 'set', path: 'robot.minimumBattery', value: 30 },
    { op: 'define', path: 'robot', name: 'canProceed', expr: 'battery >= minimumBattery' },
  ],
  graph: {
    nodes: [
      { path: 'robot.battery', value: 82 },
      { path: 'robot.minimumBattery', value: 30 },
      { path: 'robot.canProceed', value: true, derived: true },
    ],
    edges: [{ from: 'robot.battery', to: 'robot.canProceed' }, { from: 'robot.minimumBattery', to: 'robot.canProceed' }],
  },
  explain: {
    path: 'robot.canProceed', value: true, expr: 'battery >= minimumBattery',
    derivation: { inputs: [
      { path: 'robot.battery', value: 82, origin: 'public', masked: false, status: 'ok' },
      { path: 'robot.minimumBattery', value: 30, origin: 'public', masked: false, status: 'ok' },
    ] },
    meta: { dependsOn: ['robot.battery', 'robot.minimumBattery'] },
  },
  changed: ['robot.battery', 'robot.minimumBattery', 'robot.canProceed'],
  aliases: { 'can proceed': 'robot.canProceed', 'minimum battery': 'robot.minimumBattery' },
};

/** the menu's whole state, for the expand button (the proposal graph above only shows what the step touches) */
export const MENU_FULL = {
  nodes: [
    { path: 'menu.coffee.price', value: 45 }, { path: 'menu.coffee.name', value: 'Café de olla' },
    { path: 'menu.bread.price', value: 25 }, { path: 'menu.bread.name', value: 'Concha' },
    { path: 'menu.total', value: 70, derived: true }, { path: 'cafe.name', value: 'e24' }, { path: 'cafe.city', value: 'CDMX' },
    { path: 'staff[0].name', value: 'Ana' }, { path: 'staff[1].name', value: 'Luis' }, { path: 'wallet.key', value: 'x', masked: true },
  ],
  edges: [{ from: 'menu.coffee.price', to: 'menu.total' }, { from: 'menu.bread.price', to: 'menu.total' }],
};
