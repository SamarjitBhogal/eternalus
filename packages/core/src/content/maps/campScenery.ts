/** Visual materials only: camp allegiance, weights and spawning stay in their existing content. */
export const CAMP_MATERIALS = {
  shadow: 'rgba(14,20,18,0.38)',
  dust: '#686858',
  stone: '#777769',
  face: '#4b4e46',
  light: '#a3a28a',
  edge: '#c1bca0',
  crack: '#30372f',
  moss: '#505c3d',
  bronze: '#8b8060',
  bronzeLight: '#b5a47a',
  iron: '#313b3d',
  wood: '#63533b',
  cloth: '#575e59',
  grainLight: 'rgba(203,201,171,0.18)',
  grainDark: 'rgba(20,25,19,0.23)',
} as const;

/** Shrine variations share the reference's masonry; troop equipment supplies their identity. */
export const CAMP_APPEARANCES = {
  corner: { scale: 1 },
  heavy: { scale: 0.82 },
  medium: { scale: 0.76 },
  light: { scale: 0.7 },
} as const;

/** Appearance order by distance from the home stronghold, independent of gameplay weight. */
export const LANE_CAMP_THEMES = ['heavy', 'medium', 'light'] as const;

/** Set the lane shrine behind its anchor, leaving the approach across its front steps clear. */
export const LANE_SHRINE_OFFSET_Y = -14;

/** Faction-readable crystals; all corner shrines use the same orange objective gem. */
export const CAMP_CRYSTALS = {
  light: { glow: 'rgba(64,171,255,0.12)', crystal: '#4ab9ff', core: '#dcf7ff' },
  dark: { glow: 'rgba(176,92,255,0.12)', crystal: '#b16aff', core: '#f1dfff' },
  corner: { glow: 'rgba(255,155,48,0.12)', crystal: '#ffab42', core: '#fff1c5' },
} as const;
