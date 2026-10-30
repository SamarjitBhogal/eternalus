import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { SweepContact } from './sweepCircle.types';

const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

const endpointContact = (
  start: Vec2,
  delta: Vec2,
  radius: number,
  point: Vec2,
): SweepContact | null => {
  const offset = { x: start.x - point.x, y: start.y - point.y };
  const a = dot(delta, delta);
  const b = dot(offset, delta);
  const c = dot(offset, offset) - radius * radius;
  const discriminant = b * b - a * c;
  if (a === 0 || discriminant < 0) return null;
  const time = (-b - Math.sqrt(discriminant)) / a;
  if (time < 0 || time > 1) return null;
  const normal = {
    x: (offset.x + delta.x * time) / radius,
    y: (offset.y + delta.y * time) / radius,
  };
  return dot(delta, normal) < 0 ? { time, normal } : null;
};

const edgeContact = (
  start: Vec2,
  delta: Vec2,
  radius: number,
  a: Vec2,
  b: Vec2,
): SweepContact | null => {
  const edge = { x: b.x - a.x, y: b.y - a.y };
  const length = Math.hypot(edge.x, edge.y);
  if (length === 0) return null;
  const normal = { x: -edge.y / length, y: edge.x / length };
  const offset = { x: start.x - a.x, y: start.y - a.y };
  const speed = dot(delta, normal);
  if (speed === 0) return null;
  const side = speed < 0 ? 1 : -1;
  const time = (side * radius - dot(offset, normal)) / speed;
  if (time < 0 || time > 1) return null;
  const along =
    ((offset.x + delta.x * time) * edge.x + (offset.y + delta.y * time) * edge.y) / length;
  if (along < 0 || along > length) return null;
  return { time, normal: { x: normal.x * side + 0, y: normal.y * side + 0 } };
};

/** Sweeps a circle against polygon edges and rounded corners, preventing thin-wall tunnelling. */
export const sweepCircle = (
  start: Vec2,
  delta: Vec2,
  radius: number,
  polygon: Polygon,
): SweepContact | null => {
  let first: SweepContact | null = null;
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    if (next === undefined) return;
    for (const contact of [
      endpointContact(start, delta, radius, point),
      edgeContact(start, delta, radius, point, next),
    ]) {
      if (contact !== null && (first === null || contact.time < first.time)) first = contact;
    }
  });
  return first;
};
