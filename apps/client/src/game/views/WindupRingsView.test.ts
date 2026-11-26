import type { EntitySnapshot, StatusSnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import { LEGEND_OUTLINE_SCALE } from './entityViews.constants';
import { WindupRingsView } from './WindupRingsView';
import {
  WINDUP_RING_COLOR,
  WINDUP_RING_COUNT,
  WINDUP_RING_SPACING,
  WINDUP_RING_START_SCALE,
} from './WindupRingsView.constants';

const EAST = { x: 1, y: 0 };
const DRAWN_AT = { x: 10, y: 20 };

/** A Legend 0.5 in radius. */
const LEGEND: EntitySnapshot = {
  id: 'entity-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.5, facing: EAST },
  health: { current: 10, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  gem: null,
};

/** The wind-up `ticksActive` ticks in, of the 9 it lasts. */
const windup = (ticksActive: number): StatusSnapshot => ({
  id: 'fury-windup',
  ticksActive,
  ticksLeft: 9 - ticksActive,
});

/** What `WindupRingsView` draws for `status` on `entity` at `DRAWN_AT`, in order. */
const draw = (status: StatusSnapshot, entity = LEGEND): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  new WindupRingsView().draw(
    { entity, position: DRAWN_AT, facing: EAST, isFocused: false },
    status,
    renderer,
  );
  return renderer;
};

/** Each call `WindupRingsView` makes for `status` on `entity`: its name and arguments. */
const rings = (status: StatusSnapshot, entity = LEGEND): unknown[][] =>
  draw(status, entity).calls.map((call) => [call.op, ...call.args]);

/** The ring sizes for a wind-up `passed` of the way through: diameter 1 times each ring's scale. */
const sizesAt = (passed: number): number[] =>
  Array.from({ length: WINDUP_RING_COUNT }, (_, ring) => {
    const start = WINDUP_RING_START_SCALE + ring * WINDUP_RING_SPACING;
    return start + (LEGEND_OUTLINE_SCALE - start) * passed;
  });

describe('WindupRingsView', () => {
  it('draws the orange rings around the Legend, a short way out as the wind-up starts', () => {
    expect(rings(windup(0))).toEqual(
      sizesAt(0).map((size) => [
        'drawWorldGlyph',
        { shape: 'ring', size },
        DRAWN_AT,
        WINDUP_RING_COLOR,
      ]),
    );
    expect(sizesAt(0)[0]).toBeGreaterThan(LEGEND_OUTLINE_SCALE);
  });

  it('closes the rings in on the Legend as the wind-up passes', () => {
    const sizes = (ticksActive: number): number[] =>
      draw(windup(ticksActive)).calls.flatMap((call) =>
        call.op === 'drawWorldGlyph' ? [call.args[0].size] : [],
      );

    const [start, third, last] = [sizes(0), sizes(3), sizes(8)];

    expect(third).toEqual(sizesAt(3 / 9));
    expect(last).toEqual(sizesAt(8 / 9));
    for (let ring = 0; ring < WINDUP_RING_COUNT; ring += 1) {
      expect(third[ring]).toBeLessThan(start[ring] ?? Number.NaN);
      expect(last[ring]).toBeLessThan(third[ring] ?? Number.NaN);
    }
  });

  it('draws nothing for a wind-up with no end or on a Legend with no place', () => {
    expect(rings({ ...windup(2), ticksLeft: null })).toEqual([]);
    expect(rings(windup(2), { ...LEGEND, transform: null })).toEqual([]);
  });
});
