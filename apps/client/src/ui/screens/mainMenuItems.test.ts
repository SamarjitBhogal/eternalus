import { afterEach, describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { mainMenuItems } from './mainMenuItems';

describe('mainMenuItems', () => {
  const seen: UiIntent[] = [];
  const stop = eventBus.on('ui-intent', (intent) => seen.push(intent));
  afterEach(() => {
    seen.length = 0;
  });

  it('emits start-match, one navigate to the Duel name entry and one navigate per sub-screen, in menu order', () => {
    const items = mainMenuItems('Chronicle');
    for (const item of items) item.onSelect();
    expect(seen).toEqual([
      { kind: 'start-match' },
      { kind: 'navigate', route: 'duel-name' },
      { kind: 'navigate', route: 'loadouts' },
      { kind: 'navigate', route: 'profile' },
      { kind: 'navigate', route: 'settings' },
      { kind: 'navigate', route: 'about' },
    ]);
    expect(items[3]?.label).toBe('Chronicle');
    stop();
  });
});
