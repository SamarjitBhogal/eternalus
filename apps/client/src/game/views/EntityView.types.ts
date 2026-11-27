import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';

/**
 * One entity to draw this frame: its snapshot, where to draw it, whether it is the player's, and
 * the frame time.
 */
export type EntityDrawState = {
  readonly entity: EntitySnapshot;
  /** Interpolated between the last two ticks, in world units. */
  readonly position: WorldPoint;
  /** The way the entity faces: a unit vector, interpolated like `position` (DEC-192). */
  readonly facing: WorldPoint;
  /**
   * Height above the ground in world units, interpolated like `position` (a jump, DEC-390).
   * Absent or 0 on the ground.
   */
  readonly height?: number;
  /** True for the entity the player controls (highlighted). */
  readonly isFocused: boolean;
  /**
   * The tick this frame shows: the latest snapshot's tick plus the frame's `alpha`. A view that
   * animates picks its frame by it (DEC-398, card PR170 (12)).
   */
  readonly frameTick: number;
};

/**
 * Draws one kind (or family) of entity in the main view and on the mini map. Views only read
 * snapshots and draw through the `Renderer` port (architecture 08 §8; 06 §8).
 */
export interface EntityView {
  /** Draws the entity in the main view, sized in world units. */
  draw(state: EntityDrawState, renderer: Renderer): void;
  /** Draws the entity's mini map marker, sized in CSS pixels, or nothing. */
  drawMinimap(state: EntityDrawState, renderer: Renderer): void;
  /**
   * The mini map layer of this view's markers: higher layers are drawn later, on top. A view
   * without one is on layer 0.
   */
  readonly minimapLayer?: number;
  /**
   * Radius of the artwork for pointer targeting (`PlayerCommands`). The health bar uses it too
   * when the view gives no `visualTopOf`, and `AirborneView` sizes a jump shadow by it.
   */
  visualRadiusOf?(entity: EntitySnapshot): number;
  /**
   * How far the top of the artwork stands above the entity's ground position in this frame, for
   * the health bar (`EntityLayer`). A standing sprite is taller than its click area, and a Legend
   * in the air stands higher by its jump height (`AirborneView`, DEC-390). Left out, the bar uses
   * `visualRadiusOf`.
   */
  visualTopOf?(state: EntityDrawState): number;
}
