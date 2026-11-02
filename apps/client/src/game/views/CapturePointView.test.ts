import type { CaptureSnapshot, EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { CapturePointView } from './CapturePointView';
import {
  CAPTURE_BAR_BACKGROUND_COLOR,
  CAPTURE_CHECKPOINT_MARK_COLOR,
  NEUTRAL_ENTITY_COLOR,
} from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';

const AT = { x: 100, y: 100 };

const zone = (capture: CaptureSnapshot | null): EntitySnapshot => ({
  id: 'entity-1',
  kind: 'capture-point',
  family: 'zone',
  definitionId: 'capture-point',
  team: 'neutral',
  transform: { x: AT.x, y: AT.y, radius: 20 },
  health: null,
  capture,
});

const capture = (overrides: Partial<CaptureSnapshot> = {}): CaptureSnapshot => ({
  owner: 'neutral',
  progress: 0,
  checkpoint: 0,
  checkpoints: 3,
  lockedBy: null,
  ...overrides,
});

const draw = (entity: EntitySnapshot): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  new CapturePointView().draw({ entity, position: AT, isFocused: false }, renderer);
  return renderer;
};

/** The bar is radius 20: 40 wide and 3 high, its bottom 2 above the zone (y 78 to 75). */
const bar = (fromX: number, width: number) => [
  { x: fromX, y: 75 },
  { x: fromX + width, y: 75 },
  { x: fromX + width, y: 78 },
  { x: fromX, y: 78 },
];

describe('CapturePointView', () => {
  it('draws a neutral zone as a ring in the shared neutral colour over an empty bar', () => {
    expect(draw(zone(capture())).calls).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'ring', size: 40 }, AT, NEUTRAL_ENTITY_COLOR] },
      { op: 'fillPolygon', args: [bar(80, 40), CAPTURE_BAR_BACKGROUND_COLOR] },
      {
        op: 'strokePath',
        args: [
          [
            { x: 80 + 40 / 3, y: 75 },
            { x: 80 + 40 / 3, y: 78 },
          ],
          CAPTURE_CHECKPOINT_MARK_COLOR,
          1,
        ],
      },
      {
        op: 'strokePath',
        args: [
          [
            { x: 80 + 80 / 3, y: 75 },
            { x: 80 + 80 / 3, y: 78 },
          ],
          CAPTURE_CHECKPOINT_MARK_COLOR,
          1,
        ],
      },
    ]);
  });

  it("rings the zone in its owner's team colour and fills the bar toward the leaning side", () => {
    const calls = draw(zone(capture({ owner: 'light', progress: -0.5 }))).calls;

    expect(calls[0]).toEqual({
      op: 'drawWorldGlyph',
      args: [{ shape: 'ring', size: 40 }, AT, TEAM_COLORS.light],
    });
    expect(calls[2]).toEqual({ op: 'fillPolygon', args: [bar(80, 20), TEAM_COLORS.dark] });
  });

  it('fills the whole bar for a fully held zone', () => {
    const calls = draw(zone(capture({ owner: 'dark', progress: -1 }))).calls;

    expect(calls[2]).toEqual({ op: 'fillPolygon', args: [bar(80, 40), TEAM_COLORS.dark] });
    const light = draw(zone(capture({ owner: 'light', progress: 1 }))).calls;
    expect(light[2]).toEqual({ op: 'fillPolygon', args: [bar(80, 40), TEAM_COLORS.light] });
  });

  it('marks as many checkpoints as the snapshot says, not a fixed three', () => {
    const marks = (checkpoints: number) =>
      draw(zone(capture({ checkpoints }))).calls.filter(({ op }) => op === 'strokePath').length;

    expect(marks(3)).toBe(2);
    expect(marks(5)).toBe(4);
    expect(marks(1)).toBe(0);
  });

  it('draws only the neutral ring for a snapshot without capture state', () => {
    expect(draw(zone(null)).calls).toEqual([
      { op: 'drawWorldGlyph', args: [{ shape: 'ring', size: 40 }, AT, NEUTRAL_ENTITY_COLOR] },
    ]);
  });
});
