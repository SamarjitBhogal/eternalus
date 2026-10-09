import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore } from '../testStore';
import { ProfileScreen } from './ProfileScreen';

describe('ProfileScreen', () => {
  it('is titled with the content display name and is a read-only shell', () => {
    const html = renderWithStore(<ProfileScreen />);
    expect(html).toMatch(/<h2[^>]*>Chronicle<\/h2>/);
    expect(html).toContain(STRINGS.comingSoon);
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });
});
