import { describe, expect, it } from 'vitest';

import { loadingSlice } from './loadingSlice';

describe('loadingSlice', () => {
  it('is idle until the first progress event, then mirrors the latest one', () => {
    expect(loadingSlice.getInitialState().status).toBe('idle');
    const progress = {
      group: 'match',
      loaded: 3,
      total: 4,
      bytesLoaded: 30,
      bytesTotal: 40,
      status: 'loading',
    } as const;
    expect(loadingSlice.reducer(undefined, loadingSlice.actions.progressChanged(progress))).toEqual(
      progress,
    );
  });
});
