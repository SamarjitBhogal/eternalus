import { ContentCatalogue } from '../ContentCatalogue';
import { MAP_FEATURE_DEFINITIONS } from '../maps/mapFeatureDefinitions';
import type { AuthoredTurretProfile } from './turret.types';

/**
 * The entity kinds a wall turret treats as heavy (balancing.md "Turrets — MVP": heavy ammo "against
 * Sentinels, heavy minions, bosses"): it prefers them as targets and loads heavy ammo for them.
 * The capture point boss is a `heavy-mob`; a boss kind joins when bosses are entities of their own.
 */
export const HEAVY_TARGET_KINDS = ['sentinel', 'heavy-mob'] as const;

/**
 * The wall turret's targeting (architecture 11 §4.5; numbers from balancing.md "Turrets — MVP",
 * `Recommendation:`): an enemy Legend that damaged an allied Legend in the last 3 s becomes the
 * target at once (the defend-ally override); else it keeps its target until that dies, leaves
 * range or its line of fire closes; else heavy units, then the nearest enemy.
 */
export const WALL_TURRET = {
  id: 'wall-turret',
  range: 14, // TUNE: balancing.md "Turrets — MVP"
  defendAllySeconds: 3, // TUNE: balancing.md "Turrets — MVP"
  // architecture 11 §4.5: the defend-ally override; it leaves a held target at once (DEC-341,
  // HC-Q94 A)
  overrides: ['legend-hurting-ally-legend'],
  priority: ['heavy-unit', 'nearest-enemy'], // TUNE: balancing.md
  heavyKinds: HEAVY_TARGET_KINDS,
} as const satisfies AuthoredTurretProfile;

/**
 * How far from a lane tower's centre it takes a target, in metres.
 * TUNE: HC-Q96 (Owner Calls v70, pending), option A (26 m from the tower centre).
 */
export const LANE_TOWER_REACH_FROM_CENTRE = 26;

/**
 * The footprint radius both lane towers share, from the map's feature definitions. The profile is
 * one for both towers, so a map that gives them different footprints must split it.
 */
const LANE_TOWER_FOOTPRINT = ((): number => {
  const radii = ['spawner-tower', 'buff-tower'].map(
    (id) => MAP_FEATURE_DEFINITIONS[id]?.footprintRadius,
  );
  const [first] = radii;
  if (first === undefined || radii.some((radius) => radius !== first)) {
    throw new Error('The lane towers need one footprint radius to share the lane-tower profile.');
  }
  return first;
})();

/**
 * The lane towers' targeting (DEC-302, DEC-342): the defend-ally override and window of the wall
 * turret, then the nearest enemy. The controller measures from the tower's edge, so the range is
 * the 26 m the owner card gives from the tower's centre, less the footprint radius.
 */
export const LANE_TOWER = {
  id: 'lane-tower',
  range: LANE_TOWER_REACH_FROM_CENTRE - LANE_TOWER_FOOTPRINT,
  defendAllySeconds: WALL_TURRET.defendAllySeconds,
  overrides: WALL_TURRET.overrides,
  priority: ['nearest-enemy'], // TUNE: HC-Q100 (Owner Calls v70, pending), option A
  heavyKinds: HEAVY_TARGET_KINDS,
} as const satisfies AuthoredTurretProfile;

/** Every turret profile as authored; `loadTurrets` loads them. */
export const TURRET_PROFILES = new ContentCatalogue<AuthoredTurretProfile>([
  WALL_TURRET,
  LANE_TOWER,
]);
