import { describe, expect, it } from 'vitest';
import { lavaBridge } from '../__fixtures__/lavaBridge';
import { isPointInAnyPolygon, isPointInPolygon } from '../utils/geometry';
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

    describe('the launch-shape rule (DEC-334)', () => {
      /** The bolt's radius: the width a shot sweeps. */
      const SHOT = 0.15;

      it('lets a shot leave a shape whose blocking area holds its launch point, and no other shape', () => {
        const resolver = new CollisionResolver(
          new StaticCollisionIndex([
            { id: 'pylon', polygon: rect(-1, -1, 10, 2) },
            { id: 'far-wall', polygon: rect(15, -20, 1, 40) },
          ]),
          OPEN,
        );
        const launch = { x: -0.5, y: 0 };

        // Without a launch point, a start inside that goes deeper stops at once.
        expect(resolver.reach(launch, EAST, 3, SHOT)).toBe(0);
        expect(resolver.reach(launch, EAST, 3, SHOT, launch)).toBe(3);
        expect(resolver.reach(launch, EAST, 20, SHOT, launch)).toBeCloseTo(15.35, 6);
        expect(resolver.reach(launch, EAST, 20, SHOT, launch)).toBeLessThan(15.35);
      });

      it('still stops a shot whose circle, but not its launch point, overlaps the wall at launch', () => {
        const thick = new CollisionResolver(
          new StaticCollisionIndex([{ id: 'wall', polygon: rect(5, -20, 10, 40) }]),
          OPEN,
        );
        const pressed = { x: 5 - SHOT / 3, y: 0 };

        expect(thick.reach(pressed, EAST, 2, SHOT)).toBe(0);
        expect(thick.reach(pressed, EAST, 2, SHOT, pressed)).toBe(0);
      });

      it('still stops a shot launched in a passage where it leaves the passage over a shape shots cannot cross', () => {
        const barrier = new CollisionResolver(
          new StaticCollisionIndex([
            { id: 'barrier', polygon: rect(5, -20, 5, 40), passages: [rect(3, -2, 9, 4)] },
          ]),
          OPEN,
        );
        const inPassage = { x: 7, y: 0 };
        const north = { x: 0, y: 1 };

        expect(barrier.reach(inPassage, north, 10, SHOT)).toBeCloseTo(2 - SHOT, 6);
        expect(barrier.reach(inPassage, north, 10, SHOT, inPassage)).toBe(
          barrier.reach(inPassage, north, 10, SHOT),
        );
      });

      it("stops a mover from the seed 1 map's lava bridge at the lava, 3.46 m out, but a shot flies over it (DEC-345)", () => {
        const { river, collisions, onBridge, offTheSide } = lavaBridge();

        expect(isPointInAnyPolygon(onBridge, river.footprints)).toBe(true);
        expect(river.passages?.some((passage) => isPointInPolygon(onBridge, passage))).toBe(true);
        expect(river.canShotsCross).toBe(true);
        expect(collisions.reach(onBridge, offTheSide, 14, SHOT)).toBeCloseTo(3.46, 2);
        expect(collisions.reach(onBridge, offTheSide, 14, SHOT, onBridge)).toBe(14);
      });
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

  describe('shots over shapes they can cross (HC-Q89, DEC-345)', () => {
    const EAST = { x: 1, y: 0 };
    const SHOT = 0.15;
    const LAUNCH = { x: 0, y: 0 };
    const resolverOf = (flags: { canShotsCross?: true; canLightShots?: true }) =>
      new CollisionResolver(
        new StaticCollisionIndex([{ id: 'water', polygon: rect(5, -20, 5, 40), ...flags }]),
        OPEN,
      );

    it('lets a shot fly over a shape shots can cross but stops a mover and a shape without the flag', () => {
      const lake = resolverOf({ canShotsCross: true });
      const mountain = resolverOf({});

      expect(lake.reach(LAUNCH, EAST, 20, SHOT, LAUNCH)).toBe(20);
      expect(lake.reach(LAUNCH, EAST, 20, SHOT)).toBeCloseTo(5 - SHOT, 6);
      expect(mountain.reach(LAUNCH, EAST, 20, SHOT, LAUNCH)).toBeCloseTo(5 - SHOT, 6);
      expect(mountain.reach(LAUNCH, EAST, 20, SHOT)).toBeCloseTo(5 - SHOT, 6);
    });

    it('lets a shot fly over a shape that also lights shots (lava)', () => {
      const lava = resolverOf({ canShotsCross: true, canLightShots: true });

      expect(lava.reach(LAUNCH, EAST, 20, SHOT, LAUNCH)).toBe(20);
    });

    describe('lightsShot', () => {
      it('is true across a shape that lights shots, also when the move ends on its far side', () => {
        const lava = resolverOf({ canShotsCross: true, canLightShots: true });

        expect(lava.lightsShot(LAUNCH, { x: 20, y: 0 }, SHOT)).toBe(true);
        expect(lava.lightsShot(LAUNCH, { x: 6, y: 0 }, SHOT)).toBe(true);
      });

      it('is false for a move that stops short of the shape or goes away from it', () => {
        const lava = resolverOf({ canShotsCross: true, canLightShots: true });

        expect(lava.lightsShot(LAUNCH, { x: 4, y: 0 }, SHOT)).toBe(false);
        expect(lava.lightsShot(LAUNCH, { x: -20, y: 0 }, SHOT)).toBe(false);
      });

      it('is false across a shape shots can cross that does not light them (a lake)', () => {
        expect(resolverOf({ canShotsCross: true }).lightsShot(LAUNCH, { x: 20, y: 0 }, SHOT)).toBe(
          false,
        );
        expect(resolverOf({}).lightsShot(LAUNCH, { x: 20, y: 0 }, SHOT)).toBe(false);
      });

      it('is true when the move starts inside the shape', () => {
        const lava = resolverOf({ canShotsCross: true, canLightShots: true });

        expect(lava.lightsShot({ x: 7, y: 0 }, { x: 0.5, y: 0 }, SHOT)).toBe(true);
        expect(lava.lightsShot({ x: 7, y: 0 }, { x: 0, y: 0 }, SHOT)).toBe(true);
      });

      it('is false over a bridge deck inside the shape (a passage does not light a shot)', () => {
        const lava = new CollisionResolver(
          new StaticCollisionIndex([
            {
              id: 'lava',
              polygon: rect(5, -20, 5, 40),
              passages: [rect(3, -2, 9, 4)],
              canShotsCross: true,
              canLightShots: true,
            },
          ]),
          OPEN,
        );

        expect(lava.lightsShot({ x: 0, y: 0 }, { x: 20, y: 0 }, SHOT)).toBe(false);
        expect(lava.lightsShot({ x: 7, y: 0 }, { x: 0.5, y: 0 }, SHOT)).toBe(false);
        expect(lava.lightsShot({ x: 7, y: 0 }, { x: 0, y: 10 }, SHOT)).toBe(true);
        expect(lava.lightsShot({ x: 0, y: 5 }, { x: 20, y: 0 }, SHOT)).toBe(true);
      });
    });
  });
});
