import { describe, expect, it } from 'vitest';

import type { CrashReportState } from '../../bridge/CrashReport.types';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, sessionAt } from '../testStore';
import { CrashReportNotice } from './CrashReportNotice';

const { crashReportPopup: text } = STRINGS;

const render = (crashReport: CrashReportState | null, reason = 'match-crashed'): string =>
  renderWithStore(<CrashReportNotice />, {
    session: { ...sessionSlice.getInitialState(), ...sessionAt('menu', { reason }), crashReport },
  });

describe('CrashReportNotice', () => {
  it('shows nothing while no report is open', () => {
    expect(render(null)).toBe('');
  });

  it('asks for a note with the two buttons of DEC-106, the note field named by its prompt', () => {
    const html = render({ stage: 'asking', noteLimit: 2000 });

    expect(html).toMatch(/^<dialog /);
    expect(html).toContain(`>${text.matchMessage}</h2>`);
    expect(html).toContain(`>${text.notePrompt}</label>`);
    expect(html).toMatch(/<textarea[^>]*autofocus=""[^>]*maxLength="2000"/);
    expect(buttonNames(html)).toEqual([text.saveNote, text.returnToMenu]);
    expect(html).not.toContain('disabled');
    expect(html).not.toContain(text.copyMessage);
  });

  it('says the screen stopped after a screen crash', () => {
    const html = render({ stage: 'asking', noteLimit: 10 }, 'screen-crashed');

    expect(html).toContain(`>${text.screenMessage}</h2>`);
    expect(html).not.toContain(text.matchMessage);
  });

  it('names the dialog by its title', () => {
    const html = render({ stage: 'asking', noteLimit: 10 });
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];

    expect(html).toContain(`<h2 id="${labelledBy ?? '-'}"`);
  });

  it('turns the note field and the save button off while saving, and says so', () => {
    const html = render({ stage: 'saving', noteLimit: 10 });

    expect(html).toMatch(/<p role="status"[^>]*>Saving the note\.\.\.<\/p>/);
    expect(html).toMatch(/<textarea[^>]*disabled=""/);
    expect(html).toMatch(new RegExp(`<button[^>]*disabled=""[^>]*>${text.saveNote}<`));
    expect(html).toMatch(new RegExp(`<button(?![^>]*disabled)[^>]*>${text.returnToMenu}<`));
  });

  it('says where a saved report is and offers only the way back, focused', () => {
    const html = render({ stage: 'saved', file: 'logs/errors/a.json', noteLimit: 10 });

    expect(html).toContain(text.saved('logs/errors/a.json'));
    expect(html).not.toContain('<textarea');
    expect(buttonNames(html)).toEqual([text.returnToMenu]);
    expect(html).toMatch(/<button type="button"[^>]*autofocus=""/);
  });

  it('shows the report and a Copy report button beside the two buttons in copy mode', () => {
    const html = render({ stage: 'copy', copyText: '{"error":"x"}', noteLimit: 10 });

    expect(html).toContain(`>${text.copyMessage}</p>`);
    expect(html).toMatch(
      /<textarea[^>]*readOnly=""[^>]*>\{&quot;error&quot;:&quot;x&quot;\}<\/textarea>/,
    );
    expect(buttonNames(html)).toEqual([text.saveNote, text.copyReport, text.returnToMenu]);
  });
});
