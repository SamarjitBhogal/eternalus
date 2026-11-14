import {
  type AbilityDisplay,
  type AbilitySlotSnapshot,
  type EntitySnapshot,
  loadDisplayContent,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { HudSlotId } from '../../bridge/Binding.types';
import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import {
  AIM_CIRCLE_SEGMENTS,
  AIM_OVERLAY_FILL_COLOR,
  AIM_OVERLAY_OUTLINE_COLOR,
} from './AimOverlayView.constants';
import { AimOverlayView } from './AimOverlayView';
import type { DashReach, ShapePainters } from './AimOverlayView.types';
import { AIM_SHAPE_PAINTERS } from './aimShapePainters';

const ABILITIES = loadDisplayContent().abilities;
/** No wall: a dash goes its whole distance. */
const OPEN_GROUND: DashReach = (_origin, _direction, distance) => distance;
const CASTER: EntitySnapshot = {
  id: 'legend-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 10, y: 20, radius: 0.5 },
  health: { current: 1, max: 1 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
};

const slot = (id: HudSlotId, abilityId: string | null): AbilitySlotSnapshot => ({
  slot: id,
  abilityId,
  cooldownRemainingTicks: 0,
  cooldownTicks: 0,
  aetherCost: 0,
  charge: null,
  isReady: true,
  blockedBy: null,
});

const snapshotWith = (abilityId: string | null): Snapshot =>
  ({
    tick: 0,
    entities: [CASTER],
    player: { entityId: CASTER.id, slots: [slot('ability-1', abilityId)] },
  }) as unknown as Snapshot;

const drawn = (
  abilityId: string | null,
  selected: HudSlotId | null,
  aim: { x: number; y: number } | null,
  options: { playerId?: string | null; reach?: DashReach } = {},
): RecordingRenderer => {
  const renderer = new RecordingRenderer();
  const view = new AimOverlayView(
    ABILITIES,
    options.playerId === undefined ? CASTER.id : options.playerId,
    options.reach ?? OPEN_GROUND,
  );
  view.show(snapshotWith(abilityId), selected, aim);
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
    const renderer = drawn('slam', 'ability-1', { x: 30, y: 20 });

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
      const [circle] = fills(drawn('shockwave', 'ability-1', aim));
      for (const radius of radiusOf(circle ?? [], { x: 10, y: 20 })) {
        expect(radius).toBeCloseTo(5);
      }
    }
  });

  it('colours the fill and the outline from the overlay constants', () => {
    const renderer = drawn('slam', 'ability-1', { x: 30, y: 20 });

    expect(renderer.calls[0]?.args[1]).toBe(AIM_OVERLAY_FILL_COLOR);
    expect(renderer.calls[1]?.args[1]).toBe(AIM_OVERLAY_OUTLINE_COLOR);
  });

  it('draws Blade Runner as the dash path toward the pointer, then the end circle', () => {
    // Pointer straight along +x: an 8 m path 1.5 m wide from (10, 20), then the 1.5 m end circle.
    const renderer = drawn('blade-runner', 'ability-1', { x: 100, y: 20 });

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
    const [path] = fills(drawn('blade-runner', 'ability-1', { x: 10, y: 90 }));

    expect(path?.map(({ x, y }) => [Math.round(x * 100) / 100, y])).toEqual([
      [9.25, 20],
      [9.25, 28],
      [10.75, 28],
      [10.75, 20],
    ]);
    expect(fills(drawn('blade-runner', 'ability-1', { x: 100, y: 20 }))).toHaveLength(2);
  });

  it('draws only the end circle for a dash aimed at the caster itself (no direction)', () => {
    const polygons = fills(drawn('blade-runner', 'ability-1', { x: 10, y: 20 }));

    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveLength(AIM_CIRCLE_SEGMENTS);
  });

  it('ends the path and moves the end circle to where a wall stops the dash', () => {
    // A wall 3 m along the way: the simulation says the dash reaches 3 of its 8 m.
    const asked: unknown[] = [];
    const reach: DashReach = (origin, direction, distance) => {
      asked.push([origin, direction, distance]);
      return 3;
    };
    const [path, endCircle] = fills(
      drawn('blade-runner', 'ability-1', { x: 100, y: 20 }, { reach }),
    );

    expect(asked).toEqual([[{ x: 10, y: 20 }, { x: 1, y: 0 }, 8]]);
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

  it('does not ask the simulation for a caster-centred ability', () => {
    const reach: DashReach = () => {
      throw new Error('asked');
    };

    expect(() => drawn('slam', 'ability-1', { x: 30, y: 20 }, { reach })).not.toThrow();
  });

  it('draws nothing while no slot is selected, as in quick cast', () => {
    expect(drawn('slam', null, { x: 30, y: 20 }).calls).toEqual([]);
  });

  it('draws nothing without a pointer point, for an empty slot, an unknown ability or no Legend', () => {
    expect(drawn('slam', 'ability-1', null).calls).toEqual([]);
    expect(drawn(null, 'ability-1', { x: 1, y: 1 }).calls).toEqual([]);
    expect(drawn('no-such-ability', 'ability-1', { x: 1, y: 1 }).calls).toEqual([]);
    expect(drawn('slam', 'ability-1', { x: 1, y: 1 }, { playerId: null }).calls).toEqual([]);
    expect(drawn('slam', 'ability-2', { x: 1, y: 1 }).calls).toEqual([]);
  });

  it('draws nothing on the minimap', () => {
    const view = new AimOverlayView(ABILITIES, CASTER.id, OPEN_GROUND);
    view.show(snapshotWith('slam'), 'ability-1', { x: 30, y: 20 });
    expect(() => {
      view.drawMinimap();
    }).not.toThrow();
  });

  it('draws each shape kind through its own painter, so a new kind is one more painter', () => {
    // A cone would be one more key of `ShapePainters` and one more painter; the view is unchanged.
    const probe: AbilityDisplay = {
      id: 'probe',
      displayName: 'Probe',
      description: '',
      classId: 'warrior',
      slot: 'ability',
      aetherCost: 0,
      cooldownSeconds: 0,
      isAvailable: true,
      steps: [{ kind: 'damage', shape: { kind: 'circle', radius: 2 } }],
    };
    const calls: string[] = [];
    const painters: ShapePainters = {
      ...AIM_SHAPE_PAINTERS,
      circle: (shape, frame) => {
        calls.push(`circle ${String(shape.radius)} at ${String(frame.circleCentre.x)}`);
      },
    };
    const view = new AimOverlayView([probe], CASTER.id, OPEN_GROUND, painters);
    view.show(snapshotWith('probe'), 'ability-1', { x: 30, y: 20 });
    view.draw(new RecordingRenderer());

    expect(calls).toEqual(['circle 2 at 10']);
  });
});
