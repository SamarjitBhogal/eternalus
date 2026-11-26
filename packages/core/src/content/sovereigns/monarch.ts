import type { PlayableTeam } from '../../teams/teams.types';
import { CAPTURE_POINT_BOSS } from '../mobs/capturePointBoss';
import type { UnitDefinition } from '../units/units.types';

const displayNames = {
  light: 'Emperor',
  dark: 'Emperor',
} as const satisfies Readonly<Record<PlayableTeam, string>>;

/** DEC-74 anchors provisional Sovereign stats to the existing mini-boss baseline. */
export const MONARCH = {
  id: 'monarch',
  kind: 'monarch',
  displayName: displayNames.light,
  displayNames,
  baseHealth: CAPTURE_POINT_BOSS.baseHealth, // TUNE: DEC-74 and balancing.md MiniBoss.
  footprintRadius: CAPTURE_POINT_BOSS.footprintRadius, // TUNE: reuse the mini-boss anchor.
  visionRadius: CAPTURE_POINT_BOSS.visionRadius, // TUNE: reuse the mini-boss anchor.
  attack: { ...CAPTURE_POINT_BOSS.attack, strategy: 'cleave' }, // TUNE: mini-boss base hit and interval.
  movementProfile: CAPTURE_POINT_BOSS.movementProfile, // TUNE: reuse the mini-boss anchor.
} as const satisfies UnitDefinition & { readonly displayNames: typeof displayNames };
