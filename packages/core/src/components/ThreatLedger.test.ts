import { describe, expect, it } from 'vitest';

import { ThreatLedger } from './ThreatLedger';

describe('ThreatLedger', () => {
  it('totals each attacker from a tick on, in plain string id order', () => {
    const ledger = new ThreatLedger();
    ledger.record('entity-3', 10, 5, 0);
    ledger.record('entity-12', 20, 6, 0);
    ledger.record('entity-3', 5, 7, 0);

    expect(ledger.totalsSince(0)).toEqual([
      { attackerId: 'entity-12', amount: 20 },
      { attackerId: 'entity-3', amount: 15 },
    ]);
    expect(ledger.totalsSince(6)).toEqual([
      { attackerId: 'entity-12', amount: 20 },
      { attackerId: 'entity-3', amount: 5 },
    ]);
  });

  it('forgets the hits before the window on each record, and keeps one on its edge', () => {
    const ledger = new ThreatLedger();
    ledger.record('entity-2', 10, 5, 0);
    ledger.record('entity-3', 20, 10, 0);
    ledger.record('entity-4', 30, 15, 10);

    expect(ledger.fields).toEqual(['entity-3', 10, 20, 'entity-4', 15, 30]);
    expect(ledger.totalsSince(0).map(({ attackerId }) => attackerId)).toEqual([
      'entity-3',
      'entity-4',
    ]);
  });

  it('forgets every older hit when none is inside the window', () => {
    const ledger = new ThreatLedger();
    ledger.record('entity-2', 10, 5, 0);
    ledger.record('entity-3', 20, 50, 40);

    expect(ledger.fields).toEqual(['entity-3', 50, 20]);
  });
});
