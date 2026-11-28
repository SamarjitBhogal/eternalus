import { describe, expect, it } from 'vitest';

import { isInLaneFortKeepOut } from './fortInWorld';
import { campDefinitionFor, clearCampOfForts, distributeCamps } from './campPlacement';

describe('distributeCamps', () => {
  it('splits evenly when the corridors divide the camps', () => {
    expect(distributeCamps(6, 2)).toEqual([3, 3]);
  });

  it('gives leftover camps to the middle corridors first', () => {
    expect(distributeCamps(6, 4)).toEqual([1, 2, 2, 1]);
    expect(distributeCamps(7, 3)).toEqual([2, 3, 2]);
  });

  it('never loses or invents a camp', () => {
    for (let corridors = 1; corridors <= 6; corridors += 1) {
      for (let total = 0; total <= 12; total += 1) {
        expect(distributeCamps(total, corridors).reduce((sum, count) => sum + count, 0)).toBe(
          total,
        );
      }
    }
  });

  it('returns no corridors when there are none', () => {
    expect(distributeCamps(6, 0)).toEqual([]);
  });
});

describe('campDefinitionFor', () => {
  const classes = [
    { minDepth: 0, definitionId: 'light' },
    { minDepth: 0.5, definitionId: 'medium' },
    { minDepth: 0.9, definitionId: 'heavy' },
  ];

  it('picks the heaviest class the depth reaches', () => {
    expect(campDefinitionFor(0.1, classes)).toBe('light');
    expect(campDefinitionFor(0.5, classes)).toBe('medium');
    expect(campDefinitionFor(1, classes)).toBe('heavy');
  });

  it('returns undefined when no class covers the depth', () => {
    expect(campDefinitionFor(0.1, [{ minDepth: 0.5, definitionId: 'medium' }])).toBeUndefined();
  });
});

describe('clearCampOfForts', () => {
  const extent = { x: 24, y: 18 };
  const fort = { x: 100, y: 100, width: 76, height: 76 };
  const anywhere = (): boolean => true;
  const boxAt = ({ x, y }: { x: number; y: number }) => ({
    x: x - extent.x,
    y: y - extent.y,
    width: 2 * extent.x,
    height: 2 * extent.y,
  });

  it('leaves a camp that overlaps no keep-out where it is', () => {
    const camp = { x: 300, y: 300 };

    expect(clearCampOfForts(camp, { keepOuts: [fort], extent }, anywhere)).toBe(camp);
  });

  it('moves a camp the shortest way that takes its box off the keep-out', () => {
    const camp = { x: 140, y: 190 };
    const moved = clearCampOfForts(camp, { keepOuts: [fort], extent }, anywhere);

    expect(isInLaneFortKeepOut(boxAt(moved), [fort])).toBe(false);
    expect(moved.x).toBe(camp.x);
    expect(moved.y).toBeGreaterThan(camp.y);
    expect(moved.y - camp.y).toBeLessThan(extent.y * 2);
  });

  it('steps past a second keep-out that the first step would land in', () => {
    const north = { x: 100, y: 20, width: 76, height: 76 };
    const camp = { x: 140, y: 120 };
    const moved = clearCampOfForts(camp, { keepOuts: [fort, north], extent }, anywhere);

    expect(isInLaneFortKeepOut(boxAt(moved), [fort, north])).toBe(false);
  });

  it('keeps only steps the corridor allows', () => {
    const camp = { x: 140, y: 190 };
    const moved = clearCampOfForts(camp, { keepOuts: [fort], extent }, ({ y }) => y < camp.y);

    expect(moved.y).toBeLessThan(fort.y);
    expect(isInLaneFortKeepOut(boxAt(moved), [fort])).toBe(false);
  });

  it('leaves a camp no step can clear where it is', () => {
    const camp = { x: 140, y: 190 };

    expect(clearCampOfForts(camp, { keepOuts: [fort], extent }, () => false)).toBe(camp);
  });
});
