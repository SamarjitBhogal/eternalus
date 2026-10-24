import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legendCatalogue';
import { LOCKED_CLASSES } from './lockedClassCatalogue';

describe('LOCKED_CLASSES', () => {
  it('holds the flying class as the locked Harbinger card (DEC-48)', () => {
    expect(LOCKED_CLASSES.all()).toEqual([
      {
        id: 'flying',
        displayName: 'Harbinger',
        roleBlurb: 'Air-based; moves primarily in the air, like a jet or helicopter.',
        roleLabel: 'aerial',
      },
    ]);
  });

  it('shares no id with a playable Legend class (a locked class has no LegendDefinition)', () => {
    for (const id of LOCKED_CLASSES.ids) expect(LEGEND_CLASSES.has(id)).toBe(false);
  });
});
