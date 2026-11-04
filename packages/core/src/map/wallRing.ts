import type { MapLayout } from '../content/maps/maps.types';
import { distance, polarPoint, RADIANS_PER_DEGREE } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { WallRing, WallRingPiece } from './MapBuilder.types';

type Arc = { readonly start: number; readonly end: number; readonly laneIndex?: number };

/** Gates never take more than this share of the gap to their neighbour, so they never overlap. */
const MAX_GATE_SHARE_OF_GAP = 0.4;

const boundaryPoint = (
  centre: Vec2,
  ring: MapLayout['wallRing'],
  radius: number,
  angle: number,
): Vec2 => {
  const point = polarPoint(centre, radius, angle);
  const unchanged = (ring.exitArcDegrees * RADIANS_PER_DEGREE) / 2;
  const t = Math.max(0, (Math.abs(angle) - unchanged) / (Math.PI / 2 - unchanged));
  const blend = t * t * (3 - 2 * t);
  const scaleY = 1 + ((ring.frontArc?.verticalScale ?? 1) - 1) * blend;
  return { x: point.x, y: centre.y + (point.y - centre.y) * scaleY };
};

const arcFootprint = (centre: Vec2, ring: MapLayout['wallRing'], arc: Arc): Polygon => {
  const inner = ring.radius - ring.thickness / 2;
  const outer = ring.radius + ring.thickness / 2;
  if (ring.frontArc !== undefined) {
    const count = Math.max(
      1,
      Math.ceil((arc.end - arc.start) / (ring.frontArc.curveStepDegrees * RADIANS_PER_DEGREE)),
    );
    const edge = (radius: number) =>
      Array.from({ length: count + 1 }, (_, i) =>
        boundaryPoint(centre, ring, radius, arc.start + ((arc.end - arc.start) * i) / count),
      );
    return [...edge(inner), ...edge(outer).reverse()];
  }
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
    (ring.gateArcDegrees * RADIANS_PER_DEGREE) / 2,
    Math.min(...gaps) * MAX_GATE_SHARE_OF_GAP,
  );
  if (ring.frontArc !== undefined) {
    const limit = Math.PI / 2;
    let nextWall = -limit;
    const arcs: Arc[] = [];
    for (const gate of gates) {
      const start = gate.angle - halfGate;
      if (start > nextWall)
        arcs.push(...splitArc(nextWall, start, ring.maxSegmentArcDegrees * RADIANS_PER_DEGREE));
      arcs.push({ start, end: gate.angle + halfGate, laneIndex: gate.laneIndex });
      nextWall = gate.angle + halfGate;
    }
    if (nextWall < limit)
      arcs.push(...splitArc(nextWall, limit, ring.maxSegmentArcDegrees * RADIANS_PER_DEGREE));
    return arcs;
  }
  return gates.flatMap((gate, index) => {
    const nextStart = gate.angle + (gaps[index] ?? 0) - halfGate;
    return [
      { start: gate.angle - halfGate, end: gate.angle + halfGate, laneIndex: gate.laneIndex },
      ...splitArc(gate.angle + halfGate, nextStart, ring.maxSegmentArcDegrees * RADIANS_PER_DEGREE),
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
    position: boundaryPoint(centre, ring, ring.radius, (arc.start + arc.end) / 2),
    width: distance(
      boundaryPoint(centre, ring, ring.radius, arc.start),
      boundaryPoint(centre, ring, ring.radius, arc.end),
    ),
    footprint: arcFootprint(centre, ring, arc),
  }));
  const vertices = arcs.map((arc) => boundaryPoint(centre, ring, ring.radius, arc.start));
  const last = arcs.at(-1);
  if (ring.frontArc !== undefined && last !== undefined)
    vertices.push(boundaryPoint(centre, ring, ring.radius, last.end));
  return { pieces, vertices };
};
