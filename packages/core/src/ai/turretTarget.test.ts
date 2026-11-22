import { describe, expect, it } from 'vitest';

import type { TurretTargetPriority } from '../content/structures/turrets.types';
import { chooseTurretTarget } from './turretTarget';
import type { TurretCandidate } from './turretTarget.types';

const OVERRIDES: readonly TurretTargetPriority[] = ['legend-hurting-ally-legend'];
const PRIORITY: readonly TurretTargetPriority[] = ['heavy-unit', 'nearest-enemy'];
const HEAVY = ['sentinel', 'heavy-mob'];

const candidate = (
  id: string,
  distanceSquared: number,
  kind = 'light-mob',
  hasHurtAllyLegend = false,
): TurretCandidate => ({ id, kind, position: { x: 0, y: 0 }, distanceSquared, hasHurtAllyLegend });

const choose = (candidates: readonly TurretCandidate[], currentId: string | null = null) =>
  chooseTurretTarget({
    currentId,
    candidates,
    overrides: OVERRIDES,
    priority: PRIORITY,
    heavyKinds: HEAVY,
  });

describe('chooseTurretTarget', () => {
  it('takes nothing when no enemy is in range', () => {
    expect(choose([])).toBeNull();
  });

  it('takes the nearest enemy when no other rule names one', () => {
    expect(choose([candidate('entity-1', 50), candidate('entity-2', 10)])).toBe('entity-2');
  });

  it('prefers a heavy unit to a nearer light one', () => {
    expect(choose([candidate('entity-1', 4), candidate('entity-2', 90, 'heavy-mob')])).toBe(
      'entity-2',
    );
    expect(choose([candidate('entity-1', 4), candidate('entity-3', 90, 'sentinel')])).toBe(
      'entity-3',
    );
  });

  it('prefers an enemy Legend that hurt an allied Legend to a heavy unit and a nearer enemy', () => {
    const hurter = candidate('entity-3', 150, 'warrior', true);

    expect(choose([candidate('entity-1', 4), candidate('entity-2', 9, 'sentinel'), hurter])).toBe(
      'entity-3',
    );
  });

  it('keeps its current target while it is still in range and alive, whatever the priority says', () => {
    const current = candidate('entity-1', 160);
    const better = [candidate('entity-2', 4, 'sentinel'), candidate('entity-3', 1)];

    expect(choose([current, ...better], 'entity-1')).toBe('entity-1');
  });

  it('switches at once from its current target to an enemy Legend that hurt an allied Legend (the defend-ally override, 11 §4.5)', () => {
    const current = candidate('entity-1', 1, 'sentinel');
    const hurter = candidate('entity-2', 160, 'warrior', true);

    expect(choose([current, hurter], 'entity-1')).toBe('entity-2');
  });

  it('keeps a current target that the override names, even with a nearer one the override names', () => {
    const current = candidate('entity-1', 160, 'warrior', true);
    const nearer = candidate('entity-2', 4, 'warrior', true);

    expect(choose([current, nearer], 'entity-1')).toBe('entity-1');
  });

  it('re-acquires by priority once its target leaves range or dies (it is no candidate)', () => {
    const left = [candidate('entity-2', 90, 'heavy-mob'), candidate('entity-3', 1)];

    expect(choose(left, 'entity-1')).toBe('entity-2');
  });

  it('breaks a tie of distance by the lower id, whatever the candidates order', () => {
    const tied = [candidate('entity-9', 25), candidate('entity-10', 25)];

    expect(choose(tied)).toBe('entity-10');
    expect(choose([...tied].reverse())).toBe('entity-10');
  });

  it('follows the priority list it is given, and takes nothing an entry does not name', () => {
    const candidates = [candidate('entity-1', 4), candidate('entity-2', 90, 'heavy-mob')];

    expect(
      chooseTurretTarget({
        currentId: null,
        candidates,
        overrides: [],
        priority: ['nearest-enemy', 'heavy-unit'],
        heavyKinds: HEAVY,
      }),
    ).toBe('entity-1');
    expect(
      chooseTurretTarget({
        currentId: null,
        candidates: [candidate('entity-1', 4)],
        overrides: [],
        priority: ['heavy-unit'],
        heavyKinds: HEAVY,
      }),
    ).toBeNull();
    expect(
      chooseTurretTarget({
        currentId: 'entity-1',
        candidates,
        overrides: ['heavy-unit'],
        priority: ['nearest-enemy'],
        heavyKinds: HEAVY,
      }),
    ).toBe('entity-2');
  });
});
