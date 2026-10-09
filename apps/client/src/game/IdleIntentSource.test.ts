import { describe, expect, it } from 'vitest';

import { IdleIntentSource } from './IdleIntentSource';

describe('IdleIntentSource', () => {
  it('never moves, aims or triggers anything', () => {
    expect(new IdleIntentSource().read()).toEqual({
      move: { x: 0, y: 0 },
      aim: null,
      triggered: [],
    });
  });
});
