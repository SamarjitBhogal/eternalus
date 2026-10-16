import type { XpSourcesDefinition } from './progression.types';

/**
 * XP per kill. TUNE: balancing.md "XP sources" (minion kill 20 / 45 / 120; Legend kill
 * 150 + 25 × victim level). Sharing, assists, structures, checkpoints, camps and bosses join with
 * the systems that produce them.
 */
export const XP_SOURCES: XpSourcesDefinition = {
  legendKill: { base: 150, perVictimLevel: 25 },
  mobKill: { 'light-mob': 20, 'medium-mob': 45, 'heavy-mob': 120 },
};
