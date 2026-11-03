import { describe, expect, it } from 'vitest';
import { CollisionResolver } from './CollisionResolver';
import { StaticCollisionIndex } from './StaticCollisionIndex';

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
    const resolver = new CollisionResolver(index);
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
    );
    const end = resolver.move({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.5);
    expect(end.x).toBeCloseTo(4.5);
    expect(end.y).toBeCloseTo(4.5);
    expect(resolver.move({ x: 0, y: 0 }, { x: 0, y: 0 }, 0.5)).toEqual({ x: 0, y: 0 });
  });

  it('lets a mover that starts inside a footprint walk out, but never deeper in', () => {
    const resolver = new CollisionResolver(
      new StaticCollisionIndex([{ id: 'tower', polygon: rect(0, 0, 10, 10) }]),
    );
    expect(resolver.move({ x: 5, y: 5 }, { x: 20, y: 0 }, 0.5)).toEqual({ x: 25, y: 5 });
    const grazing = { x: -0.3, y: 5 };
    expect(resolver.move(grazing, { x: 5, y: 0 }, 0.5)).toEqual(grazing);
    const slid = resolver.move(grazing, { x: 1, y: 3 }, 0.5);
    expect(slid.x).toBeCloseTo(-0.3);
    expect(slid.y).toBeCloseTo(8);
  });
});
