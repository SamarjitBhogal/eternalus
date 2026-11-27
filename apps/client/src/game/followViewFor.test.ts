import { loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { SHIPPED_SPRITE_WIDTHS } from './__fixtures__/spriteWidths';
import { followViewFor } from './followViewFor';
import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import { LEGEND_VISUAL_DIAMETER } from './views/entityViews.constants';

describe('followViewFor', () => {
  it("zooms the camera out by the player's own sprite width, per class (DEC-424)", () => {
    const views = loadDisplayContent().legends.map(({ id }) => [
      id,
      followViewFor(SHIPPED_SPRITE_WIDTHS[id]),
    ]);

    // The card's numbers: a Warrior sees 96 x 54 m, a Magus 1.5 times and a Sentinel 2.5 times that.
    expect(Object.fromEntries(views)).toEqual({
      warrior: { width: 96, height: 54 },
      magus: { width: 144, height: 81 },
      sentinel: { width: 240, height: 135 },
    });
  });

  it("shows the player's Legend at the same size on screen for every class", () => {
    const shares = Object.values(SHIPPED_SPRITE_WIDTHS).map(
      (width) => width / followViewFor(width).width,
    );

    expect(new Set(shares.map((share) => share.toFixed(9)))).toEqual(
      new Set([(LEGEND_VISUAL_DIAMETER / FOLLOW_VIEW_WIDTH).toFixed(9)]),
    );
  });

  it('keeps the approved view without a player sprite width (DEC-238)', () => {
    expect(followViewFor()).toEqual({ width: FOLLOW_VIEW_WIDTH, height: FOLLOW_VIEW_HEIGHT });
  });
});
