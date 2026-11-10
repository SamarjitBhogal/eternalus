import type { XpSourcesDefinition } from './progression.types';

/**
 * XP per Legend kill. TUNE: balancing.md "XP sources" (150 + 25 × victim level), re-priced for the
 * cap-50 curve (O6): the curve keeps balancing.md's total, so a victim at level L is priced as one
 * at level L / 5 on the old cap-10 curve, 150 + 5 × L (400 XP at level 50). Mobs carry their own
 * `xpValue`; sharing, assists, structures, checkpoints, camps and bosses join with their systems.
 */
export const XP_SOURCES: XpSourcesDefinition = {
  legendKill: { base: 150, perVictimLevel: 5 },
};
