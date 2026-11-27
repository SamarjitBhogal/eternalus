import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { NeutralCampBuilder } from './NeutralCampBuilder';

describe('NeutralCampBuilder', () => {
  it('pins woodland camp feet and mirrors the entire site without mutating its anchor', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const generated = map.features.find((feature) => feature.kind === 'camp');
    if (generated === undefined) throw new Error('Missing forest camp');
    const camp = { ...generated, position: { x: 400, y: 200 } };
    const before = structuredClone(camp);
    const west = new NeutralCampBuilder().build(camp);
    const east = new NeutralCampBuilder().build(
      { ...camp, position: { ...camp.position, x: map.width - camp.position.x } },
      map.width,
    );
    expect(
      west.filter((piece) => piece.object?.isFootprint).map((piece) => piece.shape),
    ).toMatchSnapshot();
    expect(east.map((piece) => piece.shape)).toEqual(
      west.map((piece) => piece.shape.map((point) => ({ x: map.width - point.x, y: point.y }))),
    );
    expect(west.some((piece) => piece.id.endsWith('offering-water'))).toBe(true);
    expect(camp).toEqual(before);
  });
});
