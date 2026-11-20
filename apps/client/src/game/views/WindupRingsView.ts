import type { StatusSnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';
import { LEGEND_OUTLINE_SCALE } from './entityViews.constants';
import type { StatusCueView } from './StatusCueRegistry.types';
import {
  WINDUP_RING_COLOR,
  WINDUP_RING_COUNT,
  WINDUP_RING_SPACING,
  WINDUP_RING_START_SCALE,
} from './WindupRingsView.constants';

/**
 * The cue of the `fury-windup` status (registered for `WINDUP_STATUS_ID`): the orange rings of
 * Fury's dash wind-up (DEC-283) around a Legend. They start a short way out and close in ("fall
 * in") on the Legend as the wind-up passes, all reaching its outline as it ends and the dash
 * starts. How far the wind-up is comes from the status's ticks in the snapshot
 * (`EntitySnapshot.statuses`).
 */
export class WindupRingsView implements StatusCueView {
  /** Draws the rings of `windup` on `state`'s entity; nothing for a status with no end or place. */
  public draw(
    { entity, position }: EntityDrawState,
    windup: StatusSnapshot,
    renderer: Renderer,
  ): void {
    const { ticksActive, ticksLeft } = windup;
    const radius = entity.transform?.radius;
    if (ticksLeft === null || radius === undefined) {
      return;
    }
    const length = ticksActive + ticksLeft;
    const passed = length <= 0 ? 1 : ticksActive / length;
    for (let ring = 0; ring < WINDUP_RING_COUNT; ring += 1) {
      const start = WINDUP_RING_START_SCALE + ring * WINDUP_RING_SPACING;
      const scale = start + (LEGEND_OUTLINE_SCALE - start) * passed;
      renderer.drawWorldGlyph(
        { shape: 'ring', size: radius * 2 * scale },
        position,
        WINDUP_RING_COLOR,
      );
    }
  }
}
