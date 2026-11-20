import { describe, expect, it } from 'vitest';

import { GameEvents } from './GameEvents';
import { ChargeLedger } from './ChargeLedger';

const setUp = () => {
  const events = new GameEvents(() => 0);
  return { events, ledger: new ChargeLedger(events) };
};

describe('ChargeLedger', () => {
  it('reads 0 for an entity with no announced change', () => {
    expect(setUp().ledger.announcedChargeOf('entity-1')).toBe(0);
  });

  it('keeps the charge of the last ultimate-charged for each entity', () => {
    const { events, ledger } = setUp();
    events.emit('ultimate-charged', {
      entityId: 'entity-1',
      amount: 0.25,
      charge: 0.25,
      cause: 'legend-kill',
    });
    events.emit('ultimate-charged', {
      entityId: 'entity-1',
      amount: 0.05,
      charge: 0.3,
      cause: 'checkpoint',
    });
    events.emit('ultimate-charged', {
      entityId: 'entity-2',
      amount: 0.12,
      charge: 0.12,
      cause: 'assist',
    });

    expect(ledger.announcedChargeOf('entity-1')).toBe(0.3);
    expect(ledger.announcedChargeOf('entity-2')).toBe(0.12);
  });

  it("empties on an ultimate's cast only, and forgets a removed entity", () => {
    const { events, ledger } = setUp();
    for (const entityId of ['entity-1', 'entity-2']) {
      events.emit('ultimate-charged', { entityId, amount: 1, charge: 1, cause: 'legend-kill' });
    }

    events.emit('ability-cast', { casterId: 'entity-1', abilityId: 'strike', slot: 'ability-1' });
    expect(ledger.announcedChargeOf('entity-1')).toBe(1);
    events.emit('ability-cast', { casterId: 'entity-1', abilityId: 'fury', slot: 'ability-4' });
    expect(ledger.announcedChargeOf('entity-1')).toBe(0);

    events.emit('entity-removed', { entityId: 'entity-2', cause: 'died' });
    expect(ledger.announcedChargeOf('entity-2')).toBe(0);
  });
});
