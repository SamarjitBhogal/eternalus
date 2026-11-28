import { describe, expect, it } from 'vitest';

import { RecordingRenderer } from '../engine/render/RecordingRenderer';
import type { RecordedCall } from '../engine/render/RecordingRenderer.types';
import type { WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import { auraRing } from './auraRing';
import type { EntityDrawState } from './EntityView.types';
import {
  STRUCTURE_AURA_FIELD,
  STRUCTURE_AURA_PARTICLES,
  STRUCTURE_AURA_RING_ALPHA,
  STRUCTURE_MARKERS,
} from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';
import { StructureView } from './StructureView';

/** A 56 by 40 m fort box round the tower at (5, 6). */
const FORT_BOX: WorldRect = { x: -23, y: -14, width: 56, height: 40 };

const structure = (
  kind: string,
  health: { current: number; max: number } | null = { current: 3000, max: 3000 },
  aura: { radius: number; box: WorldRect } | null = null,
  time = 0,
): EntityDrawState => ({
  entity: {
    id: 'entity-1',
    kind,
    family: 'structure',
    definitionId: kind,
    team: 'light',
    transform: { x: 5, y: 6, radius: 3, facing: { x: 1, y: 0 } },
    health,
    elevation: null,
    progression: null,
    aether: null,
    area: null,
    capture: null,
    aura,
    gem: null,
  },
  position: { x: 5, y: 6 },
  facing: { x: 1, y: 0 },
  isFocused: false,
  frameTick: 0,
  time,
});

const BUFF_TOWER = (time = 0) =>
  structure('buff-tower', { current: 2500, max: 2500 }, { radius: 12, box: FORT_BOX }, time);

/** The ground calls of one structure, from a fresh view. */
const groundCalls = (state: EntityDrawState): RecordedCall[] => {
  const renderer = new RecordingRenderer();
  new StructureView().drawGround(state, renderer);
  return renderer.calls;
};

/** Where the particles were drawn. */
const particlesOf = (calls: readonly RecordedCall[]): WorldPoint[] =>
  calls.flatMap((call) => (call.op === 'drawWorldGlyph' ? [call.args[1]] : []));

describe('StructureView', () => {
  it.each(['spawner-tower', 'buff-tower'])('draws the %s marker in its team colour', (kind) => {
    const renderer = new RecordingRenderer();
    new StructureView().draw(structure(kind), renderer);
    expect(renderer.calls).toEqual([
      { op: 'drawWorldGlyph', args: [STRUCTURE_MARKERS[kind], { x: 5, y: 6 }, TEAM_COLORS.light] },
    ]);
  });

  it('draws only the marker in the entity pass, the field being on the ground (DEC-323 (3))', () => {
    const renderer = new RecordingRenderer();
    new StructureView().draw(BUFF_TOWER(), renderer);
    expect(renderer.calls).toEqual([
      {
        op: 'drawWorldGlyph',
        args: [STRUCTURE_MARKERS['buff-tower'], { x: 5, y: 6 }, TEAM_COLORS.light],
      },
    ]);
  });

  it('fills one field and strokes one closed ring round the box grown by the radius, in the team colour (DEC-323 (3))', () => {
    const calls = groundCalls(BUFF_TOWER());
    const ring = auraRing(FORT_BOX, 12, STRUCTURE_AURA_FIELD.cornerSegments);

    expect(calls.map(({ op }) => op)).toEqual([
      'fillPolygon',
      'strokePath',
      ...Array.from({ length: STRUCTURE_AURA_PARTICLES.count }, () => 'drawWorldGlyph'),
    ]);
    expect(calls[0]).toEqual({
      op: 'fillPolygon',
      args: [ring.points, `${TEAM_COLORS.light}${STRUCTURE_AURA_FIELD.fillAlpha}`],
    });
    expect(calls[1]).toEqual({
      op: 'strokePath',
      args: [
        ring.points,
        `${TEAM_COLORS.light}${STRUCTURE_AURA_RING_ALPHA}`,
        STRUCTURE_AURA_FIELD.ringWidth,
      ],
    });
    const [first] = ring.points;
    expect(ring.points.at(-1)).toEqual(first);
    const xs = ring.points.map(({ x }) => x);
    const ys = ring.points.map(({ y }) => y);
    expect([Math.min(...xs), Math.max(...xs)]).toEqual([-35, 45]);
    expect(Math.min(...ys)).toBeCloseTo(-26);
    expect(Math.max(...ys)).toBeCloseTo(38);
  });

  it('draws the particle count of small dots on the ring, in the team colour (DEC-323 (3))', () => {
    const calls = groundCalls(BUFF_TOWER());
    const dots = calls.filter((call) => call.op === 'drawWorldGlyph');

    expect(dots).toHaveLength(STRUCTURE_AURA_PARTICLES.count);
    for (const dot of dots) {
      expect(dot.args[0]).toEqual({ shape: 'dot', size: STRUCTURE_AURA_PARTICLES.size });
      expect(dot.args[2]).toBe(`${TEAM_COLORS.light}${STRUCTURE_AURA_PARTICLES.alpha}`);
    }
    // On the ring: within the radius of the box, never inside it by more than float noise.
    for (const { x, y } of particlesOf(calls)) {
      const dx = Math.max(FORT_BOX.x - x, 0, x - (FORT_BOX.x + FORT_BOX.width));
      const dy = Math.max(FORT_BOX.y - y, 0, y - (FORT_BOX.y + FORT_BOX.height));
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(12 + 1e-9);
      expect(Math.hypot(dx, dy)).toBeGreaterThan(12 - 0.5);
    }
  });

  it('moves the particles along the ring as time passes, the same at the same time', () => {
    const start = particlesOf(groundCalls(BUFF_TOWER(0)));
    const later = particlesOf(groundCalls(BUFF_TOWER(30)));

    expect(particlesOf(groundCalls(BUFF_TOWER(30)))).toEqual(later);
    later.forEach((point, index) => {
      const from = start[index] ?? { x: Number.NaN, y: Number.NaN };
      expect(Math.hypot(point.x - from.x, point.y - from.y)).toBeGreaterThan(0);
      expect(Math.hypot(point.x - from.x, point.y - from.y)).toBeLessThanOrEqual(
        30 * STRUCTURE_AURA_PARTICLES.speed + 1e-9,
      );
    });
  });

  it('draws a circle round the centre of a structure measured from its centre (a box of no size)', () => {
    const calls = groundCalls(
      structure(
        'buff-tower',
        { current: 2500, max: 2500 },
        { radius: 12, box: { x: 5, y: 6, width: 0, height: 0 } },
      ),
    );
    const fill = calls[0];

    expect(fill?.op).toBe('fillPolygon');
    for (const { x, y } of fill?.op === 'fillPolygon' ? fill.args[0] : []) {
      expect(Math.hypot(x - 5, y - 6)).toBeCloseTo(12);
    }
  });

  it('builds the field once per structure and reuses it on the next frames', () => {
    const renderer = new RecordingRenderer();
    const view = new StructureView();
    view.drawGround(BUFF_TOWER(0), renderer);
    view.drawGround(BUFF_TOWER(1), renderer);

    const fills = renderer.calls.flatMap((call) =>
      call.op === 'fillPolygon' ? [call.args[0]] : [],
    );
    expect(fills).toHaveLength(2);
    expect(fills[1]).toBe(fills[0]);
  });

  it('draws no field for a tower without an aura, as a spawner tower', () => {
    expect(groundCalls(structure('spawner-tower'))).toEqual([]);
  });

  it('draws no field for a fallen tower that still carries an aura', () => {
    expect(
      groundCalls(
        structure('buff-tower', { current: 0, max: 2500 }, { radius: 12, box: FORT_BOX }),
      ),
    ).toEqual([]);
  });

  it('draws a spawner tower and a buff tower differently', () => {
    expect(STRUCTURE_MARKERS['spawner-tower']?.shape).not.toBe(
      STRUCTURE_MARKERS['buff-tower']?.shape,
    );
  });

  it('draws nothing for a dead tower', () => {
    const renderer = new RecordingRenderer();
    new StructureView().draw(structure('buff-tower', { current: 0, max: 2500 }), renderer);
    expect(renderer.calls).toEqual([]);
  });

  it('draws nothing for a structure kind without a marker, and nothing on the minimap', () => {
    const renderer = new RecordingRenderer();
    const view = new StructureView();
    view.draw(structure('gate'), renderer);
    view.drawMinimap();
    expect(renderer.calls).toEqual([]);
  });
});
