import type { EntityId } from '@eternalus/core';

import type { WorldPoint } from '../engine/render/Renderer.types';

/**
 * The kinds of damage badge (W5a, DEC-410). Each kind has its own shape and colour, so colour is
 * never the only signal (NFR-030): `hit` is a red Roman shield, `bleed` a blood-red drop, `burn`
 * an orange flame and `steel` (the damage a shield soaked up) a round grey steel plate.
 */
export type DamageBadgeKind = 'hit' | 'bleed' | 'burn' | 'steel';

/**
 * Where a badge has moved as it fades (W5b), in badge radii: `fade` runs from 0 (fully shown) to 1
 * (gone), `seconds` is the badge's age.
 */
type BadgeMotion = (fade: number, seconds: number) => WorldPoint;

/** How one kind of badge looks and moves. */
export type DamageBadgeStyle = {
  /** The badge's outline for radius 1, centred on the badge, `y` down. */
  readonly outline: readonly WorldPoint[];
  /** The fill colour as `r,g,b`, so the fade can add its alpha. */
  readonly rgb: string;
  /** How far below the badge's centre the number sits, in badge radii. */
  readonly textOffsetY: number;
  readonly motion: BadgeMotion;
};

/** One damage number on screen (W5, DEC-410). `DamageBadges` makes them; the layer draws them. */
export type DamageBadge = {
  readonly targetId: EntityId;
  /** The damage, rounded, as the badge shows it. */
  readonly text: string;
  readonly kind: DamageBadgeKind;
  /** More than `BIG_HIT_SHARE` of the target's max health: a larger badge with a gold rim. */
  readonly isBig: boolean;
  /** Which of the target's side-by-side places it takes (`BADGE_SLOT_OFFSETS`). */
  readonly slot: number;
  /** The tick of the snapshot that first had the hit. */
  readonly bornTick: number;
  /** Where the target stood when hit: the badge stays there once the target is gone. */
  readonly at: WorldPoint;
};
