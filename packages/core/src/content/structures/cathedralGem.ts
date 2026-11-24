import type { CathedralGemDefinition } from './structures.types';

/**
 * The Cathedral gem's answer to a hit (DEC-292; a touch no longer strikes, DEC-346): "a toned-down
 * stun and tick-damage", and a purple glow "for the stun duration + 5 ticks", read as 5 game ticks
 * (about 1.17 s; the burn's "+ 1 tick" is read as one burn pulse, `gemBurn.ts`). The owner keeps
 * both readings (DEC-346). The stun and damage numbers live in the two statuses (`gemShock.ts`,
 * `gemBurn.ts`).
 */
export const CATHEDRAL_GEM: CathedralGemDefinition = {
  statusIds: ['gem-shock', 'gem-burn'],
  glow: { statusId: 'gem-shock', extraTicks: 5 },
  plinthObjectId: 'cathedral-interior-gem-plinth',
};
