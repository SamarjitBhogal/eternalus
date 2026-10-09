import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore } from '../testStore';
import { AboutScreen } from './AboutScreen';

describe('AboutScreen', () => {
  it('shows credits, the licence list and a way back', () => {
    const html = renderWithStore(<AboutScreen />);
    expect(html).toContain(STRINGS.about.credits);
    for (const licence of STRINGS.about.licences) expect(html).toContain(licence);
    expect(buttonNames(html)).toEqual([STRINGS.back]);
  });
});
