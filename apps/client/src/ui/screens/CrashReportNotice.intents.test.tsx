// @vitest-environment happy-dom
// A page for this file only (DEC-111): the rest of the suite stays in Node.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CrashReportState } from '../../bridge/CrashReport.types';
import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { createAppStore } from '../../bridge/store';
import { STRINGS } from '../strings';
import { CrashReportNotice } from './CrashReportNotice';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { crashReportPopup: text } = STRINGS;
let root: Root | undefined;
const intents: UiIntent[] = [];
eventBus.on('ui-intent', (intent) => intents.push(intent));

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = undefined;
  intents.length = 0;
});

/** Mounts the popup on `report`; returns the page's buttons and note field by their text. */
function mount(report: CrashReportState) {
  const store = createAppStore({
    session: { ...sessionSlice.getInitialState(), phase: 'menu', crashReport: report },
  });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Provider store={store}>
        <CrashReportNotice />
      </Provider>,
    );
  });
  const button = (name: string): HTMLButtonElement | undefined =>
    [...container.querySelectorAll('button')].find((element) => element.textContent === name);
  return { container, button, store };
}

/** Types `value` into the note field the way a keystroke does. */
function type(field: HTMLTextAreaElement | null, value: string): void {
  act(() => {
    // React tracks a field's value through its own setter, so the test types through the
    // prototype's, as a keystroke does.
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with `this` set below.
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setValue?.call(field, value);
    field?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('CrashReportNotice intents', () => {
  it('sends the typed note with "Save note and return to menu"', () => {
    const { container, button } = mount({
      stage: 'asking',
      noteLimit: 2000,
      cause: 'match',
      crashNumber: 1,
    });
    type(container.querySelector('textarea'), 'I pressed R');

    act(() => {
      button(text.saveNote)?.click();
    });

    expect(intents).toEqual([{ kind: 'save-crash-note', note: 'I pressed R' }]);
  });

  it('sends dismiss-crash-report with "Return to menu"', () => {
    const { button } = mount({ stage: 'asking', noteLimit: 2000, cause: 'match', crashNumber: 1 });

    act(() => {
      button(text.returnToMenu)?.click();
    });

    expect(intents).toEqual([{ kind: 'dismiss-crash-report' }]);
  });

  it('copies the report text with "Copy report"', () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { button } = mount({
      stage: 'copy',
      copyText: 'REPORT',
      isReportSaved: false,
      noteLimit: 10,
      cause: 'match',
      crashNumber: 1,
    });

    act(() => {
      button(text.copyReport)?.click();
    });

    expect(writeText).toHaveBeenCalledWith('REPORT');
    expect(intents).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('survives a page with no clipboard', async () => {
    vi.stubGlobal('navigator', {});
    const { button } = mount({
      stage: 'copy',
      copyText: 'REPORT',
      isReportSaved: false,
      noteLimit: 10,
      cause: 'match',
      crashNumber: 1,
    });

    await act(async () => {
      button(text.copyReport)?.click();
      await Promise.resolve();
    });

    expect(intents).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('opens as a modal dialog and closes it again when the report closes', () => {
    const { container } = mount({ stage: 'asking', noteLimit: 10, cause: 'match', crashNumber: 1 });
    const dialog = container.querySelector('dialog');

    expect(dialog?.open).toBe(true);
    act(() => {
      root?.unmount();
    });
    root = undefined;
    expect(dialog?.open).toBe(false);
  });

  it('starts the note field empty for a second crash, and keeps the note while one crash saves', () => {
    const asking = { stage: 'asking', noteLimit: 2000, cause: 'match', crashNumber: 1 } as const;
    const { container, store } = mount(asking);
    type(container.querySelector('textarea'), 'first crash note');
    act(() => {
      store.dispatch(sessionSlice.actions.crashReportChanged({ ...asking, stage: 'saving' }));
    });
    expect(container.querySelector('textarea')?.value).toBe('first crash note');

    act(() => {
      store.dispatch(sessionSlice.actions.crashReportChanged({ ...asking, crashNumber: 2 }));
    });

    expect(container.querySelector('textarea')?.value).toBe('');
  });
});
