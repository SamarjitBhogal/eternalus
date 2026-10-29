import type { CapturePointSnapshot, Snapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import {
  CAPTURE_BAR_BACKGROUND,
  CAPTURE_BAR_GAP_RATIO,
  CAPTURE_BAR_HEIGHT_RATIO,
  CAPTURE_BORDER_WIDTH,
  CAPTURE_CHECKPOINTS,
  CAPTURE_FILL_ALPHA,
  CAPTURE_FLASH_TICKS,
  CAPTURE_HIGHLIGHT_COLOR,
  CAPTURE_LOCKED_OVERLAY,
  CAPTURE_TEAM_COLORS,
} from './CapturePointLayer.constants';
import type { WorldLayer } from './SceneView.types';

/**
 * The scene layer that draws every capture point of the latest snapshot: a square tinted in the
 * owner's colour, a progress bar above it split at the checkpoints, a flashing border while
 * contested and a dark cross-hatched overlay while locked. The mini map shows each point as a
 * solid square in its owner's colour.
 */
export class CapturePointLayer implements WorldLayer {
  private points: readonly CapturePointSnapshot[] = [];
  private tick = 0;

  /** Sets what the next draw shows. */
  public show(current: Snapshot): void {
    this.points = current.capturePoints;
    this.tick = current.tick;
  }

  /** Draws every point for the main view. */
  public draw(renderer: Renderer): void {
    const flashOn = Math.floor(this.tick / CAPTURE_FLASH_TICKS) % 2 === 0;
    for (const point of this.points) {
      const owner = CAPTURE_TEAM_COLORS[point.owner];
      const square = CapturePointLayer.square(point.x, point.y, point.halfSize, point.halfSize);

      renderer.fillPolygon(square, `${owner}${CAPTURE_FILL_ALPHA}`);
      if (point.locked) {
        renderer.fillPolygon(square, CAPTURE_LOCKED_OVERLAY);
        const [a, b, c, d] = square;
        if (a && b && c && d) {
          renderer.strokePath([a, c], owner, CAPTURE_BORDER_WIDTH);
          renderer.strokePath([b, d], owner, CAPTURE_BORDER_WIDTH);
        }
      }
      const border = point.contested && flashOn ? CAPTURE_HIGHLIGHT_COLOR : owner;
      renderer.strokePath(CapturePointLayer.closed(square), border, CAPTURE_BORDER_WIDTH);

      CapturePointLayer.drawBar(renderer, point);
    }
  }

  /** Draws every point on the mini map as a solid square in its owner's colour. */
  public drawMinimap(renderer: Renderer): void {
    for (const point of this.points) {
      const square = CapturePointLayer.square(point.x, point.y, point.halfSize, point.halfSize);
      renderer.fillPolygon(square, CAPTURE_TEAM_COLORS[point.owner]);
    }
  }

  /** The progress bar above the zone, in the capturing team's colour, with checkpoint marks. */
  private static drawBar(renderer: Renderer, point: CapturePointSnapshot): void {
    const side = point.halfSize * 2;
    const height = side * CAPTURE_BAR_HEIGHT_RATIO;
    const left = point.x - point.halfSize;
    const top = point.y - point.halfSize - side * CAPTURE_BAR_GAP_RATIO - height;
    const barY = top + height / 2;

    renderer.fillPolygon(
      CapturePointLayer.square(point.x, barY, point.halfSize, height / 2),
      CAPTURE_BAR_BACKGROUND,
    );
    if (point.progress > 0) {
      const filled = (side * point.progress) / 2;
      renderer.fillPolygon(
        CapturePointLayer.square(left + filled, barY, filled, height / 2),
        CAPTURE_TEAM_COLORS[point.progressTeam],
      );
    }
    for (let i = 1; i < CAPTURE_CHECKPOINTS; i += 1) {
      const x = left + (side * i) / CAPTURE_CHECKPOINTS;
      renderer.strokePath(
        [
          { x, y: top },
          { x, y: top + height },
        ],
        CAPTURE_HIGHLIGHT_COLOR,
        1,
      );
    }
  }

  /** The four corners of an axis-aligned rectangle, clockwise from top-left. */
  private static square(cx: number, cy: number, halfW: number, halfH: number): WorldPoint[] {
    return [
      { x: cx - halfW, y: cy - halfH },
      { x: cx + halfW, y: cy - halfH },
      { x: cx + halfW, y: cy + halfH },
      { x: cx - halfW, y: cy + halfH },
    ];
  }

  /** The same points with the first repeated at the end, so a stroke closes the shape. */
  private static closed(points: readonly WorldPoint[]): WorldPoint[] {
    const first = points[0];
    return first === undefined ? [...points] : [...points, first];
  }
}
