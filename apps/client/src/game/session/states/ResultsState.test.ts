import { describe, expect, it } from 'vitest';

import { spyContext } from '../../testSessionDeps';
import { ResultsState } from './ResultsState';

describe('ResultsState', () => {
  it("releases the match's assets once on exit", () => {
    const context = spyContext();

    new ResultsState().exit(context);

    expect(context.releaseAssets.mock.calls).toEqual([['match']]);
  });
});
