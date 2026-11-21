import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, sessionAt } from '../testStore';
import { dismissOnCancel, SelectTimeoutNotice } from './SelectTimeoutNotice';

const { selectTimeoutPopup: text } = STRINGS;

const render = (reason?: string): string =>
  renderWithStore(<SelectTimeoutNotice />, {
    session: sessionAt('menu', reason === undefined ? {} : { reason }),
  });

describe('SelectTimeoutNotice', () => {
  it('shows the owner’s title and text and one close control after a select timeout (DEC-102)', () => {
    const html = render('select-timeout');

    expect(text).toEqual({
      title: 'Failed to Choose Legend',
      text: 'The countdown ended before you locked in a Legend. You have been returned to the lobby.',
      close: 'Continue',
    });
    expect(html).toMatch(/^<dialog /);
    expect(html).toContain(`>${text.title}</h2>`);
    expect(html).toContain(`>${text.text}</p>`);
    expect(buttonNames(html)).toEqual([text.close]);
  });

  it('is named by its title and described by its text', () => {
    const html = render('select-timeout');
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];

    expect(html).toContain(`<h2 id="${labelledBy ?? '-'}"`);
    expect(html).toContain(`<p id="${describedBy ?? '-'}"`);
  });

  it('gives the close control the focus', () => {
    expect(render('select-timeout')).toMatch(/<button type="button"[^>]*autofocus=""/);
  });

  it('shows nothing without a select timeout', () => {
    for (const reason of [undefined, 'cancelled', 'match-failed', 'load-failed']) {
      expect(render(reason)).toBe('');
    }
  });

  it('dismisses on Escape and keeps the browser from closing the dialog itself', () => {
    let dismissed = 0;
    let prevented = 0;

    dismissOnCancel(() => {
      dismissed += 1;
    })({
      preventDefault: () => {
        prevented += 1;
      },
    });

    expect([dismissed, prevented]).toEqual([1, 1]);
  });
});
