import type { XpSourcesDefinition } from './progression.types';

/**
 * XP per Legend kill. TUNE: DEC-190 (owner 2026-11-05) replaces the balancing.md "XP sources"
 * price (150 + 25 × victim level, then 150 + 5 × L): `80 + 1.5 × L` makes a same-level kill
 * worth about three quarters of a level at every level, so no kill gives several levels. The value
 * may be fractional. Mobs carry their own `xpValue`; sharing, assists, checkpoints, camps and
 * bosses join with their systems.
 */
export const XP_SOURCES: XpSourcesDefinition = {
  legendKill: { base: 80, perVictimLevel: 1.5 },
  // TUNE: DEC-190 (owner 2026-11-05) replaces DEC-186's 300: 120 is at most one level at any level
  // of the curve. One value for every structure kind.
  structureDestroyed: 120,
};
