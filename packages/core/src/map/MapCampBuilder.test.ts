import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapCampBuilder } from './MapCampBuilder';
import { NeutralCampBuilder } from './NeutralCampBuilder';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';
import { isPointInPolygon } from '../utils/geometry';

const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
const corner = map.features.find((feature) => feature.kind === 'corner-camp');
if (corner === undefined) throw new Error('Missing corner camp fixture');

describe('MapCampBuilder', () => {
  it('uses blue and purple faction gems and orange for every corner shrine', () => {
    for (const [team, expected] of [
      ['light', '#4ab9ff'],
      ['dark', '#b16aff'],
    ] as const) {
      const lane = { ...corner, kind: 'spawner-tower' as const, team };
      const art = new MapCampBuilder().build(lane, 'medium');
      expect(art.find((piece) => piece.id.endsWith('-crystal-dark'))?.color).toBe(expected);
      expect(
        new MapCampBuilder()
          .build({ ...corner, team }, 'corner')
          .find((piece) => piece.id.endsWith('-crystal-dark'))?.color,
      ).toBe('#ffab42');
    }
  });
  it('matches the shrine silhouette and suspends an orange crystal above a walkable stairway', () => {
    const pieces = new MapCampBuilder().build(corner, 'corner');
    for (const detail of [
      'stair-0-tread',
      'stair-3-tread',
      'pillar--1-capital',
      'pillar-1-capital',
      'arch--1-0-block',
      'arch-1-3-block',
      'suspension-chain',
      'crystal-cage-1',
      'crystal-light',
    ]) {
      expect(pieces.some((piece) => piece.id === `${corner.id}-${detail}`)).toBe(true);
    }
    expect(pieces.find((piece) => piece.id === `${corner.id}-crystal-dark`)?.color).toBe('#ffab42');
    const solids = pieces.filter((piece) => piece.object?.isFootprint === true);
    expect(solids.length).toBeGreaterThan(0);
    expect(
      solids.some((piece) =>
        isPointInPolygon({ x: corner.position.x, y: corner.position.y + 15 }, piece.shape),
      ),
    ).toBe(false);
    expect(
      pieces
        .filter((piece) => piece.object !== undefined)
        .every((piece) => piece.object?.id === corner.id),
    ).toBe(true);
  });

  it.each([
    ['heavy', 'heavy-shield-1'],
    ['medium', 'medium-spear-1-0'],
    ['light', 'light-bow-1'],
  ] as const)(
    'gives %s troops their own equipment without changing source data',
    (theme, equipment) => {
      const before = structuredClone(corner);
      const pieces = new MapCampBuilder().build(corner, theme);
      expect(pieces.some((piece) => piece.id === `${corner.id}-${equipment}`)).toBe(true);
      expect(corner).toEqual(before);
      expect(new MapCampBuilder().build(corner, theme)).toEqual(pieces);
    },
  );

  it('reflects complete architecture, including solid feet, for the opposing half', () => {
    const west = new MapCampBuilder().build(corner, 'heavy');
    const east = new MapCampBuilder().build(
      { ...corner, position: { ...corner.position, x: map.width - corner.position.x } },
      'heavy',
      map.width,
    );
    expect(east.map((piece) => piece.shape)).toEqual(
      west.map((piece) => piece.shape.map((point) => ({ x: map.width - point.x, y: point.y }))),
    );
  });

  it('uses a woodland circle rather than the crystal shrine for neutral forest camps', () => {
    const pieces = new NeutralCampBuilder().build(corner);
    expect(pieces.some((piece) => piece.id.includes('dolmen-cap'))).toBe(true);
    expect(pieces.some((piece) => piece.id.includes('standing-stone-'))).toBe(true);
    expect(pieces.some((piece) => piece.id.includes('lantern-light-'))).toBe(true);
    expect(pieces.some((piece) => piece.id.includes('crystal') || piece.id.includes('arch-'))).toBe(
      false,
    );
    expect(new NeutralCampBuilder().build(corner)).toEqual(pieces);
  });

  it('keeps lane structure identities and teams for health, destruction and rendering', () => {
    const presentation = new MapPresentationBuilder().build(map);
    const objects = new MapObjectBuilder().build(map, presentation);
    for (const feature of map.features.filter(
      (f) => f.kind === 'spawner-tower' || f.kind === 'buff-tower',
    )) {
      const object = objects.find((entry) => entry.id === feature.id);
      expect(object?.kind).toBe(feature.kind);
      expect(object?.team).toBe(feature.team);
      expect(object?.footprints.length).toBeGreaterThan(0);
      expect(
        presentation.scenery
          .filter((piece) => piece.replacesFeature === feature.id)
          .every((piece) => piece.object === undefined || piece.object.id === feature.id),
      ).toBe(true);
    }
  });
});
