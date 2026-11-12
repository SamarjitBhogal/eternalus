import type { CaptureSnapshot, EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { CapturePointView } from './CapturePointView';
import {
  CAPTURE_BAR_BACKGROUND_COLOR,
  CAPTURE_CHECKPOINT_MARK_COLOR,
  CAPTURE_OUTLINE_WIDTH,
  NEUTRAL_ENTITY_COLOR,
} from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';

const AT = { x: 100, y: 100 };

/** A 40 x 40 floor around `AT`: its top is y 80. */
const SQUARE = [
  { x: 80, y: 80 },
  { x: 120, y: 80 },
  { x: 120, y: 120 },
  { x: 80, y: 120 },
];

const zone = (
  capture: CaptureSnapshot | null,
  area: EntitySnapshot['area'] = [SQUARE],
): EntitySnapshot => ({
  id: 'entity-1',
  kind: 'capture-point',
  family: 'zone',
  definitionId: 'capture-point',
  team: 'neutral',
  transform: { x: AT.x, y: AT.y, radius: 28, facing: { x: 1, y: 0 } },
  health: null,
  progression: null,
  aether: null,
  area,
  capture,
});

const capture = (overrides: Partial<CaptureSnapshot> = {}): CaptureSnapshot => ({
  owner: 'neutral',
  progress: 0,
  checkpoint: 0,
  checkpoints: 3,
  lockedBy: null,
  presence: { light: 0, dark: 0, neutral: 0 },
  ...overrides,
});

const draw = (entity: EntitySnapshot): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  new CapturePointView().draw(
    { entity, position: AT, facing: { x: 1, y: 0 }, isFocused: false },
    renderer,
  );
  return renderer;
};

const rectangle = (x: number, y: number, width: number, height: number) => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

/** The bars are 70 wide, centred on x 100 (65 to 135), 4 above the area's top (y 80). */
const progressBar = (fromX: number, width: number) => rectangle(fromX, 69, width, 5);
const presenceBar = (fromX: number, width: number) => rectangle(fromX, 74, width, 2);
const outline = (color: string) => ({
  op: 'strokePath',
  args: [[...SQUARE, SQUARE[0]], color, CAPTURE_OUTLINE_WIDTH],
});
const mark = (x: number) => ({
  op: 'strokePath',
  args: [
    [
      { x, y: 69 },
      { x, y: 74 },
    ],
    CAPTURE_CHECKPOINT_MARK_COLOR,
    1,
  ],
});

describe('CapturePointView', () => {
  it('outlines a neutral zone in the neutral colour over an empty progress and presence bar', () => {
    expect(draw(zone(capture())).calls).toEqual([
      outline(NEUTRAL_ENTITY_COLOR),
      { op: 'fillPolygon', args: [progressBar(65, 70), CAPTURE_BAR_BACKGROUND_COLOR] },
      mark(65 + 70 / 3),
      mark(65 + 140 / 3),
      { op: 'fillPolygon', args: [presenceBar(65, 70), CAPTURE_BAR_BACKGROUND_COLOR] },
    ]);
  });

  it("outlines the zone in its owner's team colour and fills the bar toward the leaning side", () => {
    const calls = draw(zone(capture({ owner: 'light', progress: -0.5 }))).calls;

    expect(calls[0]).toEqual(outline(TEAM_COLORS.light));
    expect(calls[2]).toEqual({ op: 'fillPolygon', args: [progressBar(65, 35), TEAM_COLORS.dark] });
  });

  it('fills the whole bar for a fully held zone', () => {
    const calls = draw(zone(capture({ owner: 'dark', progress: -1 }))).calls;

    expect(calls[2]).toEqual({ op: 'fillPolygon', args: [progressBar(65, 70), TEAM_COLORS.dark] });
    const light = draw(zone(capture({ owner: 'light', progress: 1 }))).calls;
    expect(light[2]).toEqual({ op: 'fillPolygon', args: [progressBar(65, 70), TEAM_COLORS.light] });
  });

  it('marks as many checkpoints as the snapshot says, not a fixed three', () => {
    const marks = (checkpoints: number) =>
      draw(zone(capture({ checkpoints }))).calls.filter(
        ({ op, args }) => op === 'strokePath' && args[1] === CAPTURE_CHECKPOINT_MARK_COLOR,
      ).length;

    expect(marks(3)).toBe(2);
    expect(marks(5)).toBe(4);
    expect(marks(1)).toBe(0);
  });

  it("splits the presence bar by each side's share: Light from the left, Dark from the right", () => {
    const calls = draw(zone(capture({ presence: { light: 10, dark: 2, neutral: 2 } }))).calls;

    expect(calls.slice(-4)).toEqual([
      { op: 'fillPolygon', args: [presenceBar(65, 70), CAPTURE_BAR_BACKGROUND_COLOR] },
      { op: 'fillPolygon', args: [presenceBar(65, 50), TEAM_COLORS.light] },
      { op: 'fillPolygon', args: [presenceBar(115, 10), NEUTRAL_ENTITY_COLOR] },
      { op: 'fillPolygon', args: [presenceBar(125, 10), TEAM_COLORS.dark] },
    ]);
  });

  it('outlines every polygon of a many-piece floor and puts the bars above the highest one', () => {
    const tower = rectangle(90, 60, 20, 20);
    const calls = draw(zone(capture(), [SQUARE, tower])).calls;

    expect(calls[1]).toEqual({
      op: 'strokePath',
      args: [[...tower, tower[0]], NEUTRAL_ENTITY_COLOR, CAPTURE_OUTLINE_WIDTH],
    });
    expect(calls[2]).toEqual({
      op: 'fillPolygon',
      args: [rectangle(65, 49, 70, 5), CAPTURE_BAR_BACKGROUND_COLOR],
    });
  });

  it('draws only the outline for a snapshot without capture state', () => {
    expect(draw(zone(null)).calls).toEqual([outline(NEUTRAL_ENTITY_COLOR)]);
  });
});
