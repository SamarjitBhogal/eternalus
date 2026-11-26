import { expect, it } from 'vitest';
import { MapObjectBody } from './MapObjectBody';

it('preserves the authored object identity and geometry', () => {
  const object = { id: 'house', kind: 'house' as const, isBlocking: true, footprints: [] };
  expect(new MapObjectBody(object).object).toBe(object);
});

it('keeps the box around every footprint', () => {
  const object = {
    id: 'rocks',
    kind: 'rock' as const,
    isBlocking: true,
    footprints: [
      [
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 3, y: 5 },
      ],
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ],
    ],
  };

  expect(new MapObjectBody(object).bounds).toEqual({ x: -1, y: 0, width: 4, height: 5 });
});

it('is an outline: its footprints, walked on when the object does not block', () => {
  const floor = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
  ];
  const palace = {
    id: 'palace',
    kind: 'stronghold' as const,
    isBlocking: false,
    footprints: [floor],
  };
  const rock = { ...palace, id: 'rock', kind: 'rock' as const, isBlocking: true };

  expect(new MapObjectBody(palace).polygons).toEqual([floor]);
  expect(new MapObjectBody(palace).walkOn).toEqual([floor]);
  expect(new MapObjectBody(palace).solid).toEqual([]);
  expect(new MapObjectBody(rock).walkOn).toEqual([]);
  expect(new MapObjectBody(rock).solid).toEqual([floor]);
});

it('lets a shot not aimed at it fly over it when it is walked on or shots cross it (a camp fire, HC-Q105)', () => {
  const floor = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
  ];
  const rock = { id: 'rock', kind: 'rock' as const, isBlocking: true, footprints: [floor] };
  const palace = { ...rock, id: 'palace', kind: 'stronghold' as const, isBlocking: false };
  const fire = { ...rock, id: 'fire', kind: 'furniture' as const, canShotsCross: true as const };

  // A shot not aimed at it flies over its walk-on polygons and its `shotsCross` ones (Q104-9).
  expect(new MapObjectBody(rock).walkOn).toEqual([]);
  expect(new MapObjectBody(rock).shotsCross).toEqual([]);
  expect(new MapObjectBody(palace).walkOn).toEqual([floor]);
  expect(new MapObjectBody(palace).shotsCross).toEqual([]);
  expect(new MapObjectBody(fire).shotsCross).toEqual([floor]);
  expect(new MapObjectBody(fire).walkOn).toEqual([]);
  expect(new MapObjectBody(fire).solid).toEqual([floor]);
});
