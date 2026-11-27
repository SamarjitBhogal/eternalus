import { createDefaultGameConfig, loadDisplayContent, type PlacedSummon } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import {
  AIM_CIRCLE_SEGMENTS,
  AIM_CONE_CIRCLE_COLORS,
  AIM_CONE_FAN_COLORS,
  AIM_OVERLAY_COLORS,
  AIM_OVERLAY_FILL_COLOR,
  AIM_OVERLAY_OUTLINE_COLOR,
  AIM_REFUSED_COLORS,
} from './AimOverlayView.constants';
import { AimOverlayView } from './AimOverlayView';
import type { AimStep, AimTarget, ShapePainters } from './AimOverlayView.types';
import { AIM_SHAPE_PAINTERS } from './aimShapePainters';

const ABILITIES = loadDisplayContent(createDefaultGameConfig().tickRate).abilities;
const ORIGIN = { x: 10, y: 20 };
/** The caster's body radius (a Sentinel's, DEC-06): a cone's reach counts from its edge. */
const CASTER_RADIUS = 1.25;

/**
 * The target of the shipped ability `abilityId` cast from (10, 20) toward `aim`, each dash going
 * `reach` metres (its whole distance by default, as on open ground), every step holding the
 * outline `placed` (none by default).
 */
const targetOf = (
  abilityId: string,
  aim: { x: number; y: number },
  reach?: number,
  placed: PlacedSummon | null = null,
): AimTarget => {
  const length = Math.hypot(aim.x - ORIGIN.x, aim.y - ORIGIN.y);
  const direction =
    length === 0
      ? { x: 0, y: 0 }
      : { x: (aim.x - ORIGIN.x) / length, y: (aim.y - ORIGIN.y) / length };
  const steps: AimStep[] = (ABILITIES.find(({ id }) => id === abilityId)?.steps ?? []).map(
    ({ shape, distance }) => ({
      shape: shape ?? null,
      reach: distance === undefined ? null : (reach ?? distance),
      placed,
    }),
  );
  return { origin: ORIGIN, casterRadius: CASTER_RADIUS, direction, steps };
};

/** Rip & Tear: a 90-degree fan 3 m past the body edge and the full circle of its range. */
const coneTarget = (aim: { x: number; y: number }): AimTarget => targetOf('rip-and-tear', aim);

const drawn = (target: AimTarget | null): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  const view = new AimOverlayView();
  view.show(target);
  view.draw(renderer);
  return renderer;
};

/** The corners of every filled polygon, in drawing order. */
const fills = (renderer: RecordingRenderer) =>
  renderer.calls.flatMap((call) => (call.op === 'fillPolygon' ? [call.args[0]] : []));

const radiusOf = (points: readonly { x: number; y: number }[], centre: { x: number; y: number }) =>
  points.map(({ x, y }) => Math.hypot(x - centre.x, y - centre.y));

