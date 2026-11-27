import { describe, expect, it } from 'vitest';
import { lavaBridge } from '../__fixtures__/lavaBridge';
import { isPointInAnyPolygon, isPointInPolygon } from '../utils/geometry';
import { CollisionResolver } from './CollisionResolver';
import { StaticCollisionIndex } from './StaticCollisionIndex';
import type { Vec2 } from '../utils/geometry.types';
import { cos, sin } from '../utils/deterministicMath';

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

  it.each([
    { degrees: 120, step: 0.2 },
    { degrees: 135, step: 0.2 },
    { degrees: 135, step: 0.6 },
  ])(
    'stops dead in a $degrees° corner it is pressed into, $step m a move, as in a square one',
    ({ degrees, step }) => {
      const radius = 0.5;
      const radians = (degrees * Math.PI) / 180;
      // One wall bends at (5, 0): its face x = 5 runs south from the bend, and its other face
      // leaves the bend `degrees` from the first. The free side is west and south of the bend.
      const far = { x: 5 - 40 * sin(radians), y: -40 * cos(radians) };
      const resolver = new CollisionResolver(
        new StaticCollisionIndex([
          {
            id: 'bent-wall',
            polygon: [{ x: 5, y: 0 }, { x: 5, y: -40 }, { x: 60, y: -40 }, { x: 60, y: 60 }, far],
          },
        ]),
        OPEN,
      );
      // 20° off the first face's normal: into both faces, so the move has nowhere to go.
      const move = { x: step * cos(Math.PI / 9), y: step * sin(Math.PI / 9) };
      let position = { x: 2, y: -3 };
      const jumps: number[] = [];

      for (let tick = 0; tick < 100; tick += 1) {
        const next = resolver.move(position, move, radius);
        if (tick >= 60) jumps.push(Math.hypot(next.x - position.x, next.y - position.y));
        position = next;
      }

      // Pressed into the bend, touching both faces...
      expect(position.x).toBeCloseTo(5 - radius, 5);
      const secondFace = { x: cos(radians), y: -sin(radians) };
      expect((position.x - 5) * secondFace.x + position.y * secondFace.y).toBeCloseTo(radius, 5);
      // ...and still: sliding off one face and then the other would move it a hair out along the
      // second face, and back, every move (`INBOX.md` HC-B33).
      expect(Math.max(...jumps)).toBeLessThan(1e-9);
    },
  );

  it('slides what is left of a move along each face in turn, as small steps of the move do', () => {
    const radius = 0.5;
    const radians = (150 * Math.PI) / 180;
    // The bent wall of the corner test, at 150°.
    const far = { x: 5 - 40 * sin(radians), y: -40 * cos(radians) };
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([
        {
          id: 'bent-wall',
          polygon: [{ x: 5, y: 0 }, { x: 5, y: -40 }, { x: 60, y: -40 }, { x: 60, y: 60 }, far],
        },
      ]),
      OPEN,
    );
    const start = { x: 3.5, y: -3 };
    // Meets the face x = 5, slides north along it, then meets the other face and slides along it.
    const move = { x: 1.5, y: 3.5 };
    const steps = 256;
    let stepped = start;
    for (let step = 0; step < steps; step += 1) {
      stepped = resolver.move(stepped, { x: move.x / steps, y: move.y / steps }, radius);
    }

    const end = resolver.move(start, move, radius);

    const secondFace = { x: cos(radians), y: -sin(radians) };
    expect((stepped.x - 5) * secondFace.x + stepped.y * secondFace.y).toBeCloseTo(radius, 5);
    expect(end.x).toBeCloseTo(stepped.x, 4);
    expect(end.y).toBeCloseTo(stepped.y, 4);
  });

  it('reports the normal, out of the wall, of each wall and bounds edge a move touches', () => {
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([
        { id: 'east', polygon: rect(5, -20, 1, 40) },
        { id: 'south', polygon: rect(-20, 5, 40, 1) },
      ]),
      { x: -10, y: -10, width: 30, height: 30 },
    );
    const contacts: Vec2[] = [{ x: 9, y: 9 }];

    resolver.move({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.5, contacts);
    expect(contacts).toHaveLength(2);
    expect(contacts).toContainEqual({ x: -1, y: 0 });
    expect(contacts).toContainEqual({ x: 0, y: -1 });
    resolver.move({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.5, contacts);
    expect(contacts).toEqual([]);
    resolver.move({ x: 0, y: 0 }, { x: -100, y: -100 }, 0.5, contacts);
    expect(contacts).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
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
        expect(resolver.shotReach(launch, EAST, 3, SHOT, launch)).toBe(3);
        expect(resolver.shotReach(launch, EAST, 20, SHOT, launch)).toBeCloseTo(15.35, 6);
        expect(resolver.shotReach(launch, EAST, 20, SHOT, launch)).toBeLessThan(15.35);
      });

      it('still stops a shot whose circle, but not its launch point, overlaps the wall at launch', () => {
        const thick = new CollisionResolver(
          new StaticCollisionIndex([{ id: 'wall', polygon: rect(5, -20, 10, 40) }]),
          OPEN,
        );
        const pressed = { x: 5 - SHOT / 3, y: 0 };

        expect(thick.reach(pressed, EAST, 2, SHOT)).toBe(0);
        expect(thick.shotReach(pressed, EAST, 2, SHOT, pressed)).toBe(0);
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
        expect(barrier.shotReach(inPassage, north, 10, SHOT, inPassage)).toBe(
          barrier.reach(inPassage, north, 10, SHOT),
        );
      });

      it("stops a mover from the seed 1 map's lava bridge at the lava, 3.46 m out, but a shot flies over it (DEC-345)", () => {
        const { river, collisions, onBridge, offTheSide } = lavaBridge();

        expect(isPointInAnyPolygon(onBridge, river.footprints)).toBe(true);
        expect(river.passages?.some((passage) => isPointInPolygon(onBridge, passage))).toBe(true);
        expect(river.canShotsCross).toBe(true);
        expect(collisions.reach(onBridge, offTheSide, 14, SHOT)).toBeCloseTo(3.46, 2);
        expect(collisions.shotReach(onBridge, offTheSide, 14, SHOT, onBridge)).toBe(14);
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

      expect(lake.shotReach(LAUNCH, EAST, 20, SHOT, LAUNCH)).toBe(20);
      expect(lake.reach(LAUNCH, EAST, 20, SHOT)).toBeCloseTo(5 - SHOT, 6);
      expect(mountain.shotReach(LAUNCH, EAST, 20, SHOT, LAUNCH)).toBeCloseTo(5 - SHOT, 6);
      expect(mountain.reach(LAUNCH, EAST, 20, SHOT)).toBeCloseTo(5 - SHOT, 6);
    });

    it('lets a shot fly over a shape that also lights shots (lava)', () => {
      const lava = resolverOf({ canShotsCross: true, canLightShots: true });

      expect(lava.shotReach(LAUNCH, EAST, 20, SHOT, LAUNCH)).toBe(20);
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
