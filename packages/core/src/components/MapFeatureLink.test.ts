import { expect, it } from 'vitest';

import { MapFeatureLink } from './MapFeatureLink';

it('keeps the id of the map feature it was given', () => {
  expect(new MapFeatureLink('light-stronghold').featureId).toBe('light-stronghold');
});
