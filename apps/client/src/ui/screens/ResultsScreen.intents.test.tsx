// @vitest-environment happy-dom
// A page for this file only (DEC-111): clicks need one; the rest of the suite stays in Node.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';

import { matchResultFixture } from '../../bridge/__fixtures__/matchResultFixtures';
import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { createAppStore } from '../../bridge/store';
import { STRINGS } from '../strings';
import { TEST_CONTENT } from '../testStore';
import { ResultsScreen } from './ResultsScreen';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let stop = (): void => undefined;

/** Mounts the screen after a light win and records every intent it emits. */
function mount(): { readonly container: HTMLElement; readonly intents: UiIntent[] } {
  const store = createAppStore({
    content: TEST_CONTENT,
    match: { ...matchSlice.getInitialState(), result: matchResultFixture(), durationSeconds: 60 },
    matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: 'light' },
  });
  const intents: UiIntent[] = [];
  stop = eventBus.on('ui-intent', (intent) => intents.push(intent));
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Provider store={store}>
        <ResultsScreen />
      </Provider>,
    );
  });
  return { container, intents };
}

afterEach(() => {
  stop();
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

describe('ResultsScreen buttons, in a page', () => {
  it.each<[string, UiIntent]>([
    [STRINGS.results.continue, { kind: 'continue' }],
    [STRINGS.results.playAgain, { kind: 'start-match' }],
    [STRINGS.results.mainMenu, { kind: 'navigate', route: 'home' }],
  ])('%s emits its intent', (name, intent) => {
    const { container, intents } = mount();
    const button = [...container.querySelectorAll('button')].find(
      (candidate) => candidate.textContent === name,
    );

    act(() => {
      button?.click();
    });

    expect(intents).toEqual([intent]);
  });
});
