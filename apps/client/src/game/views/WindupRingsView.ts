import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';
import { LEGEND_OUTLINE_SCALE } from './entityViews.constants';
import {
  WINDUP_RING_COLOR,
  WINDUP_RING_COUNT,
  WINDUP_RING_SPACING,
  WINDUP_RING_START_SCALE,
  WINDUP_STATUS_ID,
} from './WindupRingsView.constants';

/**
 * Draws the orange rings of Fury's dash wind-up (DEC-283) around a Legend while it has the
 * `fury-windup` status: they start a short way out and close in ("fall in") on the Legend as the
 * wind-up passes, all reaching its outline as it ends and the dash starts. How far the wind-up is
 * comes from the status's ticks in the snapshot (`EntitySnapshot.statuses`). `EntityLayer` draws
 * them after every entity of its layer.
 */
export class WindupRingsView {
  /** Draws the rings of `state`'s entity; nothing when it does not wind up or has no place. */
  public draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const windup = entity.statuses?.find(({ id }) => id === WINDUP_STATUS_ID);
    const ticksLeft = windup?.ticksLeft ?? null;
    const radius = entity.transform?.radius;
    if (windup === undefined || ticksLeft === null || radius === undefined) {
      return;
    }
    const length = windup.ticksActive + ticksLeft;
    const passed = length <= 0 ? 1 : windup.ticksActive / length;
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
