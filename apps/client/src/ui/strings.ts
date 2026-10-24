import type { InputAction } from '../bridge/Binding.types';
import type { RoleRatingAxis } from '../bridge/catalogue.types';
import type { PlayableTeam } from '../bridge/domain.types';
import type { MenuRoute, SessionPhase, SessionReason } from '../bridge/events';
import type { HudAllegiance, HudBlockReason } from '../bridge/hud.types';

/**
 * Banner text per `session.reason`: every `SessionReason` has one (a missing reason is a compile
 * error); the store holds the reason as a string, so an unknown one shows no banner.
 */
const REASON_BANNERS: Readonly<Record<string, string>> = {
  'select-timeout': 'Match cancelled: no character selected.',
  cancelled: 'Match cancelled.',
  'match-failed': 'Match could not start.',
  'load-failed': 'Loading failed.',
} satisfies Record<SessionReason, string>;

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
    credits: 'Eternalus is a COMP 7003 team project.',
    /** Heading of the art and font credits generated from the asset manifest. */
    assetCreditsTitle: 'Art and fonts',
    /** Summary of each credit's licence text and file list. */
    creditDetails: 'Licence text and files',
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
  /** The match viewport; the explorer labels show only with the developer flag (13 §4, DEC-32). */
  viewport: {
    canvas: 'Battlefield',
    leaveCathedral: 'Leave cathedral',
    explorer: {
      canvas: 'Drag to explore, scroll to zoom, click the cathedral to enter',
      worldHint: 'Drag to explore · Scroll to zoom · Click cathedral to enter',
      interiorHint: 'Drag to explore · Scroll to zoom · Explore the sanctuary',
      overview: 'World overview',
      legend: { light: 'Light stronghold', dark: 'Dark stronghold', camps: 'Neutral camps' },
    },
  },
  /** Both selection steps (62:125, 62:70, 58:271). Class, Legend and ability names are content. */
  characterSelect: {
    bannerTitle: 'Legend Selection',
    chooseClass: 'Choose Your Class',
    selectClass: 'Select Class',
    selectClassHint: 'Choose a class first.',
    classDetailsHeader: 'Default ability / Weapon Proficiency / Specialty',
    classAlternateDetailsHeader: 'Signature / Proficiency / Specialty',
    legendDetailsHeader: 'Signature / Specialty / Ultimate',
    legendsHeader: 'Legends',
    legendsPending: 'Legends to come',
    legendBreadcrumb: (classDisplayName: string): string =>
      `${classDisplayName} > Choose Your Legend`,
    viewDetails: 'View Details',
    previousClass: 'Previous class',
    nextClass: 'Next class',
    // Cinzel draws lower case as small capitals (58:276, 58:326).
    lockIn: 'lock in',
    lockInHint: 'Choose a Legend to lock in.',
    back: 'back',
    allyCount: (count: number): string => (count === 1 ? '1 Ally' : `${String(count)} Allies`),
    locked: 'Locked',
    missingName: '—',
    noRating: 'No data yet',
    ratingAxes: {
      damage: 'Damage',
      support: 'Support',
      control: 'Control',
    } satisfies Record<RoleRatingAxis, string>,
    /** Two spaces and U+00B7 each side (57:35, 72:749). */
    detailLine: (left: string, right: string): string => `${left}  ·  ${right}`,
    countdownLabel: 'Time left to choose',
    rosterLabel: (team: string): string => `${team} team`,
    // TODO(sam): team display names move to core team content when it exists.
    teamNames: { light: 'Light', dark: 'Dark' } satisfies Record<PlayableTeam, string>,
    teamBadge: (team: string): string => `You are on the ${team} team`,
    you: 'You',
  },
  /** The match HUD (62:231); slot names reuse `ACTION_LABELS`, gameplay names are content. */
  hud: {
    label: 'Match HUD',
    health: 'Health',
    aether: 'Aether',
    level: 'Level',
    ultimateCharge: 'Ultimate charge',
    ultimatePips: 'Ultimate charges',
    weaponLevel: 'Weapon level',
    matchClock: 'Match time',
    alliedStructures: 'Your structures',
    enemyStructures: 'Enemy structures',
    objectives: 'Capture points',
    captureProgress: 'Capture progress',
    noData: '—',
    noDataLabel: 'No data yet',
    emptySlot: 'empty',
    ready: 'ready',
    notReady: 'not ready',
    /** Objective shield letters in lane order (65:620, 65:613, 65:617); past the end, `index + 1`. */
    objectiveLetters: ['A', 'B', 'C', 'D', 'E'],
    meterValue: (current: number, max: number): string => `${String(current)} of ${String(max)}`,
    levelValue: (level: number, percent: number): string =>
      `Level ${String(level)}, ${String(percent)}% to the next`,
    slot: (action: string, name: string | null, state: string): string =>
      `${action}${name === null ? '' : `: ${name}`}, ${state}`,
    structure: (name: string, state: string): string => `${name}, ${state}`,
    objective: (label: string, kind: string, holder: string): string =>
      `${kind} ${label}, ${holder}`,
    allegiance: {
      ours: 'held by your team',
      theirs: 'held by the enemy',
      neutral: 'not captured',
    } satisfies Record<HudAllegiance, string>,
    blockedBy: {
      'empty-slot': 'Empty slot',
      dead: 'Defeated',
      'on-cooldown': 'Cooling down',
      'not-enough-aether': 'Not enough aether',
      'not-charged': 'Not charged',
      casting: 'Casting',
      'cannot-cast': 'Cannot cast',
      'no-target': 'No target',
      restricted: 'Restricted',
    } satisfies Record<HudBlockReason, string>,
  },
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
