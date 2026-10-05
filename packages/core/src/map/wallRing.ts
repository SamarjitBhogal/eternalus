import type { MapLayout } from '../content/maps/maps.types';
import { polarPoint } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { WallRing, WallRingPiece } from './MapBuilder.types';

type Arc = { readonly start: number; readonly end: number; readonly laneIndex?: number };

const DEGREES = Math.PI / 180;
/** Gates never take more than this share of the gap to their neighbour, so they never overlap. */
const MAX_GATE_SHARE_OF_GAP = 0.4;

const arcFootprint = (centre: Vec2, ring: MapLayout['wallRing'], arc: Arc): Polygon => {
  const inner = ring.radius - ring.thickness / 2;
  const outer = ring.radius + ring.thickness / 2;
  return [
    polarPoint(centre, inner, arc.start),
    polarPoint(centre, outer, arc.start),
    polarPoint(centre, outer, arc.end),
    polarPoint(centre, inner, arc.end),
  ];
};

const splitArc = (start: number, end: number, maxArc: number): Arc[] => {
  const count = Math.max(1, Math.ceil((end - start) / maxArc));
  const step = (end - start) / count;
  return Array.from({ length: count }, (_, index) => ({
    start: start + index * step,
    end: start + (index + 1) * step,
  }));
};

/** Each gate's arc and the wall arcs after it, going clockwise around the ring. */
const ringArcs = (gateAngles: readonly number[], ring: MapLayout['wallRing']): Arc[] => {
  const gates = gateAngles
    .map((angle, laneIndex) => ({ angle, laneIndex }))
    .sort((a, b) => a.angle - b.angle);
  const gaps = gates.map((gate, index) => {
    const next = gates[(index + 1) % gates.length] ?? gate;
    return next.angle - gate.angle + (index === gates.length - 1 ? 2 * Math.PI : 0);
  });
  const halfGate = Math.min(
    (ring.gateArcDegrees * DEGREES) / 2,
    Math.min(...gaps) * MAX_GATE_SHARE_OF_GAP,
  );
  return gates.flatMap((gate, index) => {
    const nextStart = gate.angle + (gaps[index] ?? 0) - halfGate;
    return [
      { start: gate.angle - halfGate, end: gate.angle + halfGate, laneIndex: gate.laneIndex },
      ...splitArc(gate.angle + halfGate, nextStart, ring.maxSegmentArcDegrees * DEGREES),
    ];
  });
};

/**
 * Builds a Light Stronghold's wall ring: one gate centred on each lane exit (`gateAngles[i]`
 * is lane `i`'s exit angle in radians), wall segments filling the rest, and the ring corners
 * where turrets stand. Gate count therefore always equals the lane count.
 */
export const buildWallRing = (
  centre: Vec2,
  gateAngles: readonly number[],
  ring: MapLayout['wallRing'],
): WallRing => {
  const arcs = ringArcs(gateAngles, ring);
  const pieces = arcs.map((arc): WallRingPiece => ({
    kind: arc.laneIndex === undefined ? 'wall-segment' : 'gate',
    ...(arc.laneIndex === undefined ? {} : { laneIndex: arc.laneIndex }),
    position: polarPoint(centre, ring.radius, (arc.start + arc.end) / 2),
    footprint: arcFootprint(centre, ring, arc),
  }));
  return { pieces, vertices: arcs.map((arc) => polarPoint(centre, ring.radius, arc.start)) };
};
