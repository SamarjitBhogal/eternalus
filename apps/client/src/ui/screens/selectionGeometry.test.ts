import { describe, expect, it } from 'vitest';

import { offset, originRemainder, rowPlateOf } from './selectionGeometry';

/** Rounds every number to 2 decimals (Figma's own precision), keeping the shape. */
const near = (point: { readonly x: number; readonly y: number }) => ({
  x: Number(point.x.toFixed(2)),
  y: Number(point.y.toFixed(2)),
});

describe('offset', () => {
  it('moves a point by another, fractions kept', () => {
    expect(offset({ x: 501, y: 250 }, { x: -21, y: -29 })).toEqual({ x: 480, y: 221 });
    expect(near(offset({ x: 1144.66, y: 250.62 }, { x: 0.5, y: -0.62 }))).toEqual({
      x: 1145.16,
      y: 250,
    });
  });
});

describe('originRemainder', () => {
  it('is the part of the origin past its integer floor', () => {
    expect(near(originRemainder({ x: 470.67, y: 194 }))).toEqual({ x: 0.67, y: 0 });
  });
});

describe('rowPlateOf', () => {
  const box = { left: 474, top: 165, width: 972, height: 712 };

  it('is the plate to draw once its file is loaded and its box is known', () => {
    expect(rowPlateOf('/assets/plate.webp', box)).toEqual({ url: '/assets/plate.webp', box });
  });

  it('is nothing while the file is not loaded, or the image has no box', () => {
    expect(rowPlateOf(null, box)).toBeNull();
    expect(rowPlateOf('/assets/plate.webp', null)).toBeNull();
    expect(rowPlateOf(null, null)).toBeNull();
  });
});
