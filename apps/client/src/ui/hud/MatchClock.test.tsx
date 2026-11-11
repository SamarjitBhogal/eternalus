import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { MatchClock } from './MatchClock';

describe('MatchClock', () => {
  it('shows the Figma clock 14:32 as a labelled timer', () => {
    const html = renderWithStore(<MatchClock />, { match: figmaHudState().match });
    expect(html).toMatch(/role="timer"[^>]*>14:32<\/div>/);
    expect(accessibleNames(html, '[role=timer]')).toEqual(['Match time']);
  });

  it('shows a dash before the first tick', () => {
    expect(renderWithStore(<MatchClock />)).toMatch(/>—<\/div>/);
  });
});
