import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import {
  FACING_CHEVRON,
  FOCUS_RING_SCALE,
  LEGEND_OUTLINE_SCALE,
  MOB_OUTLINE_SCALE,
} from './entityViews.constants';
import { drawFacingChevron } from './facingChevron';

const RADIUS = 0.5;

const AT = { x: 10, y: 20 };

const UNIT: EntitySnapshot = {
  id: 'entity-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'dark',
  transform: { x: AT.x, y: AT.y, radius: RADIUS, facing: { x: 1, y: 0 } },
  health: null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
};

/** The points of the one path the chevron draws for `facing`. */
const chevron = (facing: WorldPoint): readonly WorldPoint[] => {
  const renderer = new RecordingRenderer();
  drawFacingChevron({ entity: UNIT, position: AT, facing, isFocused: false }, renderer);
  const [call, ...rest] = renderer.calls;
  expect(rest).toEqual([]);
  if (call?.op !== 'strokePath')
    throw new Error(`expected one strokePath, got ${String(call?.op)}`);
  expect(call.args.slice(1)).toEqual([FACING_CHEVRON.color, FACING_CHEVRON.lineWidth]);
  return call.args[0];
};

/** `point` relative to the unit's centre, in unit radii: along `facing` and its distance. */
const local = (point: WorldPoint, facing: WorldPoint) => {
  const dx = point.x - AT.x;
  const dy = point.y - AT.y;
  return {
    forward: (dx * facing.x + dy * facing.y) / RADIUS,
    distance: Math.hypot(dx, dy) / RADIUS,
  };
};

describe('drawFacingChevron (DEC-192)', () => {
  it.each([
    ['south', { x: 0, y: 1 }],
    ['west', { x: -1, y: 0 }],
    ['north-east', { x: Math.SQRT1_2, y: -Math.SQRT1_2 }],
  ])('draws one gold line from a tip in front of the unit, facing %s', (_, facing) => {
    const points = chevron(facing);

    const tip = points[0];
    expect(points.at(-1)).toEqual(tip);
    expect(tip?.x).toBeCloseTo(AT.x + facing.x * FACING_CHEVRON.tip * RADIUS);
    expect(tip?.y).toBeCloseTo(AT.y + facing.y * FACING_CHEVRON.tip * RADIUS);
    // Every point is in front of the unit, the tip furthest forward.
    for (const point of points) {
      const { forward } = local(point, facing);
      expect(forward).toBeGreaterThan(0);
      expect(forward).toBeLessThanOrEqual(FACING_CHEVRON.tip + 1e-9);
    }
  });

  it('closes the arms with an arc around the centre, outside the outlines, inside the focus ring', () => {
    const points = chevron({ x: 0, y: 1 });
    const arc = points.slice(1, -1);
    const arcRadius = Math.hypot(FACING_CHEVRON.base, FACING_CHEVRON.halfWidth);

    expect(arc).toHaveLength(FACING_CHEVRON.arcSegments + 1);
    for (const point of arc) {
      expect(local(point, { x: 0, y: 1 }).distance).toBeCloseTo(arcRadius);
    }
    // The arc's ends sit half a width either side of the facing line, mirrored.
    expect(arc[0]?.x).toBeCloseTo(AT.x - FACING_CHEVRON.halfWidth * RADIUS);
    expect(arc.at(-1)?.x).toBeCloseTo(AT.x + FACING_CHEVRON.halfWidth * RADIUS);
    for (const point of points) {
      const { distance } = local(point, { x: 0, y: 1 });
      expect(distance).toBeGreaterThan(Math.max(LEGEND_OUTLINE_SCALE, MOB_OUTLINE_SCALE));
      expect(distance).toBeLessThan(FOCUS_RING_SCALE);
    }
  });

  it('draws nothing for an entity without a transform', () => {
    const renderer = new RecordingRenderer();

    drawFacingChevron(
      {
        entity: { ...UNIT, transform: null },
        position: AT,
        facing: { x: 1, y: 0 },
        isFocused: false,
      },
      renderer,
    );

    expect(renderer.calls).toEqual([]);
  });
});
