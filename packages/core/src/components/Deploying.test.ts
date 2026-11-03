import { describe, expect, it } from 'vitest';

import { Deploying } from './Deploying';

describe('Deploying', () => {
  it('keeps the exit its mob walks out to', () => {
    expect(new Deploying({ x: 12, y: -3 }).exit).toEqual({ x: 12, y: -3 });
  });
});
