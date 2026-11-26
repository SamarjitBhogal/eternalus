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
