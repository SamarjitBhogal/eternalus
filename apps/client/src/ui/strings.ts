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
} as const;
