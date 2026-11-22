import { ContentCatalogue } from '../ContentCatalogue';
import type { AuthoredTurretProfile } from './turrets.types';

/**
 * The entity kinds a wall turret treats as heavy (balancing.md "Turrets — MVP": heavy ammo "against
 * Sentinels, heavy minions, bosses"): it prefers them as targets and loads heavy ammo for them.
 * The capture point boss is a `heavy-mob`; a boss kind joins when bosses are entities of their own.
 */
export const HEAVY_TARGET_KINDS = ['sentinel', 'heavy-mob'] as const;

/**
 * The wall turret's targeting (architecture 11 §4.5; numbers from balancing.md "Turrets — MVP",
 * `Recommendation:`): an enemy Legend that damaged an allied Legend in the last 3 s becomes the
 * target at once (the defend-ally override); else it keeps its target until that dies or leaves
 * range; else heavy units, then the nearest enemy.
 */
export const WALL_TURRET = {
  id: 'wall-turret',
  range: 14, // TUNE: balancing.md "Turrets — MVP"
  defendAllySeconds: 3, // TUNE: balancing.md "Turrets — MVP"
  overrides: ['legend-hurting-ally-legend'], // architecture 11 §4.5: the defend-ally override
  priority: ['heavy-unit', 'nearest-enemy'], // TUNE: balancing.md
  heavyKinds: HEAVY_TARGET_KINDS,
  ammo: ['bolt-heavy', 'bolt-default'],
} as const satisfies AuthoredTurretProfile;

/** Every turret profile as authored; `loadTurrets` loads them. */
export const TURRET_PROFILES = new ContentCatalogue<AuthoredTurretProfile>([WALL_TURRET]);
