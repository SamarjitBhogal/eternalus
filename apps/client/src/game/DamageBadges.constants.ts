import type { DamageBadgeKind } from './views/damageBadge.types';

/**
 * A hit (its shielded part included) above this share of the target's max health is a big hit: a larger badge with a gold rim
 * (W5a: "more than a TUNE share of the target's health").
 */
// TUNE: W5a (DEC-410)
export const BIG_HIT_SHARE = 0.2;

/**
 * The badge kind of the damage over time each status deals, by status id (W5a): a bleed is a
 * drop, a burn a flame. Every other hit on base health is a `hit` shield. A new burning or
 * bleeding status is one entry here. The keys are core status ids, and an id missing here falls
 * back to the `hit` shield: `burn` is the id the fire statuses of the weapons branches use
 * (`feat/start-weapons`, `feat/shots-over-lava`); it does nothing until one of them merges. The game has no poison yet, so no poison badge (W5a).
 */
export const STATUS_BADGE_KINDS: Readonly<Record<string, DamageBadgeKind>> = {
  bleed: 'bleed',
  burn: 'burn',
  'gem-burn': 'burn',
};
