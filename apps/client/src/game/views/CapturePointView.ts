import type { CaptureSnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  CAPTURE_BAR_BACKGROUND_COLOR,
  CAPTURE_BAR_GAP_RATIO,
  CAPTURE_BAR_HEIGHT_RATIO,
  CAPTURE_CHECKPOINT_MARK_COLOR,
  CAPTURE_CHECKPOINT_MARK_WIDTH,
} from './entityViews.constants';

/**
 * The placeholder look for capture points (architecture 07 §7): a ring of the zone's radius in
 * its owner's colour, and above it a progress bar that fills in the colour of the side the
 * progress leans toward, marked at each checkpoint. The checkpoint count comes from the snapshot.
 */
export class CapturePointView extends DefaultEntityView {
  /** Draws the owner's ring, then the progress bar. */
  public override draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const radius = entity.transform?.radius ?? 0;
    const { capture } = entity;
    renderer.drawWorldGlyph(
      { shape: 'ring', size: radius * 2 },
      position,
      this.colorOf(capture?.owner ?? null),
    );
    if (capture !== null) {
      this.drawBar(capture, position, radius, renderer);
    }
  }

  /** The bar across the zone's width, just above it. */
  private drawBar(
    capture: CaptureSnapshot,
    center: WorldPoint,
    radius: number,
    renderer: Renderer,
  ): void {
    const height = radius * CAPTURE_BAR_HEIGHT_RATIO;
    const left = center.x - radius;
    const bottom = center.y - radius - radius * CAPTURE_BAR_GAP_RATIO;
    const top = bottom - height;
    const width = radius * 2;
    renderer.fillPolygon(
      CapturePointView.rectangle(left, top, width, height),
      CAPTURE_BAR_BACKGROUND_COLOR,
    );
    const filled = width * Math.abs(capture.progress);
    if (filled > 0) {
      const leaning = capture.progress > 0 ? 'light' : 'dark';
      renderer.fillPolygon(
        CapturePointView.rectangle(left, top, filled, height),
        this.colorOf(leaning),
      );
    }
    for (let mark = 1; mark < capture.checkpoints; mark += 1) {
      const x = left + (width * mark) / capture.checkpoints;
      renderer.strokePath(
        [
          { x, y: top },
          { x, y: bottom },
        ],
        CAPTURE_CHECKPOINT_MARK_COLOR,
        CAPTURE_CHECKPOINT_MARK_WIDTH,
      );
    }
  }

  /** The four corners of a rectangle, clockwise from its top-left corner. */
  private static rectangle(x: number, y: number, width: number, height: number): WorldPoint[] {
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  }
}
