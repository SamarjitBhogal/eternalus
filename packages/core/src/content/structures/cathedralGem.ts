import type { CathedralGemDefinition } from './structures.types';

/**
 * The Cathedral gem's answer to a hit or a touch (DEC-292): "a toned-down stun and tick-damage",
 * and a purple glow "for the stun duration + 5 ticks". The stun and damage numbers live in the two
 * statuses (`gemShock.ts`, `gemBurn.ts`); `gemWarded.ts` spaces out the strikes on a unit that
 * keeps touching it.
 */
export const CATHEDRAL_GEM: CathedralGemDefinition = {
  statusIds: ['gem-shock', 'gem-burn', 'gem-warded'],
  touchCooldownStatusId: 'gem-warded',
  glow: { statusId: 'gem-shock', extraTicks: 5 },
};
