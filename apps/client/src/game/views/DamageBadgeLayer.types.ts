import type { WorldPoint } from '../engine/render/Renderer.types';

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
