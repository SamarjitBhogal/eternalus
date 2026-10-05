import { describe, expect, it } from 'vitest';

import { distance } from '../utils/geometry';
import { buildWallRing } from './wallRing';

const RING = {
  radius: 100,
  thickness: 10,
  exitArcDegrees: 140,
  gateArcDegrees: 24,
  maxSegmentArcDegrees: 45,
  minGateOpening: 12,
};
const CENTRE = { x: 0, y: 0 };

describe('buildWallRing', () => {
  it('puts one gate on each lane exit, in lane order', () => {
    const exits = [-1, 0, 1];
    const ring = buildWallRing(CENTRE, exits, RING);
    const gates = ring.pieces.filter((piece) => piece.kind === 'gate');

    expect(gates.map((gate) => gate.laneIndex)).toEqual([0, 1, 2]);
    gates.forEach((gate, index) => {
      const angle = exits[gate.laneIndex ?? index] ?? 0;
      expect(gate.position.x).toBeCloseTo(Math.cos(angle) * RING.radius);
      expect(gate.position.y).toBeCloseTo(Math.sin(angle) * RING.radius);
    });
  });

  it('reports each gate as wide as the chord of its arc', () => {
    const [gate] = buildWallRing(CENTRE, [0], RING).pieces.filter((piece) => piece.kind === 'gate');

    // A 24 degree gate on a ring of radius 100: chord = 2 x 100 x sin(12 degrees).
    expect(gate?.width).toBeCloseTo(41.58, 2);
  });

  it('has one corner per piece, all on the ring', () => {
    const ring = buildWallRing(CENTRE, [0], RING);

    expect(ring.vertices).toHaveLength(ring.pieces.length);
    expect(
      ring.vertices.every((vertex) => Math.abs(distance(vertex, CENTRE) - RING.radius) < 1e-9),
    ).toBe(true);
  });

  it('splits long wall arcs so no wall segment is wider than the maximum arc', () => {
    const ring = buildWallRing(CENTRE, [0], RING);
    const walls = ring.pieces.filter((piece) => piece.kind === 'wall-segment');

    // 360 - 24 = 336 degrees of wall, at most 45 degrees each: 8 segments.
    expect(walls).toHaveLength(8);
  });

  it('narrows gates that would overlap their neighbours', () => {
    const ring = buildWallRing(CENTRE, [0, 0.1], RING);
    const gates = ring.pieces.filter((piece) => piece.kind === 'gate');
    const [first, second] = gates.map((gate) => gate.footprint);

    // The gap between the gates is 0.1 rad; gates take at most 40% of it each side.
    expect(first?.[2]?.x).toBeGreaterThan(second?.[1]?.x ?? Number.POSITIVE_INFINITY);
  });
});
