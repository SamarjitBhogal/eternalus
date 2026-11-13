import type { CaptureSnapshot, Team } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  CAPTURE_BAR_BACKGROUND_COLOR,
  CAPTURE_BAR_GAP,
  CAPTURE_BAR_HEIGHT,
  CAPTURE_BAR_WIDTH,
  CAPTURE_CHECKPOINT_MARK_COLOR,
  CAPTURE_CHECKPOINT_MARK_WIDTH,
  CAPTURE_OUTLINE_WIDTH,
  CAPTURE_PRESENCE_BAR_HEIGHT,
} from './entityViews.constants';
import { rectangle } from './rectangle';

/** The sides of the presence bar, left to right. */
const PRESENCE_ORDER: readonly Team[] = ['light', 'neutral', 'dark'];

/**
 * The placeholder look for capture points (architecture 07 §7, DEC-145): the outline of the
 * zone's area in its owner's colour, and above the area a progress bar that fills in the colour
 * of the side the progress leans toward, marked at each checkpoint, over a thin bar of each
 * side's share of the presence inside (Light | neutral | Dark).
 *
 * @remarks Each polygon of the area is outlined on its own, so where the Cathedral's floor
 * pieces overlap, lines cross its nave (close is enough). The area is not filled: the entity
 * layer draws by y, so a fill would tint the units drawn before it.
 */
export class CapturePointView extends DefaultEntityView {
  /** Draws the owner's outline, then the bars. */
  public override draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const { area, capture } = entity;
    const color = this.colorOf(capture?.owner ?? null);
    for (const polygon of area ?? []) {
      const [first] = polygon;
      if (first !== undefined) {
        renderer.strokePath([...polygon, first], color, CAPTURE_OUTLINE_WIDTH);
      }
    }
    if (capture !== null) {
      const areaTop = Math.min(position.y, ...(area ?? []).flat().map(({ y }) => y));
      const left = position.x - CAPTURE_BAR_WIDTH / 2;
      const presenceTop = areaTop - CAPTURE_BAR_GAP - CAPTURE_PRESENCE_BAR_HEIGHT;
      this.drawProgress(capture, left, presenceTop - CAPTURE_BAR_HEIGHT, renderer);
      this.drawPresence(capture, left, presenceTop, renderer);
    }
  }

  /** The progress bar, its top-left corner at (`left`, `top`). */
  private drawProgress(
    capture: CaptureSnapshot,
    left: number,
    top: number,
    renderer: Renderer,
  ): void {
    const bottom = top + CAPTURE_BAR_HEIGHT;
    renderer.fillPolygon(
      rectangle(left, top, CAPTURE_BAR_WIDTH, CAPTURE_BAR_HEIGHT),
      CAPTURE_BAR_BACKGROUND_COLOR,
    );
    const filled = CAPTURE_BAR_WIDTH * Math.abs(capture.progress);
    if (filled > 0) {
      const leaning = capture.progress > 0 ? 'light' : 'dark';
      renderer.fillPolygon(rectangle(left, top, filled, CAPTURE_BAR_HEIGHT), this.colorOf(leaning));
    }
    for (let mark = 1; mark < capture.checkpoints; mark += 1) {
      const x = left + (CAPTURE_BAR_WIDTH * mark) / capture.checkpoints;
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

  /** Each side's share of the presence inside, Light from the left and Dark from the right. */
  private drawPresence(
    { presence }: CaptureSnapshot,
    left: number,
    top: number,
    renderer: Renderer,
  ): void {
    renderer.fillPolygon(
      rectangle(left, top, CAPTURE_BAR_WIDTH, CAPTURE_PRESENCE_BAR_HEIGHT),
      CAPTURE_BAR_BACKGROUND_COLOR,
    );
    const total = PRESENCE_ORDER.reduce((sum, team) => sum + presence[team], 0);
    let x = left;
    for (const team of total > 0 ? PRESENCE_ORDER : []) {
      const width = (CAPTURE_BAR_WIDTH * presence[team]) / total;
      if (width > 0) {
        renderer.fillPolygon(
          rectangle(x, top, width, CAPTURE_PRESENCE_BAR_HEIGHT),
          this.colorOf(team),
        );
      }
      x += width;
    }
  }
}
