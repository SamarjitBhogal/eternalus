import { describe, expect, it } from 'vitest';

import { TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import { isBakedAt } from './isBakedAt';

/** The manifest's box under `key` (`TEST_ASSET_BOXES` restates it), or `null`. */
const boxOf = (key: string) => TEST_ASSET_BOXES[key] ?? null;

describe('isBakedAt', () => {
  it("holds where the card's art sits: its box is the art origin's floor", () => {
    expect(boxOf('oracle-card-art@card-picked')).toEqual({
      left: 803,
      top: 210,
      width: 315,
      height: 660,
    });
    expect(isBakedAt(boxOf('oracle-card-art@card-picked'), { x: 803.42, y: 210 })).toBe(true);
    expect(isBakedAt(boxOf('magus-card-plate-picked'), { x: 1111.24, y: 243.644 })).toBe(true);
  });

  it("holds within the Figma's own slip: 61:14 sits 0.2 px off its copy's geometry (CD-17)", () => {
    expect(boxOf('necromancer-card-art@refraction-idle')).toEqual({
      left: 1127,
      top: 227,
      width: 306,
      height: 619,
    });
    expect(
      isBakedAt(boxOf('necromancer-card-art@refraction-idle'), { x: 1128.19, y: 227.91 }),
    ).toBe(true);
  });

  it('holds 1 px off on both axes (a mini and its inner frame), and fails 2 px off on either', () => {
    const mini = boxOf('catalyst-mini@legend-mini');

    expect(isBakedAt(mini, { x: 71, y: 804 })).toBe(true);
    expect(isBakedAt(mini, { x: 72, y: 804 })).toBe(false);
    expect(isBakedAt(mini, { x: 71, y: 805 })).toBe(false);
  });

  it('fails for a box baked for another slot, an unknown rendition, or no art', () => {
    // The oracle's picked art was baked at slot 1; at slot 0 (482.09, 210) it is not drawn.
    expect(isBakedAt(boxOf('oracle-card-art@card-picked'), { x: 482.09, y: 210 })).toBe(false);
    expect(isBakedAt(boxOf('warrior-card-plate-idle'), { x: 825.18, y: 277.008 })).toBe(false);
    expect(isBakedAt(boxOf('oracle-card-art@refraction-idle'), { x: 806.52, y: 226.91 })).toBe(
      false,
    );
    expect(isBakedAt(null, { x: 505.51, y: 255.42 })).toBe(false);
  });
});
