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
  /**
   * The moment this frame shows, in ticks: the previous snapshot's tick plus the interpolation
   * (`EntityLayer.show`), so it rises smoothly from frame to frame and replays the same. For
   * motion the snapshot does not hold, such as an aura's particles (DEC-323 (3)).
   */
  readonly time: number;
};

/**
 * Draws one kind (or family) of entity in the main view and on the mini map. Views only read
 * snapshots and draw through the `Renderer` port (architecture 08 §8; 06 §8).
 */
export interface EntityView {
  /**
   * Draws what lies on the ground under every entity, such as an aura field (DEC-323 (3)), in the
   * main view: `EntityLayer` draws this for every entity before any `draw`, so no unit is tinted
   * by a ground fill drawn after it. A view without it draws nothing there.
   */
  drawGround?(state: EntityDrawState, renderer: Renderer): void;
  /** Draws the entity and may return its visible height above its position in world units. */
  draw(state: EntityDrawState, renderer: Renderer): number | undefined;
  /** Draws the entity's mini map marker, sized in CSS pixels, or nothing. */
  drawMinimap(state: EntityDrawState, renderer: Renderer): void;
  /**
   * The mini map layer of this view's markers: higher layers are drawn later, on top. A view
   * without one is on layer 0.
   */
  readonly minimapLayer?: number;
  /** Radius of the artwork for pointer targeting and health-bar placement. */
  visualRadiusOf?(entity: EntitySnapshot): number;
}
