import { describe, expect, it } from 'vitest';
import { doesCircleOverlapPolygon } from '../utils/circlePolygon';
import { CollisionResolver } from './CollisionResolver';
import { StaticCollisionIndex } from './StaticCollisionIndex';

/** Bounds far from every wall here, so only the walls stop a circle. */
const OPEN = { x: -1000, y: -1000, width: 2000, height: 2000 };

const rect = (x: number, y: number, width: number, height: number) => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

describe('CollisionResolver', () => {
  it('allows bridge crossings but prevents stepping sideways off the deck into lava', () => {
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([
        { id: 'lava', polygon: rect(5, -20, 5, 40), passages: [rect(3, -2, 9, 4)] },
      ]),
      OPEN,
    );
    expect(resolver.move({ x: 0, y: 0 }, { x: 15, y: 0 }, 0.5).x).toBeCloseTo(15);
    expect(resolver.move({ x: 7, y: 0 }, { x: 0, y: 10 }, 0.5).y).toBeCloseTo(1.5);
    expect(resolver.move({ x: 0, y: 5 }, { x: 15, y: 0 }, 0.5).x).toBeCloseTo(4.5);
  });
  it('blocks tunnelling, slides along the wall and allows passage through an actual doorway', () => {
    const index = new StaticCollisionIndex([
      { id: 'upper-wall', polygon: rect(5, -20, 1, 18) },
      { id: 'lower-wall', polygon: rect(5, 2, 1, 18) },
    ]);
    const resolver = new CollisionResolver(index, OPEN);
    const blocked = resolver.move({ x: 0, y: -5 }, { x: 100, y: 2 }, 0.5);
    expect(blocked.x).toBeCloseTo(4.5);
    expect(blocked.y).toBeCloseTo(-3);
    expect(resolver.move({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.5)).toEqual({ x: 100, y: 0 });
    index.remove('upper-wall');
    expect(resolver.move({ x: 0, y: -5 }, { x: 100, y: 0 }, 0.5)).toEqual({ x: 100, y: -5 });
  });

  it('stops in a corner instead of sliding through the adjoining wall', () => {
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([
        { id: 'east', polygon: rect(5, -20, 1, 40) },
        { id: 'south', polygon: rect(-20, 5, 40, 1) },
      ]),
      OPEN,
    );
    const end = resolver.move({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.5);
    expect(end.x).toBeCloseTo(4.5);
    expect(end.y).toBeCloseTo(4.5);
    expect(resolver.move({ x: 0, y: 0 }, { x: 0, y: 0 }, 0.5)).toEqual({ x: 0, y: 0 });
  });

  it('lets a mover that starts inside a footprint walk out, but never deeper in', () => {
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([{ id: 'tower', polygon: rect(0, 0, 10, 10) }]),
      OPEN,
    );
    expect(resolver.move({ x: 5, y: 5 }, { x: 20, y: 0 }, 0.5)).toEqual({ x: 25, y: 5 });
    const grazing = { x: -0.3, y: 5 };
    expect(resolver.move(grazing, { x: 5, y: 0 }, 0.5)).toEqual(grazing);
    const slid = resolver.move(grazing, { x: 1, y: 3 }, 0.5);
    expect(slid.x).toBeCloseTo(-0.3);
    expect(slid.y).toBeCloseTo(8);
  });

  it('keeps the circle its radius inside the bounds', () => {
    const resolver = new CollisionResolver(new StaticCollisionIndex([]), {
      x: 0,
      y: 0,
      width: 20,
      height: 10,
    });

    expect(resolver.move({ x: 1, y: 5 }, { x: -100, y: 0 }, 0.5)).toEqual({ x: 0.5, y: 5 });
    expect(resolver.move({ x: 18, y: 9 }, { x: 5, y: 5 }, 1)).toEqual({ x: 19, y: 9 });
  });

  describe('reach', () => {
    const EAST = { x: 1, y: 0 };
    const wall = () =>
      new CollisionResolver(
        new StaticCollisionIndex([{ id: 'wall', polygon: rect(5, -20, 1, 40) }]),
        OPEN,
      );

    it('is the whole distance when nothing is in the way, the side of the wall included', () => {
      expect(wall().reach({ x: 0, y: 0 }, { x: -1, y: 0 }, 8, 0.5)).toBe(8);
      expect(wall().reach({ x: 0, y: 0 }, EAST, 4, 0.5)).toBe(4);
      expect(wall().reach({ x: 4.4, y: 0 }, { x: -1, y: 0 }, 8, 0.5)).toBe(8);
    });

    it('stops the circle where `move` first touches the wall, without the slide', () => {
      const resolver = wall();
      const reach = resolver.reach({ x: 0, y: 0 }, EAST, 8, 0.5);
      const diagonal = resolver.reach(
        { x: 0, y: 0 },
        { x: Math.SQRT1_2, y: Math.SQRT1_2 },
        8 * Math.SQRT2,
        0.5,
      );

      expect(reach).toBeCloseTo(4.5, 6);
      expect(reach).toBeLessThan(4.5);
      expect(reach).toBeCloseTo(resolver.move({ x: 0, y: 0 }, { x: 8, y: 0 }, 0.5).x, 12);
      expect(diagonal * Math.SQRT1_2).toBeCloseTo(4.5, 6);
    });

    it('is 0 against the wall, and from outside it never takes the circle through a wall thinner than the move', () => {
      expect(wall().reach({ x: 4.5, y: 0 }, EAST, 8, 0.5)).toBe(0);
      expect(wall().reach({ x: 0, y: 0 }, EAST, 100, 0.5)).toBeLessThan(4.5);
    });

    // Moved from `abilities/dashReach.test.ts`: the bounds are the resolver's now (critic r2 BTD-A).
    it('stops where the circle meets the edge of the bounds, as `move` keeps it inside them', () => {
      const bounds = { x: 0, y: 0, width: 200, height: 60 };
      const open = new CollisionResolver(new StaticCollisionIndex([]), bounds);
      const beyondEdge = new CollisionResolver(
        new StaticCollisionIndex([{ id: 'outside', polygon: rect(200.2, 0, 5, 60) }]),
        bounds,
      );

      expect(open.reach({ x: 195, y: 30 }, EAST, 8, 0.5)).toBeCloseTo(4.5, 9);
      expect(open.reach({ x: 10, y: 3 }, { x: 0, y: -1 }, 8, 0.5)).toBeCloseTo(2.5, 9);
      expect(open.reach({ x: 10, y: 3 }, { x: -0.6, y: -0.8 }, 8, 0.5)).toBeCloseTo(3.125, 9);
      expect(beyondEdge.reach({ x: 195, y: 30 }, EAST, 8, 0.5)).toBe(
        open.reach({ x: 195, y: 30 }, EAST, 8, 0.5),
      );
    });
  });

  describe('pushOut', () => {
    it('leaves a circle that overlaps no wall where it is', () => {
      const resolver = new CollisionResolver(
        new StaticCollisionIndex([{ id: 'wall', polygon: rect(5, -20, 1, 40) }]),
        OPEN,
      );

      expect(resolver.pushOut({ x: 4.5, y: 0 }, 0.5)).toEqual({ x: 4.5, y: 0 });
    });

    it('moves a grown circle the shortest way out of a wall, just clear of it', () => {
      const resolver = new CollisionResolver(
        new StaticCollisionIndex([{ id: 'wall', polygon: rect(5, -20, 1, 40) }]),
        OPEN,
      );

      const out = resolver.pushOut({ x: 4.5, y: 0 }, 0.65);

      expect(out.x).toBeCloseTo(4.35, 6);
      expect(out.x).toBeLessThan(4.35);
      expect(out.y).toBe(0);
    });

    it('clears both walls of a corner, and keeps the circle inside the bounds', () => {
      const corner = new CollisionResolver(
        new StaticCollisionIndex([
          { id: 'east', polygon: rect(5, -20, 1, 40) },
          { id: 'north', polygon: rect(-20, 5, 40, 1) },
        ]),
        OPEN,
      );
      const edge = new CollisionResolver(new StaticCollisionIndex([]), {
        x: 0,
        y: 0,
        width: 20,
        height: 10,
      });

      const out = corner.pushOut({ x: 4.5, y: 4.5 }, 0.8);

      expect(out.x).toBeLessThanOrEqual(4.2);
      expect(out.y).toBeLessThanOrEqual(4.2);
      expect(edge.pushOut({ x: 0.5, y: 5 }, 0.65)).toEqual({ x: 0.65, y: 5 });
    });

    it('never moves a circle into a wall it did not overlap: a pass stops short of the next wall', () => {
      // A wall placed over the circle; the shortest way out (east) leads into a pocket of two rocks.
      const rocks = [rect(114.8, 52.2, 3.3, 1.7), rect(115.7, 54.2, 3.5, 3.8)];
      const resolver = new CollisionResolver(
        new StaticCollisionIndex([
          { id: 'placed', polygon: rect(112.5, 52, 1, 4) },
          ...rocks.map((polygon, index) => ({ id: `rock-${String(index)}`, polygon })),
        ]),
        OPEN,
      );

      const out = resolver.pushOut({ x: 113.1, y: 54.5 }, 1.25);

      expect(out.x).toBeGreaterThan(113.1);
      for (const polygon of rocks) expect(doesCircleOverlapPolygon(out, 1.25, polygon)).toBe(false);
      // The pass slides along the south rock's corner into the pocket: it does not stop at it.
      expect(out.x).toBeCloseTo(114.45, 2);
      expect(out.y).toBeCloseTo(55.237, 2);
    });

    it('keeps each pass inside the bounds, so the clamp moves no circle into a rock', () => {
      // A wall turned 45° lies over the circle, 1.1 m from the east edge. The way out leads past
      // the edge; a clamp back from there would end inside the rock south of the circle.
      const rock = rect(37, 22.2, 0.8, 2);
      const [along, across] = [2 * Math.SQRT1_2, 0.5 * Math.SQRT1_2];
      const resolver = new CollisionResolver(
        new StaticCollisionIndex([
          {
            id: 'placed',
            polygon: [
              { x: 38.6 + along - across, y: 20 - along - across },
              { x: 38.6 + along + across, y: 20 - along + across },
              { x: 38.6 - along + across, y: 20 + along + across },
              { x: 38.6 - along - across, y: 20 + along - across },
            ],
          },
          { id: 'rock', polygon: rock },
        ]),
        { x: 0, y: 0, width: 40, height: 40 },
      );
      const start = { x: 37.66, y: 20.95 };

      const out = resolver.pushOut(start, 1.25);

      expect(doesCircleOverlapPolygon(start, 1.25, rock)).toBe(false);
      expect(out.x).toBeGreaterThan(start.x);
      expect(out.x).toBeLessThanOrEqual(38.75);
      expect(doesCircleOverlapPolygon(out, 1.25, rock)).toBe(false);
    });

    it('leaves a circle inside a passage of the wall where it is', () => {
      const resolver = new CollisionResolver(
        new StaticCollisionIndex([
          { id: 'wall', polygon: rect(5, -20, 1, 40), passages: [rect(4, -2, 3, 4)] },
        ]),
        OPEN,
      );

      expect(resolver.pushOut({ x: 5.5, y: 0 }, 0.65)).toEqual({ x: 5.5, y: 0 });
    });
  });

  describe('hasRoom', () => {
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([
        { id: 'wall', polygon: rect(5, -20, 1, 40), passages: [rect(4, -2, 3, 4)] },
      ]),
      OPEN,
    );

    it('is true for a circle clear of every wall and for one inside a passage of a wall', () => {
      expect(resolver.hasRoom({ x: 4.3, y: 10 }, 0.65)).toBe(true);
      expect(resolver.hasRoom({ x: 5.5, y: 0 }, 0.65)).toBe(true);
    });

    it('is false for a circle that overlaps a wall, also one with its centre in the wall', () => {
      expect(resolver.hasRoom({ x: 4.5, y: 10 }, 0.65)).toBe(false);
      expect(resolver.hasRoom({ x: 5.5, y: 10 }, 0.65)).toBe(false);
    });
  });
});
