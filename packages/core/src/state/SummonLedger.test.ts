import { describe, expect, it } from 'vitest';

import { GameEvents } from './GameEvents';
import { SummonLedger } from './SummonLedger';

const setUp = () => {
  const events = new GameEvents(() => 0);
  return { events, ledger: new SummonLedger(events) };
};

describe('SummonLedger', () => {
  it('lists a caster’s standing bodies of one definition, oldest first', () => {
    const { ledger } = setUp();

    ledger.record('caster-1', 'wall', 'entity-5');
    ledger.record('caster-1', 'orb', 'entity-6');
    ledger.record('caster-1', 'wall', 'entity-7');
    ledger.record('caster-2', 'wall', 'entity-8');

    expect(ledger.placedBy('caster-1', 'wall')).toEqual(['entity-5', 'entity-7']);
    expect(ledger.placedBy('caster-2', 'wall')).toEqual(['entity-8']);
    expect(ledger.placedBy('caster-3', 'wall')).toEqual([]);
    expect(ledger.size).toBe(2);
  });

  it('forgets a body when it leaves the world, whatever the cause, and a caster left with none', () => {
    const { events, ledger } = setUp();
    ledger.record('caster-1', 'wall', 'entity-5');
    ledger.record('caster-1', 'wall', 'entity-7');

    events.emit('entity-removed', { entityId: 'entity-5', cause: 'died' });
    expect(ledger.placedBy('caster-1', 'wall')).toEqual(['entity-7']);
    events.emit('entity-removed', { entityId: 'caster-1', cause: 'died' });
    expect(ledger.placedBy('caster-1', 'wall')).toEqual(['entity-7']);
    events.emit('entity-removed', { entityId: 'entity-7', cause: 'despawned' });
    expect(ledger.size).toBe(0);
  });

  it('visits each caster with its bodies, in the order it first placed one', () => {
    const { ledger } = setUp();
    ledger.record('caster-2', 'wall', 'entity-5');
    ledger.record('caster-1', 'wall', 'entity-6');
    const visited: string[] = [];

    ledger.forEach((ownerId, placed) => {
      visited.push(`${ownerId}: ${placed.map(({ entityId }) => entityId).join(' ')}`);
    });

    expect(visited).toEqual(['caster-2: entity-5', 'caster-1: entity-6']);
  });
});
