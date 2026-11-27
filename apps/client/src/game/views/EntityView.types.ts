import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';

/** One entity to draw this frame: its snapshot, where to draw it, and whether it is the player's. */
export type EntityDrawState = {
  readonly entity: EntitySnapshot;
  /** Interpolated between the last two ticks, in world units. */
  readonly position: WorldPoint;
  /** The way the entity faces: a unit vector, interpolated like `position` (DEC-192). */
  readonly facing: WorldPoint;
  /** True for the entity the player controls (highlighted). */
  readonly isFocused: boolean;
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
   * when the view gives no `visualTopOf`.
   */
  visualRadiusOf?(entity: EntitySnapshot): number;
  /**
   * How far the top of the artwork stands above the entity's position, for the health bar
   * (`EntityLayer`). A standing sprite is taller than its click area. Left out, the bar uses
   * `visualRadiusOf`.
   */
  visualTopOf?(entity: EntitySnapshot): number;
}
