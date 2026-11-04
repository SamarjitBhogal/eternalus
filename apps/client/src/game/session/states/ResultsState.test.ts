import { describe, expect, it } from 'vitest';

import { FakeSessionContext } from '../../FakeSessionContext';
import { ResultsState } from './ResultsState';

describe('ResultsState', () => {
  it("releases the match's assets once on exit", () => {
    const context = new FakeSessionContext();

    new ResultsState().exit(context);

    expect(context.calls.releaseAssets).toEqual([['match']]);
  });
});
