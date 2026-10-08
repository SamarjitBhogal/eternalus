import { describe, expect, it } from 'vitest';

import { campDefinitionFor, distributeCamps } from './campPlacement';

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
