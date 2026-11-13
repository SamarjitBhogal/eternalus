import { describe, expect, it } from 'vitest';

import type { Overlay } from '../../bridge/events';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore } from '../testStore';
import { DuelLeaveDialog } from './DuelLeaveDialog';

const render = (overlay: Overlay | null): string =>
  renderWithStore(<DuelLeaveDialog />, {
    session: { ...sessionSlice.getInitialState(), overlay },
  });

describe('DuelLeaveDialog', () => {
  it('renders nothing unless the leave-duel overlay is open', () => {
    expect(render(null)).toBe('');
    expect(render('pause')).toBe('');
    expect(render('settings')).toBe('');
  });

  it('warns that leaving forfeits and that the match does not pause', () => {
    const html = render('leave-duel');

    expect(STRINGS.duelLeave.title).toBe('Leave the Duel?');
    expect(html).toContain(
      'If you leave, you forfeit the match and your opponent wins. The match does not pause.',
    );
    expect(html).toContain('role="dialog" aria-modal="true"');
  });

  it('offers Stay and Leave, with the focus on Stay', () => {
    const html = render('leave-duel');

    expect(buttonNames(html)).toEqual(['Stay', 'Leave']);
    expect(html).toMatch(/<button[^>]*autofocus=""[^>]*>Stay<\/button>/);
    expect(html.match(/autofocus=""/g)).toHaveLength(1);
  });
});
