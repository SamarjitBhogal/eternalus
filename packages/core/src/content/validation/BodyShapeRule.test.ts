import { describe, expect, it } from 'vitest';

import { GREATER_BOSS } from '../mobs/greaterBoss';
import { TRAINING_DUMMY } from '../mobs/trainingDummy';
import type { UnitDefinition } from '../units/units.types';
import { BodyShapeRule } from './BodyShapeRule';

const SQUARE = [
  { x: -2, y: -2 },
  { x: 2, y: -2 },
  { x: 2, y: 2 },
  { x: -2, y: 2 },
];
const HEAD = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 0, y: 0 },
];

const withShape = (bodyShape: UnitDefinition['bodyShape']): UnitDefinition => ({
  ...TRAINING_DUMMY,
  ...(bodyShape === undefined ? {} : { bodyShape }),
});

describe('BodyShapeRule', () => {
  it('accepts the Greater Boss, a unit without a body shape, and an outline without a head', () => {
    const rule = new BodyShapeRule();

    expect(rule.check(GREATER_BOSS)).toEqual([]);
    expect(rule.check(TRAINING_DUMMY)).toEqual([]);
    expect(rule.check(withShape({ outline: SQUARE }))).toEqual([]);
  });

  it('flags an outline with fewer than 3 corners or a corner that is not finite', () => {
    const rule = new BodyShapeRule();

    for (const outline of [SQUARE.slice(0, 2), [...SQUARE.slice(1), { x: Number.NaN, y: 0 }]]) {
      expect(rule.check(withShape({ outline, head: HEAD }))).toEqual([
        'bodyShape.outline needs at least 3 finite corners',
      ]);
    }
  });

  it('flags an outline that does not hold the whole footprint circle (DEC-421)', () => {
    const rule = new BodyShapeRule();
    // The training dummy's circle is 0.4 m: one edge 0.3 m from its centre, or a shape beside it.
    const tooThin = SQUARE.map(({ x, y }) => ({ x, y: y < 0 ? -0.3 : y }));
    const beside = SQUARE.map(({ x, y }) => ({ x: x + 3, y }));

    for (const outline of [tooThin, beside]) {
      expect(rule.check(withShape({ outline }))).toEqual([
        'bodyShape.outline must hold the whole footprint circle',
      ]);
    }
  });

  it('flags a head with fewer than 3 corners or a corner that is not finite', () => {
    const rule = new BodyShapeRule();

    for (const head of [
      HEAD.slice(0, 2),
      [...HEAD.slice(1), { x: 0, y: Number.POSITIVE_INFINITY }],
    ]) {
      expect(rule.check(withShape({ outline: SQUARE, head }))).toEqual([
        'bodyShape.head needs at least 3 finite corners',
      ]);
    }
  });

  it('flags a head with a corner outside the outline', () => {
    const head = [...HEAD.slice(0, 2), { x: 3, y: 0 }];

    expect(new BodyShapeRule().check(withShape({ outline: SQUARE, head }))).toEqual([
      'bodyShape.head must be inside bodyShape.outline',
    ]);
  });
});
