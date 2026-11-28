import type { EntityId } from '@eternalus/core';

import type { WorldPoint } from '../engine/render/Renderer.types';

/**
 * The kinds of damage badge (W5a, DEC-410). Each kind has its own shape and colour, so colour is
 * never the only signal (NFR-030): `hit` is a red Roman shield, `bleed` a blood-red drop, `burn`
 * an orange flame and `steel` (the damage a shield soaked up) a round grey steel plate. Shared by
 * `DamageBadges` (which makes the badges) and `DamageBadgeLayer` (which draws them).
 */
export type DamageBadgeKind = 'hit' | 'bleed' | 'burn' | 'steel';

/** One damage number on screen (W5, DEC-410). `DamageBadges` makes them; the layer draws them. */
export type DamageBadge = {
  readonly targetId: EntityId;
  /** The damage, rounded, as the badge shows it. */
  readonly text: string;
  readonly kind: DamageBadgeKind;
  /** Its hit is more than `BIG_HIT_SHARE` of the target's max health: a larger badge with a gold rim. */
  readonly isBig: boolean;
  /** Which of the target's side-by-side places it takes (`BADGE_SLOT_OFFSETS`). */
  readonly slot: number;
  /** The tick of the snapshot that first had the hit. */
  readonly bornTick: number;
  /** Where the target stood when hit: the badge stays there once the target is gone. */
  readonly at: WorldPoint;
};
