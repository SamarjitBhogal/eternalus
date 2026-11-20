import { describe, expect, it } from 'vitest';

import { createDefaultStatusCueRegistry } from './defaultStatusCueRegistry';
import { StatusCueRegistry } from './StatusCueRegistry';
import type { StatusCueView } from './StatusCueRegistry.types';
import { WindupRingsView } from './WindupRingsView';

const cue = (): StatusCueView => ({ draw: () => undefined });

describe('StatusCueRegistry', () => {
  it('finds the view registered for a status, and none for another', () => {
    const stun = cue();
    const registry = new StatusCueRegistry();
    registry.register('stun', stun);

    expect(registry.viewFor('stun')).toBe(stun);
    expect(registry.viewFor('slow')).toBeUndefined();
  });

  it('lists the statuses it draws in the order they were registered', () => {
    const registry = new StatusCueRegistry();
    registry.register('stun', cue());
    registry.register('slow', cue());

    expect(registry.statusIds).toEqual(['stun', 'slow']);
  });

  it('refuses a second view for one status', () => {
    const registry = new StatusCueRegistry();
    registry.register('stun', cue());

    expect(() => {
      registry.register('stun', cue());
    }).toThrow('Status "stun" already has a cue view.');
  });

  it('ships the wind-up rings for fury-windup and no other cue (DEC-283)', () => {
    const registry = createDefaultStatusCueRegistry();

    expect(registry.statusIds).toEqual(['fury-windup']);
    expect(registry.viewFor('fury-windup')).toBeInstanceOf(WindupRingsView);
  });
});
