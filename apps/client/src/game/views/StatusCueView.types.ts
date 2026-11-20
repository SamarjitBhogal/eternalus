import type { StatusSnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';

/**
 * Draws the cue of one status on an entity that has it (for example Fury's wind-up rings,
 * DEC-283). Views only read snapshots and draw through the `Renderer` port (architecture 08 §8).
 */
export interface StatusCueView {
  /** Draws `status`'s cue on `state`'s entity in the main view, sized in world units. */
  draw(state: EntityDrawState, status: StatusSnapshot, renderer: Renderer): void;
}
