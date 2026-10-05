import type { MirrorSide } from './MapBuilder.types';

/** Team features: Light on the west half, Dark mirrored on the east. */
export const TEAM_SIDES: readonly [MirrorSide, MirrorSide] = [
  { idPrefix: 'light', team: 'light' },
  { idPrefix: 'dark', team: 'dark' },
];

/** Neutral features placed in mirrored pairs, named by the half they sit on. */
export const NEUTRAL_SIDES: readonly [MirrorSide, MirrorSide] = [
  { idPrefix: 'west', team: 'neutral' },
  { idPrefix: 'east', team: 'neutral' },
];
