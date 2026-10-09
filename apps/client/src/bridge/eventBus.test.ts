import { describe, expect, it } from 'vitest';

import { emitIntent, eventBus } from './eventBus';
import type { UiIntent } from './events';

describe('eventBus', () => {
  it('emitIntent publishes one ui-intent on the app bus', () => {
    const seen: UiIntent[] = [];
    const stop = eventBus.on('ui-intent', (intent) => seen.push(intent));
    emitIntent({ kind: 'confirm-selection' });
    stop();
    expect(seen).toEqual([{ kind: 'confirm-selection' }]);
  });
});
