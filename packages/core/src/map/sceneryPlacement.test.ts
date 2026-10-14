import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapSceneryBuilder } from './MapSceneryBuilder';

describe('seeded scenery placement', () => {
  const build = (seed: number) =>
    new MapSceneryBuilder(new MapGenerator().generate(createDefaultGameConfig(), seed)).build();

  it('changes tree, boulder, lake and house locations across seeds and reproduces the same seed', () => {
    const first = build(1);
    const second = build(2);
    expect(build(1)).toEqual(first);
    for (const token of ['canopy', 'boulder', 'lake-deep-', 'village--1-']) {
      const select = (pieces: typeof first) => pieces.filter((piece) => piece.id.includes(token));
      expect(select(first).length).toBeGreaterThan(0);
      expect(select(first)).not.toEqual(select(second));
    }
  });

  it.each([1, 2, 17, 42, 4294967295])(
    'reflects every movable polygon exactly at seed %i',
    (seed) => {
      const scenery = build(seed);
      const originals = scenery.filter(
        (piece) =>
          ['tree-', 'lake-', 'village--1-', 'village-outskirts--1-'].some((prefix) =>
            piece.id.startsWith(prefix),
          ) && !piece.id.endsWith('-mirror'),
      );
      expect(originals.length).toBeGreaterThan(100);
      for (const piece of originals) {
        const twin = scenery.find((candidate) => candidate.id === `${piece.id}-mirror`);
        expect(twin?.color).toBe(piece.color);
        expect(twin?.layer).toBe(piece.layer);
        expect(twin?.shape).toEqual(
          piece.shape.map((point) => ({ x: 1600 - point.x, y: point.y })),
        );
      }
    },
  );
});
