import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';

/** One entity to draw this frame: its snapshot, where to draw it, and whether it is the player's. */
export type EntityDrawState = {
  readonly entity: EntitySnapshot;
  /** Interpolated between the last two ticks, in world units. */
  readonly position: WorldPoint;
  /** True for the entity the player controls (highlighted). */
  readonly isFocused: boolean;
};

/**
 * Draws one kind (or family) of entity, in the main view and on the minimap. Views only read
 * snapshots and draw through the `Renderer` port (architecture 08 §8).
 */
export interface EntityView {
  /** Draws the entity in the main view, sized in world units. */
  draw(state: EntityDrawState, renderer: Renderer): void;
  /** Draws the entity's minimap marker, sized in CSS pixels. */
  drawMinimap(state: EntityDrawState, renderer: Renderer): void;
}
