import { describe, expect, it } from 'vitest';

import type { TurretTargetPriority } from '../content/ai/turret.types';
import { rankTurretTargets } from './turretTarget';
import type { TurretCandidate, TurretTargetInput } from './turretTarget.types';

const OVERRIDES: readonly TurretTargetPriority[] = ['legend-hurting-ally-legend'];
const PRIORITY: readonly TurretTargetPriority[] = ['heavy-unit', 'nearest-enemy'];
const HEAVY = ['sentinel', 'heavy-mob'];

const candidate = (
  id: string,
  distanceSquared: number,
  kind = 'light-mob',
  hasHurtAllyLegend = false,
): TurretCandidate => ({ id, kind, position: { x: 0, y: 0 }, distanceSquared, hasHurtAllyLegend });

/** The id of the target ranked first, or `null`: the one a turret with every line clear takes. */
const firstOf = (input: TurretTargetInput): string | null =>
  rankTurretTargets(input)[0]?.id ?? null;

const choose = (candidates: readonly TurretCandidate[], currentId: string | null = null) =>
  firstOf({
    currentId,
    candidates,
    overrides: OVERRIDES,
    priority: PRIORITY,
    heavyKinds: HEAVY,
  });

describe('rankTurretTargets', () => {
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
      firstOf({
        currentId: null,
        candidates,
        overrides: [],
        priority: ['nearest-enemy', 'heavy-unit'],
        heavyKinds: HEAVY,
      }),
    ).toBe('entity-1');
    expect(
      firstOf({
        currentId: null,
        candidates: [candidate('entity-1', 4)],
        overrides: [],
        priority: ['heavy-unit'],
        heavyKinds: HEAVY,
      }),
    ).toBeNull();
    expect(
      firstOf({
        currentId: 'entity-1',
        candidates,
        overrides: ['heavy-unit'],
        priority: ['nearest-enemy'],
        heavyKinds: HEAVY,
      }),
    ).toBe('entity-2');
  });

  it('ranks the override entries, then the current target, then each priority entry nearest first, each candidate once', () => {
    const ranked = rankTurretTargets({
      currentId: 'entity-4',
      candidates: [
        candidate('entity-1', 40),
        candidate('entity-2', 30, 'sentinel'),
        candidate('entity-3', 20, 'light-mob', true),
        candidate('entity-4', 90),
        candidate('entity-5', 10, 'heavy-mob'),
      ],
      overrides: OVERRIDES,
      priority: ['heavy-unit'],
      heavyKinds: HEAVY,
    });

    expect(ranked.map(({ id }) => id)).toEqual(['entity-3', 'entity-4', 'entity-5', 'entity-2']);
  });
});
