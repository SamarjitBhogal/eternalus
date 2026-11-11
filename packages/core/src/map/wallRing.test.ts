import { describe, expect, it } from 'vitest';

import { cos, sin } from '../utils/deterministicMath';
import { distance } from '../utils/geometry';
import { buildWallRing } from './wallRing';

const RING = {
  radius: 100,
  thickness: 10,
  exitArcDegrees: 140,
  gateArcDegrees: 24,
  maxSegmentArcDegrees: 45,
  minGateOpening: 12,
  laneApron: 20,
  frontArc: { verticalScale: 1.5, curveStepDegrees: 6 },
};
const CENTRE = { x: 0, y: 0 };

describe('buildWallRing', () => {
  it.each([1, 3, 5, 7])(
    'makes an open front arc with %i original lane gates, taller tips and no rear wall',
    (lanes) => {
      const exits = Array.from({ length: lanes }, (_, i) =>
        lanes === 1 ? 0 : ((-70 + (140 * i) / (lanes - 1)) * Math.PI) / 180,
      );
      const built = buildWallRing(CENTRE, exits, RING);
      expect(built.pieces.filter((piece) => piece.kind === 'gate')).toHaveLength(lanes);
      expect(built.vertices).toHaveLength(built.pieces.length + 1);
      expect(built.vertices[0]?.x).toBeCloseTo(0);
      expect(built.vertices[0]?.y).toBeCloseTo(-150);
      expect(built.vertices.at(-1)?.x).toBeCloseTo(0);
      expect(built.vertices.at(-1)?.y).toBeCloseTo(150);
      expect(built.pieces.some((piece) => piece.footprint.length > 4)).toBe(true);
      for (const gate of built.pieces.filter((piece) => piece.kind === 'gate')) {
        const angle = exits[gate.laneIndex ?? 0] ?? 0;
        expect(gate.position.x).toBeCloseTo(cos(angle) * RING.radius);
        expect(gate.position.y).toBeCloseTo(sin(angle) * RING.radius);
      }
      for (const piece of built.pieces)
        for (const point of piece.footprint) {
          expect(point.x).toBeGreaterThanOrEqual(-1e-9);
          expect(point.x).toBeLessThanOrEqual(105 + 1e-9);
          expect(Math.abs(point.y)).toBeLessThanOrEqual(157.5 + 1e-9);
        }
    },
  );
  it('puts one gate on each lane exit, in lane order', () => {
    const exits = [-1, 0, 1];
    const ring = buildWallRing(CENTRE, exits, RING);
    const gates = ring.pieces.filter((piece) => piece.kind === 'gate');

    expect(gates.map((gate) => gate.laneIndex)).toEqual([0, 1, 2]);
    gates.forEach((gate, index) => {
      const angle = exits[gate.laneIndex ?? index] ?? 0;
      expect(gate.position.x).toBeCloseTo(cos(angle) * RING.radius);
      expect(gate.position.y).toBeCloseTo(sin(angle) * RING.radius);
    });
  });

  it('reports each gate as wide as the chord of its arc', () => {
    const [gate] = buildWallRing(CENTRE, [0], RING).pieces.filter((piece) => piece.kind === 'gate');

    // A 24 degree gate on a ring of radius 100: chord = 2 x 100 x sin(12 degrees).
    expect(gate?.width).toBeCloseTo(41.58, 2);
  });

  it('has one corner per piece plus the far tip, on the ring inside the exit arc', () => {
    const ring = buildWallRing(CENTRE, [0], RING);
    // Inside ±exitArcDegrees/2 the arc keeps the ring radius; only the tips stretch, and only
    // in y (DEC-158), so x alone tells which corners are inside.
    const edgeX = cos(((RING.exitArcDegrees / 2) * Math.PI) / 180) * RING.radius;
    const front = ring.vertices.filter((vertex) => vertex.x >= edgeX - 1e-9);

    expect(ring.vertices).toHaveLength(ring.pieces.length + 1);
    expect(front.length).toBeGreaterThan(0);
    expect(front.every((vertex) => Math.abs(distance(vertex, CENTRE) - RING.radius) < 1e-9)).toBe(
      true,
    );
  });

  it('splits long wall arcs so no wall segment is wider than the maximum arc', () => {
    const ring = buildWallRing(CENTRE, [0], RING);
    const walls = ring.pieces.filter((piece) => piece.kind === 'wall-segment');

    // 180 - 24 = 156 degrees of wall, 78 on each side of the gate, at most 45 each: 4 segments.
    expect(walls).toHaveLength(4);
  });

  it('narrows gates that would overlap their neighbours', () => {
    const ring = buildWallRing(CENTRE, [0, 0.1], RING);
    const gates = ring.pieces.filter((piece) => piece.kind === 'gate');

    // The gap between the gates is 0.1 rad; each gate takes at most 40% of it on each side, so
    // each spans 0.08 rad (not 24 degrees) and the two cannot overlap.
    expect(gates).toHaveLength(2);
    for (const gate of gates) expect(gate.width).toBeCloseTo(2 * RING.radius * sin(0.04));
  });
});
