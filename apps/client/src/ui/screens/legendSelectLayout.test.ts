import { describe, expect, it } from 'vitest';

import { legendArtBox, legendCardStyle, legendSlot, originRemainder } from './legendSelectLayout';

/** Rounds every number to 2 decimals (Figma's own precision), keeping the shape. */
const near = (point: { readonly x: number; readonly y: number }) => ({
  x: Number(point.x.toFixed(2)),
  y: Number(point.y.toFixed(2)),
});

describe('legendSlot', () => {
  it('puts three Legends on the Figma row: picked enlarged in place, neighbours fixed', () => {
    const [left, centre, right] = [0, 1, 2].map((index) => legendSlot(3, index));

    // 55:268, 55:267, 55:269 and their copies 61:17, 61:4, 61:11.
    expect(near(left?.card.idle ?? { x: 0, y: 0 })).toEqual({ x: 501, y: 250 });
    expect(near(centre?.card.picked ?? { x: 0, y: 0 })).toEqual({ x: 792, y: 194 });
    expect(right?.card.idle).toEqual({ x: 1144.66, y: 250.62 });
    expect(near(left?.refraction.idle ?? { x: 0, y: 0 })).toEqual({ x: 480, y: 221 });
    expect(near(centre?.refraction.picked ?? { x: 0, y: 0 })).toEqual({ x: 766, y: 165 });
    expect(right?.refraction.idle).toEqual({ x: 1123, y: 222 });
  });

  it('enlarges a side card on its own slot centre (the non-Figma picks)', () => {
    // 55:255 copies at slots 0 and 2: art x 482.09 and 1125.75 less the 11.42 art inset.
    expect(near(legendSlot(3, 0).card.picked)).toEqual({ x: 470.67, y: 194 });
    expect(near(legendSlot(3, 2).card.picked)).toEqual({ x: 1114.33, y: 194 });
    expect(near(legendSlot(3, 1).card.idle)).toEqual({ x: 822.33, y: 250 });
  });

  it('centres one or two Legends on the mean Figma pitch (CD-14)', () => {
    // Slot centres 960, and 960 ∓ 321.83 / 2 = 799.085 / 1120.915.
    expect(near(legendSlot(1, 0).card.idle)).toEqual({ x: 822.33, y: 250 });
    expect(legendSlot(2, 0).card.idle.x).toBeCloseTo(799.085 - 137.67, 6);
    expect(legendSlot(2, 1).card.picked.x).toBeCloseTo(1120.915 - 168, 6);
    expect(legendSlot(2, 1).refraction.picked).toEqual({
      x: legendSlot(2, 1).card.picked.x - 26,
      y: 165,
    });
  });

  it("offsets only the Figma right card's text from the left card's geometry", () => {
    expect(legendSlot(3, 2).text.idle).toEqual({ title: -0.21, name: 0.5 });
    expect(legendSlot(3, 2).text.picked).toEqual({ title: 0, name: 0 });
    expect(legendSlot(3, 0).text.idle).toEqual({ title: 0, name: 0 });
    expect(legendSlot(2, 1).text.idle).toEqual({ title: 0, name: 0 });
  });
});

describe('legendArtBox', () => {
  it("gives a rendition its placement-table box where the card's art sits", () => {
    expect(legendArtBox('oracle-card-art', 'card-picked', { x: 803.42, y: 210 })).toEqual({
      left: 803,
      top: 210,
      width: 315,
      height: 660,
    });
    // 61:14 sits 0.2 px off its copy's geometry (1128.19, 227.91): still its own box.
    expect(
      legendArtBox('necromancer-card-art', 'refraction-idle', { x: 1128.19, y: 227.91 }),
    ).toEqual({
      left: 1127,
      top: 227,
      width: 306,
      height: 619,
    });
  });

  it('gives nothing for an unknown pair, no art, or a box baked for another slot', () => {
    expect(
      legendArtBox('oracle-card-art', 'refraction-idle', { x: 806.52, y: 226.91 }),
    ).toBeUndefined();
    expect(legendArtBox(null, 'card-idle', { x: 505.51, y: 255.42 })).toBeUndefined();
    // The oracle's picked art was baked at slot 1; at slot 0 (482.09, 210) it is not drawn.
    expect(legendArtBox('oracle-card-art', 'card-picked', { x: 482.09, y: 210 })).toBeUndefined();
  });
});

describe('legendCardStyle', () => {
  it('floors the root, hands the remainder and text offsets to CSS, and boxes the art (I-45)', () => {
    expect(
      legendCardStyle(
        { x: 1144.66, y: 250.62 },
        { left: 1149, top: 256, width: 265, height: 567 },
        { title: -0.21, name: 0.5 },
      ),
    ).toEqual({
      left: 1144,
      top: 250,
      '--card-fx': '0.66px',
      '--card-fy': '0.62px',
      '--title-dx': '-0.21px',
      '--name-dx': '0.5px',
      '--art-left': '5px',
      '--art-top': '6px',
      '--art-width': '265px',
      '--art-height': '567px',
    });
  });

  it('sets no art box without one, and zero text offsets by default', () => {
    expect(legendCardStyle({ x: 501, y: 250 }, undefined)).toEqual({
      left: 501,
      top: 250,
      '--card-fx': '0px',
      '--card-fy': '0px',
      '--title-dx': '0px',
      '--name-dx': '0px',
    });
  });
});

describe('originRemainder', () => {
  it('is the part of the origin past its integer floor', () => {
    expect(near(originRemainder({ x: 470.67, y: 194 }))).toEqual({ x: 0.67, y: 0 });
  });
});
