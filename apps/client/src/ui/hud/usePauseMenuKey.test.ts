import { afterEach, describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { pauseMenuKeyIntent, pressPauseMenuKey } from './usePauseMenuKey';

/** A stand-in for a focused element; only its identity matters here. */
type Marker = { readonly name: string };

/** Records each `ui-intent` with what the opener ref held at that moment (bus order). */
function recordIntents(openerRef: { current: Marker | null }) {
  const seen: { intent: UiIntent; opener: Marker | null }[] = [];
  const off = eventBus.on('ui-intent', (intent) => {
    seen.push({ intent, opener: openerRef.current });
  });
  return { seen, off };
}

let stop: () => void = () => undefined;
afterEach(() => {
  stop();
});

describe('pauseMenuKeyIntent', () => {
  it('opens the pause menu, closes it, and goes back to it from the settings', () => {
    expect(pauseMenuKeyIntent(null)).toEqual({ kind: 'open-overlay', overlay: 'pause' });
    expect(pauseMenuKeyIntent('pause')).toEqual({ kind: 'close-overlay' });
    expect(pauseMenuKeyIntent('settings')).toEqual({ kind: 'open-overlay', overlay: 'pause' });
  });
});

describe('pressPauseMenuKey', () => {
  const marker: Marker = { name: 'focused button' };

  it('stores the focused element before it emits open-overlay (I-72)', () => {
    const openerRef: { current: Marker | null } = { current: null };
    const { seen, off } = recordIntents(openerRef);
    stop = off;
    pressPauseMenuKey(null, openerRef, { activeElement: marker });
    expect(seen).toEqual([{ intent: { kind: 'open-overlay', overlay: 'pause' }, opener: marker }]);
  });

  it('leaves the stored opener alone while an overlay is open', () => {
    const before: Marker = { name: 'canvas' };
    const openerRef: { current: Marker | null } = { current: before };
    const { seen, off } = recordIntents(openerRef);
    stop = off;
    pressPauseMenuKey('pause', openerRef, { activeElement: marker });
    pressPauseMenuKey('settings', openerRef, { activeElement: marker });
    expect(openerRef.current).toBe(before);
    expect(seen.map(({ intent }) => intent.kind)).toEqual(['close-overlay', 'open-overlay']);
  });
});
