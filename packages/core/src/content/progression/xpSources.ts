import type { XpSourcesDefinition } from './progression.types';

/**
 * XP per Legend kill. TUNE: DEC-190 (owner 2026-11-05) replaces the balancing.md "XP sources"
 * price (150 + 25 × victim level, then 150 + 5 × L): `80 + 1.5 × L` makes a same-level kill
 * worth about three quarters of a level at every level, so no kill gives several levels. The value
 * may be fractional. Mobs carry their own `xpValue`, except the bosses in `teamKills`, whose kill
 * pays the killer's whole team; sharing, assists, checkpoints and camps join with their systems.
 */
export const XP_SOURCES: XpSourcesDefinition = {
  legendKill: { base: 80, perVictimLevel: 1.5 },
  // TUNE: DEC-190 (owner 2026-11-05) replaces DEC-186's 300: 120 is at most one level at any level
  // of the curve. One value for every structure kind.
  structureDestroyed: 120,
  teamKills: {
    // TUNE: balancing.md MiniBoss "500 XP team-wide"; DEC-237 (owner 2026-11-10): a mini-boss kill
    // lifts a Legend 2 levels at most.
    'capture-point-boss': { xp: 500, maxLevels: 2 },
    // TUNE: as the capture point boss: the corner boss uses the same MiniBoss row; DEC-237 (owner
    // 2026-11-10): "team-wide is fine for now" for the corner boss.
    'corner-boss': { xp: 500, maxLevels: 2 },
    // DEC-237 (owner 2026-11-10): "Killing the middle boss puts you up 5 levels from wherever you
    // are, flat"; it replaces balancing.md's 1,500 XP. TUNE: paid to every Legend of the killer's
    // team, as the mini-boss's; whether the killer alone gets it is not answered (INBOX).
    'greater-boss': { levels: 5 },
  },
};
