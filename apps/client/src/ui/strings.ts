import type { InputAction } from '../bridge/Binding.types';
import type { MenuRoute, SessionPhase } from '../bridge/events';

/** Banner text per `session.reason`; reasons without an entry show no banner. */
const REASON_BANNERS: Readonly<Record<string, string>> = {
  'select-timeout': 'Match cancelled: no character selected.',
  cancelled: 'Match cancelled.',
};

/**
 * UI labels (architecture 13 §1). Game names (classes, the profile screen's "Chronicle") come
 * from content through the store, never from here.
 */
export const STRINGS = {
  gameTitle: 'Eternalus',
  back: 'Back',
  menu: {
    navLabel: 'Main menu',
    startMatch: 'Start match',
    loadouts: 'Loadouts',
    settings: 'Settings',
    about: 'About / credits',
  },
  reasonBanners: REASON_BANNERS,
  comingSoon: 'Coming in sprint 2.',
  about: {
    title: 'About / credits',
    credits: 'Eternalus is a COMP 7003 team project. Full credits arrive with the asset manifest.',
    licencesTitle: 'Software licences',
    licences: ['React (MIT)', 'Redux Toolkit (MIT)', 'React Redux (MIT)', 'Vite (MIT)'],
  },
  loadouts: { title: 'Loadouts', classesTitle: 'Classes' },
  profile: { history: 'Match history and achievements appear here.' },
  results: {
    title: 'Match results',
    // TODO(sam): verdict lines are core content (content/narrative/, selectVerdictLine) once it exists.
    noResult: 'No result recorded.',
    draw: 'Draw.',
    winner: { light: 'Light wins.', dark: 'Dark wins.' },
    playAgain: 'Play again',
    mainMenu: 'Main menu',
  },
  placeholder: {
    body: 'This screen is being built.',
    leaveMatch: 'Leave match',
    phases: {
      boot: 'Starting',
      menu: 'Menu',
      loading: 'Loading',
      'character-select': 'Character select',
      'pre-launch': 'Pre-launch',
      'match-loading': 'Loading match',
      match: 'Match',
      results: 'Results',
    } satisfies Record<SessionPhase, string>,
    routes: {
      home: 'Home',
      loadouts: 'Loadouts',
      profile: 'Profile',
      settings: 'Settings',
      about: 'About',
    } satisfies Record<MenuRoute, string>,
  },
  /** Shown where an action has no binding (`KeyGlyph`, the settings list). */
  unbound: '—',
  settings: {
    title: 'Settings',
    tablist: 'Settings sections',
    tabs: { controls: 'Controls', audio: 'Audio', video: 'Video', accessibility: 'Accessibility' },
    listening: 'Press a key or mouse button…',
    confirm: 'Enter to save, Esc to cancel',
    conflict: (chord: string, owner: string) => `${chord} is already bound to ${owner}.`,
    save: 'Save',
    swap: 'Swap',
    replace: 'Replace',
    cancel: 'Cancel',
    reset: 'Reset',
    resetLabel: (action: string) => `Reset ${action} to default`,
    resetAll: 'Reset all to defaults',
    volume: { master: 'Master volume', music: 'Music volume', effects: 'Effects volume' },
    fullscreen: 'Fullscreen',
    renderScale: 'Render scale',
    reduceMotion: 'Reduce motion',
    colourBlindMode: 'Colour-blind mode',
  },
  pause: { title: 'Paused', resume: 'Resume', settings: 'Settings', leave: 'Leave match' },
} as const;

/** What the settings screen calls each action. A missing action is a compile error. */
export const ACTION_LABELS: Readonly<Record<InputAction, string>> = {
  'move-up': 'Move up',
  'move-down': 'Move down',
  'move-left': 'Move left',
  'move-right': 'Move right',
  attack: 'Attack',
  'ability-1': 'Ability 1',
  'ability-2': 'Ability 2',
  'ability-3': 'Ability 3',
  'ability-4': 'Ultimate',
  'gadget-1': 'Gadget 1',
  'gadget-2': 'Gadget 2',
  sprint: 'Sprint',
  interact: 'Interact',
  'turret-toggle-control': 'Turret: take or leave control',
  'turret-switch-ammo': 'Turret: switch ammo',
  'camera-zoom-in': 'Zoom in',
  'camera-zoom-out': 'Zoom out',
  'toggle-minimap': 'Toggle minimap',
  'pause-menu': 'Pause menu',
  'toggle-developer-menu': 'Developer menu',
  'toggle-perf-overlay': 'Performance overlay',
};

/** Names of `MouseEvent.button` 0–4 as a captured chord shows them. */
export const MOUSE_BUTTON_LABELS: readonly string[] = ['LMB', 'MMB', 'RMB', 'Mouse 4', 'Mouse 5'];

/** `KeyboardEvent.key` values whose label is not the key itself upper-cased. */
export const KEY_LABELS: Readonly<Record<string, string>> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
};
