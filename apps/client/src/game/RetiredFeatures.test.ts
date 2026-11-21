import { describe, expect, it } from 'vitest';

import { RetiredFeatures } from './RetiredFeatures';

const snapshotOf = (...featureIds: readonly (string | undefined)[]) => ({
  entities: featureIds.map((mapFeatureId) => (mapFeatureId === undefined ? {} : { mapFeatureId })),
});

describe('RetiredFeatures', () => {
  it('retires a structure that stood and is gone, and no other', () => {
    const retired = new RetiredFeatures();
    retired.observe(snapshotOf('tower-a', 'tower-b', undefined));
    expect(retired.isRetired('tower-a')).toBe(false);

    retired.observe(snapshotOf('tower-b', undefined));
    expect(retired.isRetired('tower-a')).toBe(true);
    expect(retired.isRetired('tower-b')).toBe(false);
    expect(retired.isRetired('never-seen')).toBe(false);
  });

  it('keeps a feature retired once it is retired', () => {
    const retired = new RetiredFeatures();
    retired.observe(snapshotOf('tower-a'));
    retired.observe(snapshotOf());
    retired.observe(snapshotOf());
    expect(retired.isRetired('tower-a')).toBe(true);
  });
});