describe('AimOverlayView', () => {
  it('draws a circle of the ability’s radius on the caster for Slam (4 m)', () => {
    const renderer = drawn(targetOf('slam', { x: 30, y: 20 }));

    const [circle, ...rest] = fills(renderer);
    expect(rest).toEqual([]);
    expect(circle).toHaveLength(AIM_CIRCLE_SEGMENTS);
    for (const radius of radiusOf(circle ?? [], { x: 10, y: 20 })) {
      expect(radius).toBeCloseTo(4);
    }
    expect(renderer.calls.map((call) => call.op)).toEqual(['fillPolygon', 'strokePath']);
  });

  it('draws the Shockwave circle (5 m) on the caster whatever the pointer does', () => {
    for (const aim of [
      { x: 10, y: 20 },
      { x: -50, y: 7 },
    ]) {
      const [circle] = fills(drawn(targetOf('shockwave', aim)));
      for (const radius of radiusOf(circle ?? [], { x: 10, y: 20 })) {
        expect(radius).toBeCloseTo(5);
      }
    }
  });

  it('colours the fill and the outline from the overlay constants', () => {
    const renderer = drawn(targetOf('slam', { x: 30, y: 20 }));

    expect(renderer.calls[0]?.args[1]).toBe(AIM_OVERLAY_FILL_COLOR);
    expect(renderer.calls[1]?.args[1]).toBe(AIM_OVERLAY_OUTLINE_COLOR);
  });

  it('draws Blade Runner as the dash path toward the pointer, then the end circle', () => {
    // Pointer straight along +x: an 8 m path 1.5 m wide from (10, 20), then the 1.5 m end circle.
    const renderer = drawn(targetOf('blade-runner', { x: 100, y: 20 }));

    const [path, endCircle, ...rest] = fills(renderer);
    expect(rest).toEqual([]);
    expect(path).toEqual([
      { x: 10, y: 20.75 },
      { x: 18, y: 20.75 },
      { x: 18, y: 19.25 },
      { x: 10, y: 19.25 },
    ]);
    for (const radius of radiusOf(endCircle ?? [], { x: 18, y: 20 })) {
      expect(radius).toBeCloseTo(1.5);
    }
  });

  it('turns the Blade Runner path with the pointer and draws each distinct area once', () => {
    const [path] = fills(drawn(targetOf('blade-runner', { x: 10, y: 90 })));

    expect(path?.map(({ x, y }) => [Math.round(x * 100) / 100, y])).toEqual([
      [9.25, 20],
      [9.25, 28],
      [10.75, 28],
      [10.75, 20],
    ]);
    expect(fills(drawn(targetOf('blade-runner', { x: 100, y: 20 })))).toHaveLength(2);
  });

  it('draws only the end circle for a dash aimed at the caster itself (no direction)', () => {
    const polygons = fills(drawn(targetOf('blade-runner', { x: 10, y: 20 })));

    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveLength(AIM_CIRCLE_SEGMENTS);
  });

  it('ends the path and moves the end circle to where the target says the dash stops', () => {
    // A wall 3 m along the way: the dash reaches 3 of its 8 m.
    const [path, endCircle] = fills(drawn(targetOf('blade-runner', { x: 100, y: 20 }, 3)));

    expect(path).toEqual([
      { x: 10, y: 20.75 },
      { x: 13, y: 20.75 },
      { x: 13, y: 19.25 },
      { x: 10, y: 19.25 },
    ]);
    for (const radius of radiusOf(endCircle ?? [], { x: 13, y: 20 })) {
      expect(radius).toBeCloseTo(1.5);
    }
  });

  it("draws no area for a dash's own row, which still moves the end circle to its reach", () => {
    const target: AimTarget = {
      origin: ORIGIN,
      casterRadius: CASTER_RADIUS,
      direction: { x: 1, y: 0 },
      steps: [
        { shape: null, reach: 3, placed: null },
        { shape: { kind: 'circle', radius: 1.5 }, reach: null, placed: null },
      ],
    };

    const [endCircle, ...rest] = fills(drawn(target));

    expect(rest).toEqual([]);
    for (const radius of radiusOf(endCircle ?? [], { x: 13, y: 20 })) {
      expect(radius).toBeCloseTo(1.5);
    }
  });

  it('draws Rip & Tear as a darker-blue fan toward the pointer and a lighter-blue circle of its range (DEC-206 (3))', () => {
    // 3 m past the 1.25 m body (DEC-319): 4.25 m from the caster's centre; the fan 90 degrees wide.
    const renderer = drawn(coneTarget({ x: 30, y: 20 }));

    const [fan, circle, ...rest] = fills(renderer);
    expect(rest).toEqual([]);
    expect(fan?.[0]).toEqual(ORIGIN);
    const rim = fan?.slice(1) ?? [];
    for (const radius of radiusOf(rim, ORIGIN)) {
      expect(radius).toBeCloseTo(4.25);
    }
    const angles = rim.map(({ x, y }) => (Math.atan2(y - ORIGIN.y, x - ORIGIN.x) * 180) / Math.PI);
    expect(angles[0]).toBeCloseTo(-45);
    expect(angles.at(-1)).toBeCloseTo(45);
    expect(circle).toHaveLength(AIM_CIRCLE_SEGMENTS);
    for (const radius of radiusOf(circle ?? [], ORIGIN)) {
      expect(radius).toBeCloseTo(4.25);
    }
    const colours = renderer.calls.map(({ args }) => args[1]);
    expect(colours).toEqual([
      AIM_CONE_FAN_COLORS.fill,
      AIM_CONE_FAN_COLORS.outline,
      AIM_CONE_CIRCLE_COLORS.fill,
      AIM_CONE_CIRCLE_COLORS.outline,
    ]);
  });

  it('turns the fan with the pointer, and draws only the circle with the pointer on the caster', () => {
    const [north] = fills(drawn(coneTarget({ x: 10, y: 90 })));
    const rim = north?.slice(1) ?? [];
    const angles = rim.map(({ x, y }) => (Math.atan2(y - ORIGIN.y, x - ORIGIN.x) * 180) / Math.PI);

    expect(angles[0]).toBeCloseTo(45);
    expect(angles.at(-1)).toBeCloseTo(135);
    const onCaster = fills(drawn(coneTarget(ORIGIN)));
    expect(onCaster).toHaveLength(1);
    expect(onCaster[0]).toHaveLength(AIM_CIRCLE_SEGMENTS);
  });

  it('draws Shield Wall as exactly the outline core placed (HC-S15)', () => {
    const placed: PlacedSummon = {
      outline: [
        { x: 12.5, y: 18 },
        { x: 13.5, y: 18 },
        { x: 13.5, y: 22 },
        { x: 12.5, y: 22 },
      ],
      isBlocked: false,
    };

    const recording = drawn(targetOf('shield-wall', { x: 30, y: 20 }, undefined, placed));

    expect(fills(recording)).toEqual([placed.outline]);
    expect(recording.calls.map(({ args }) => args[1])).toEqual([
      AIM_OVERLAY_COLORS.fill,
      AIM_OVERLAY_COLORS.outline,
    ]);
  });

  it('draws the Shield Wall outline in red where the cast is refused (DEC-382, HC-B43 (7))', () => {
    const outline = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 5 },
    ];
    const colours = (isBlocked: boolean) =>
      drawn(targetOf('shield-wall', { x: 30, y: 20 }, undefined, { outline, isBlocked })).calls.map(
        ({ args }) => args[1],
      );

    expect(colours(true)).toEqual([AIM_REFUSED_COLORS.fill, AIM_REFUSED_COLORS.outline]);
    expect(colours(false)).toEqual([AIM_OVERLAY_COLORS.fill, AIM_OVERLAY_COLORS.outline]);
  });

  it('draws no Shield Wall outline when core placed none', () => {
    expect(drawn(targetOf('shield-wall', ORIGIN)).calls).toEqual([]);
  });

  it('draws nothing without a target, as in quick cast or with no ability selected', () => {
    expect(drawn(null).calls).toEqual([]);
  });

  it('draws nothing on the minimap', () => {
    const view = new AimOverlayView();
    view.show(targetOf('slam', { x: 30, y: 20 }));
    expect(() => {
      view.drawMinimap();
    }).not.toThrow();
  });

  it('draws each shape kind through its own painter, so a new kind is one more painter', () => {
    const calls: string[] = [];
    const painters: ShapePainters = {
      ...AIM_SHAPE_PAINTERS,
      circle: (shape, frame) => {
        calls.push(`circle ${String(shape.radius)} at ${String(frame.circleCentre.x)}`);
      },
    };
    const view = new AimOverlayView(painters);
    view.show({
      origin: ORIGIN,
      casterRadius: CASTER_RADIUS,
      direction: { x: 1, y: 0 },
      steps: [{ shape: { kind: 'circle', radius: 2 }, reach: null, placed: null }],
    });
    view.draw(new RecordingRenderer());

    expect(calls).toEqual(['circle 2 at 10']);
  });
});
