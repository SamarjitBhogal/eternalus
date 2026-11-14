import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { brokenLaneBandRules, isBand } from './laneBandRules';
import { validateMapLayout } from './validateMapLayout';

describe('laneBandRules', () => {
  it('accepts a band inside [0, 1] and refuses one off the lane or running backwards', () => {
    expect(isBand([0, 1])).toBe(true);
    expect(isBand([-0.01, 0.5])).toBe(false);
    expect(isBand([0.5, 1.01])).toBe(false);
    expect(isBand([0.6, 0.5])).toBe(false);
  });

  it('finds no broken rule in the shipped bands', () => {
    expect(brokenLaneBandRules(DEFAULT_MAP_LAYOUT.laneBands)).toEqual([]);
  });

  it('names each band off the lane and the spawner band that does not lie ahead of the buff band', () => {
    expect(brokenLaneBandRules({ spawner: [0.3, 1.2], buff: [-0.1, 0.4] })).toEqual([
      'laneBands.spawner must be a band inside [0, 1]',
      'laneBands.buff must be a band inside [0, 1]',
      'laneBands.spawner must lie ahead of laneBands.buff',
    ]);
  });

  it('is the rule validateMapLayout applies to the configured bands', () => {
    const layout = {
      ...DEFAULT_MAP_LAYOUT,
      laneBands: { spawner: [0.1, 0.2], buff: [0.3, 0.4] },
    } as const;

    expect(() => {
      validateMapLayout(layout);
    }).toThrow(/laneBands\.spawner must lie ahead of laneBands\.buff/);
  });
});
