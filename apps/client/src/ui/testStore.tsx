import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

import type { DisplayCatalogue, MenuRoute, SessionPhase } from '../bridge/events';
import { sessionSlice } from '../bridge/slices/sessionSlice';
import { createAppStore, type RootState } from '../bridge/store';

/** A small catalogue for UI tests (ui/ may not import the game's placeholder catalogue). */
export const TEST_CONTENT: DisplayCatalogue = {
  legendClasses: [
    { classId: 'warrior', displayName: 'Warrior', blurb: 'Quick and light.', specs: [] },
    { classId: 'magus', displayName: 'Magus', blurb: 'Casts and revives.', specs: [] },
  ],
  backgroundSets: [
    {
      id: 'test-neutral',
      team: 'neutral',
      layers: [
        { kind: 'gradient', angleDeg: 90, stops: ['--surface-0', '--team-neutral-accent'] },
        { kind: 'particles', count: 3, colourToken: '--team-neutral-primary' },
        { kind: 'image', src: '/backgrounds/test.png' },
      ],
    },
  ],
  profileDisplayName: 'Chronicle',
};

/** Session slice state at `phase`, optionally on a menu route with a reason. */
export function sessionAt(
  phase: SessionPhase,
  extra: { readonly menuRoute?: MenuRoute; readonly reason?: string } = {},
): RootState['session'] {
  return { ...sessionSlice.getInitialState(), phase, ...extra };
}

/** Server-renders `element` inside a store built from `state` (content defaults to `TEST_CONTENT`). */
export function renderWithStore(element: ReactElement, state: Partial<RootState> = {}): string {
  const store = createAppStore({ content: TEST_CONTENT, ...state });
  return renderToStaticMarkup(<Provider store={store}>{element}</Provider>);
}

/** The accessible name (text content) of every `<button>` in server-rendered `html`. */
export function buttonNames(html: string): string[] {
  return [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, inner = '']) =>
    inner.replace(/<[^>]+>/g, '').trim(),
  );
}
