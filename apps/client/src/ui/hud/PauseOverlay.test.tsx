import { describe, expect, it } from 'vitest';

import type { Overlay } from '../../bridge/events';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { buttonNames, renderWithStore } from '../testStore';
import { PauseOverlay } from './PauseOverlay';

function render(overlay: Overlay | null): string {
  return renderWithStore(<PauseOverlay openerRef={{ current: null }} />, {
    session: { ...sessionSlice.getInitialState(), overlay },
  });
}

describe('PauseOverlay', () => {
  it('renders nothing while no overlay is open', () => {
    expect(render(null)).toBe('');
  });

  it('offers Resume, Settings and Leave match in a labelled modal dialog', () => {
    const html = render('pause');
    const titleId = /<h2 id="([^"]+)"[^>]*>Paused<\/h2>/.exec(html)?.[1];

    expect(html).toContain(`role="dialog" aria-modal="true" aria-labelledby="${titleId ?? ''}"`);
    expect(buttonNames(html)).toEqual(['Resume', 'Settings', 'Leave match']);
  });

  it('embeds the settings screen when the settings overlay is open', () => {
    const html = render('settings');

    expect(html).toContain('aria-label="Settings"');
    expect(html).toContain('role="tablist"');
    expect(html).not.toContain('Leave match');
  });

  it('autofocuses Resume in the pause view (I-72)', () => {
    expect(render('pause')).toMatch(/<button[^>]*autofocus=""[^>]*>Resume<\/button>/);
    expect(render('pause').match(/autofocus=""/g)).toHaveLength(1);
  });

  it('makes the dialog itself focusable for the settings view', () => {
    expect(render('settings')).toMatch(/<div role="dialog"[^>]*tabindex="-1"/);
  });
});
