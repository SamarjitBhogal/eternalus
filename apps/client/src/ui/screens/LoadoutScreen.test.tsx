import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { LoadoutScreen } from './LoadoutScreen';

describe('LoadoutScreen', () => {
  it('lists the content classes read-only and says loadouts come in sprint 2', () => {
    const html = renderWithStore(<LoadoutScreen />);
    expect(html).toContain(STRINGS.comingSoon);
    for (const card of TEST_CONTENT.legendClasses) {
      expect(html).toContain(card.displayName);
      expect(html).toContain(card.blurb);
    }
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });
});
