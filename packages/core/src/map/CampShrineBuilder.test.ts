import { describe, expect, it } from 'vitest';
import { CampShrineBuilder } from './CampShrineBuilder';
import { isPointInPolygon } from '../utils/geometry';

describe('CampShrineBuilder', () => {
  it('pins the three solid feet and leaves the stair approach walkable', () => {
    const art = new CampShrineBuilder().build('camp');
    const feet = art.filter((piece) => piece.object?.isFootprint === true);
    expect(feet).toHaveLength(3);
    expect(feet.map((piece) => piece.shape)).toMatchSnapshot();
    expect(feet.some((piece) => isPointInPolygon({ x: 0, y: 15 }, piece.shape))).toBe(false);
    expect(art.every((piece) => piece.object?.id === 'camp')).toBe(true);
    expect(new CampShrineBuilder().build('camp')).toEqual(art);
  });
});
