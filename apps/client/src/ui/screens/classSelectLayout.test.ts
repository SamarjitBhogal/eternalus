import { describe, expect, it } from 'vitest';

import { TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import {
  classArtOrigin,
  classCardStyle,
  classSlot,
  overlayVars,
  plateVars,
} from './classSelectLayout';

describe('classSlot', () => {
  it("puts the four cards at 62:125's boxes, the picked one enlarged in place (C§4.10, C§6.1)", () => {
    expect([0, 1, 2, 3].map((index) => classSlot(4, index).card.idle)).toEqual([
      { x: 520, y: 272 },
      { x: 821, y: 272 },
      { x: 1122, y: 272 },
      { x: 1423, y: 272 },
    ]);
    expect(classSlot(4, 2).card.picked.x).toBeCloseTo(1106.015, 6);
    expect(classSlot(4, 2).card.picked.y).toBe(238);
  });

  it("puts the glow copies at 62:200's boxes (the Harbinger copy 1 px right of 62:181, N-02)", () => {
    expect(classSlot(4, 0).copy.idle).toEqual({ x: 512, y: 256 });
    expect(classSlot(4, 1).copy.idle).toEqual({ x: 813, y: 256 });
    expect(classSlot(4, 3).copy.idle).toEqual({ x: 1415, y: 256 });
    expect(classSlot(4, 2).copy.picked.x).toBeCloseTo(1097, 6);
    expect(classSlot(4, 2).copy.picked.y).toBe(220);
  });

  it("keeps the Figma's own text offsets only in the four-card row", () => {
    expect(classSlot(4, 0).text.idle).toEqual({ name: -1, role: -1.5, allies: -1.5 });
    expect(classSlot(4, 2).text.picked).toEqual({ name: -0.564, role: 0, allies: -0.564 });
    expect(classSlot(3, 0).text.idle).toEqual({ name: 0, role: 0, allies: 0 });
  });

  // OD-1 without a plate (WP-CLASS CSS audit C1): aligned with the art, Figma's overlay stroke
  // (0.616 to 1.077 px off) was missing along three arches.
  it("keeps the Figma's own overlay offsets only in the four-card row", () => {
    expect([0, 1, 2, 3].map((index) => classSlot(4, index).overlay)).toEqual([
      { idle: { x: 0.859, y: 0.047 }, picked: { x: 0, y: 0 } },
      { idle: { x: 0, y: 0 }, picked: { x: 0, y: 0 } },
      { idle: { x: 0, y: 0 }, picked: { x: 0.616, y: 0.052 } },
      { idle: { x: 1.077, y: 0.047 }, picked: { x: 0, y: 0 } },
    ]);
    expect(classSlot(3, 0).overlay).toEqual({ idle: { x: 0, y: 0 }, picked: { x: 0, y: 0 } });
  });

  it("puts each Figma card's overlay where its plate's overlay stroke is (C§4.11)", () => {
    // Each plate's GLASS overlay node: 62:177, 62:176, 62:178, 62:179.
    const figmaCards = [
      [0, 'idle', { x: 525.039, y: 277.055 }],
      [1, 'idle', { x: 825.18, y: 277.008 }],
      [2, 'picked', { x: 1111.856, y: 243.696 }],
      [3, 'idle', { x: 1428.257, y: 277.055 }],
    ] as const;
    for (const [index, look, overlayOrigin] of figmaCards) {
      const slot = classSlot(4, index);
      const art = classArtOrigin(slot.card[look], look);

      expect(art.x + slot.overlay[look].x).toBeCloseTo(overlayOrigin.x, 6);
      expect(art.y + slot.overlay[look].y).toBeCloseTo(overlayOrigin.y, 6);
    }
  });

  it('centres other row lengths on the same pitch', () => {
    expect(classSlot(1, 0).card.idle).toEqual({ x: 971.5, y: 272 });
    expect(classSlot(2, 1).card.idle.x).toBe(1099 + 150.5 - 127.5);
  });
});

describe('art origins and plates', () => {
  it("puts each look's art at the Figma art node, where its plate was cut (I-45)", () => {
    const magus = classArtOrigin(classSlot(4, 2).card.picked, 'picked');
    const legionnaire = classArtOrigin(classSlot(4, 0).card.idle, 'idle');

    expect(magus.x).toBeCloseTo(1111.24, 6);
    expect(magus.y).toBeCloseTo(243.644, 6);
    expect(legionnaire).toEqual({ x: 524.18, y: 277.008 });
    expect(TEST_ASSET_BOXES['magus-card-plate-picked']).toMatchObject({
      left: Math.floor(magus.x),
      top: Math.floor(magus.y),
    });
  });

  it('places a card root at its integer floor with the remainder and text offsets as variables', () => {
    expect(
      classCardStyle({ x: 1106.015, y: 238 }, { name: -0.564, role: 0, allies: -0.564 }),
    ).toEqual({
      left: 1106,
      top: 238,
      '--card-fx': '0.015px',
      '--card-fy': '0px',
      '--name-dx': '-0.564px',
      '--role-dx': '0px',
      '--allies-dx': '-0.564px',
    });
  });

  it("gives cover mode the overlay's offset as variables", () => {
    expect(overlayVars({ x: 0.859, y: 0.047 })).toEqual({
      '--overlay-dx': '0.859px',
      '--overlay-dy': '0.047px',
    });
  });

  it('gives the plate its box in the root and each 1 px stroke its own node (OD-1)', () => {
    const box = TEST_ASSET_BOXES['magus-card-plate-picked'];
    if (box === undefined) throw new Error('magus plate missing');

    expect(
      plateVars(
        { x: 1106.015, y: 238 },
        box,
        { x: 1111.24, y: 243.644 },
        { x: 1111.856, y: 243.696 },
      ),
    ).toEqual({
      '--art-left': '5px',
      '--art-top': '5px',
      '--art-width': '277px',
      '--art-height': '592px',
      '--art-stroke-x': '0.225px',
      '--art-stroke-y': '0.644px',
      '--overlay-stroke-x': '0.841px',
      '--overlay-stroke-y': '0.696px',
    });
  });
});
