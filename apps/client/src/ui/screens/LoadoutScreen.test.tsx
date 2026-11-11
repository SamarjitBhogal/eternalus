import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { LoadoutScreen } from './LoadoutScreen';

describe('LoadoutScreen', () => {
  it('lists the playable content classes read-only and says loadouts come in sprint 2', () => {
    const html = renderWithStore(<LoadoutScreen />);
    expect(html).toContain(STRINGS.comingSoon);
    const playable = TEST_CONTENT.legendClasses.filter((card) => card.status === 'available');
    expect(playable.map((card) => card.classId)).toEqual(['warrior', 'sentinel', 'magus']);
    for (const card of playable) {
      expect(html).toContain(card.displayName);
      expect(html).toContain(card.blurb);
    }
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });

  it('leaves the locked class out', () => {
    const html = renderWithStore(<LoadoutScreen />);
    const locked = TEST_CONTENT.legendClasses.find((card) => card.status === 'locked');
    expect(locked?.displayName).toBe('Harbinger');
    expect(html).not.toContain('Harbinger');
    expect(html).not.toContain(locked?.blurb);
    expect(html.match(/<li>/g)).toHaveLength(3);
  });
});
