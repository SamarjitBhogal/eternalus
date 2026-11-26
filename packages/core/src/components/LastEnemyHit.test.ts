import { describe, expect, it } from 'vitest';

import { LastEnemyHit } from './LastEnemyHit';

describe('LastEnemyHit', () => {
  it('keeps only the latest enemy hit, and hashes it', () => {
    const last = new LastEnemyHit('entity-1', 10);
    last.record('entity-2', 40);

    expect(last.attackerIdWithin(40, 900)).toBe('entity-2');
    expect(last.fields).toEqual(['entity-2', 40]);
  });

  it('names its attacker up to the window, and nobody after', () => {
    const last = new LastEnemyHit('entity-1', 100);

    expect(last.attackerIdWithin(1000, 900)).toBe('entity-1');
    expect(last.attackerIdWithin(1001, 900)).toBeNull();
  });
});
