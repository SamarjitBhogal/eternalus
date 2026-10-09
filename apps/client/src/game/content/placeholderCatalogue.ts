import type { DisplayCatalogue } from '../../bridge/events';
import type { CatalogueSource } from './CatalogueSource.types';

// Class names, blurbs and sub-classes from docs/reference/game-design/01-classes-and-subclasses.md;
// "Chronicle" from docs/reference/suggestions/naming.md (accepted as a working name, decisions log).
const PLACEHOLDER_CONTENT: DisplayCatalogue = {
  legendClasses: [
    {
      classId: 'warrior',
      displayName: 'Warrior',
      blurb:
        'Lighter, lower health, faster. Light weapons; damage split between magic and physical.',
      specs: [
        { specId: 'assassin', displayName: 'Assassin', status: 'post-mvp' },
        { specId: 'knight', displayName: 'Knight', status: 'post-mvp' },
        { specId: 'paladin', displayName: 'Paladin', status: 'post-mvp' },
      ],
    },
    {
      classId: 'sentinel',
      displayName: 'Sentinel',
      blurb: 'Heavy and slower, but more powerful. Heavy weapons; physical damage.',
      specs: [{ specId: 'colossus', displayName: 'Colossus', status: 'post-mvp' }],
    },
    {
      classId: 'magus',
      displayName: 'Magus',
      blurb: 'Magical; floats or walks. Staves; magic damage, buffs, debuffs and reviving allies.',
      specs: [
        { specId: 'necromancer', displayName: 'Necromancer', status: 'post-mvp' },
        { specId: 'druid', displayName: 'Druid', status: 'post-mvp' },
        { specId: 'mage', displayName: 'Mage', status: 'post-mvp' },
      ],
    },
  ],
  backgroundSets: [
    {
      id: 'menu-neutral',
      team: 'neutral',
      layers: [
        { kind: 'gradient', angleDeg: 160, stops: ['--surface-0', '--team-neutral-accent'] },
        { kind: 'particles', count: 24, colourToken: '--team-neutral-primary' },
      ],
    },
    {
      id: 'selection-light',
      team: 'light',
      layers: [
        {
          kind: 'gradient',
          angleDeg: 180,
          stops: ['--team-light-accent', '--team-light-primary', '--team-light-secondary'],
        },
        { kind: 'particles', count: 32, colourToken: '--team-light-secondary' },
      ],
    },
    {
      id: 'selection-dark',
      team: 'dark',
      layers: [
        {
          kind: 'gradient',
          angleDeg: 180,
          stops: ['--team-dark-secondary', '--team-dark-accent', '--team-dark-primary'],
        },
        { kind: 'particles', count: 32, colourToken: '--team-dark-primary' },
      ],
    },
  ],
  profileDisplayName: 'Chronicle',
};

// TODO(sam): replace with a CatalogueSource over @eternalus/core LEGEND_CLASSES when session C lands.
/** The three MVP classes and the placeholder background sets, until core content exists. */
export const placeholderCatalogue: CatalogueSource = { load: () => PLACEHOLDER_CONTENT };
