import { describe, expect, it } from 'vitest';

import { FakeRunningMatch } from './FakeRunningMatch';

describe('FakeRunningMatch', () => {
  it('starts with no destroy and no pause recorded', () => {
    const match = new FakeRunningMatch();

    expect({ destroyCount: match.destroyCount, pauses: match.pauses }).toEqual({
      destroyCount: 0,
      pauses: [],
    });
  });

  it('counts every destroy and records every pause in call order', () => {
    const match = new FakeRunningMatch();

    match.setPaused(true);
    match.setPaused(false);
    match.destroy();
    match.destroy();

    expect({ destroyCount: match.destroyCount, pauses: match.pauses }).toEqual({
      destroyCount: 2,
      pauses: [true, false],
    });
  });
});
