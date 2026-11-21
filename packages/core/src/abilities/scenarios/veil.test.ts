import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * Veil (balancing.md:182, DEC-266, DEC-267): for 5 s (150 ticks) the Vanguard is `invisible`:
 * enemies cannot pick it as a target and neither hit nor chase it when it is theirs (they keep it, so
 * they fight on after Veil), an area still hits it, and dealing or taking any damage ends it. The light Vanguard stands at (50, 50) with Veil on key 2;
 * a dark Vanguard stands 1.2 m north, in reach both ways. Every invariant runs each tick and
 * throws.
 */
const SELF = { x: 50, y: 50 };
const SOUTH = { x: 50, y: 30 };

const match = () => {
  const scenario = abilityMatch(
    [
      { kind: 'warrior', team: 'light', at: SELF },
      { kind: 'warrior', team: 'dark', at: { x: 50, y: 51.2 } },
    ],
    { debug: TEST_DEBUG_CONFIG },
  );
  const [vanguard = '', enemy = ''] = scenario.ids;
  /** Queues `actorId`'s attack on `targetId`, applied in the next step. */
  const attack = (actorId: string, targetId: string): void => {
    scenario.sim.enqueueCommand({ type: 'attack-target', actorId, targetId });
  };
  /** Queues Veil, cast in the next step. */
  const veil = (): void => {
    scenario.cast(vanguard, 'ability-2', SELF);
  };
  /** The log lines about the `invisible` status. */
  const veilLog = () => scenario.log.filter((line) => line.includes('invisible'));
  return { ...scenario, vanguard, enemy, attack, veil, veilLog };
};

describe('Veil (scenario)', () => {
  it('veils the Vanguard for 5 s for 40 aether', () => {
    const { vanguard, veil, run, entity, veilLog } = match();
    const before = entity(vanguard)?.aether?.current ?? Number.NaN;

    veil();
    run(160);

    expect(veilLog()).toEqual([`1 invisible on ${vanguard}`, `151 invisible off ${vanguard}`]);
    expect(entity(vanguard)?.aether?.current).toBeLessThan(before);
  });

  it('an enemy stops hitting the Veiled Vanguard, and a new attack on it is refused', () => {
    const { vanguard, enemy, attack, veil, run, lost, log } = match();
    attack(enemy, vanguard);
    run(30);
    const hurt = lost(vanguard);
    expect(hurt).toBeGreaterThan(0);

    veil();
    run(1);
    attack(enemy, vanguard);
    run(60);

    expect(lost(vanguard)).toBe(hurt);
    expect(log).toContain(`32 rejected ${enemy} invalid-target`);
    expect(log.some((line) => line.includes('invisible off'))).toBe(false);
  });

  it('an enemy that held its attack hits the Vanguard again once the Vanguard’s hit ends Veil', () => {
    const { vanguard, enemy, attack, veil, run, lost } = match();
    attack(enemy, vanguard);
    run(30);

    veil();
    attack(vanguard, enemy);
    run(1);
    const hurt = lost(vanguard);
    let ticks = 0;
    while (lost(enemy) === 0 && ticks < 60) {
      run(1);
      ticks += 1;
    }
    run(60);

    expect(lost(enemy)).toBeGreaterThan(0);
    expect(lost(vanguard)).toBeGreaterThan(hurt);
  });

  it('the Vanguard’s first hit unhides it at once and ends Veil in the next tick', () => {
    const { vanguard, enemy, attack, veil, run, lost, entity, veilLog } = match();
    veil();
    run(1);
    expect(entity(vanguard)?.isHidden).toBe(true);

    attack(vanguard, enemy);
    let ticks = 0;
    while (lost(enemy) === 0 && ticks < 60) {
      run(1);
      ticks += 1;
    }
    const isHiddenAtHit = entity(vanguard)?.isHidden;
    run(1);

    expect(lost(enemy)).toBeGreaterThan(0);
    expect(isHiddenAtHit).toBeUndefined();
    expect(veilLog()).toEqual([
      `1 invisible on ${vanguard}`,
      `${String(ticks + 2)} invisible off ${vanguard}`,
    ]);
  });

  it('an enemy area ability still hits the Veiled Vanguard and ends Veil', () => {
    const { vanguard, enemy, veil, cast, run, lost, veilLog } = match();
    veil();
    run(1);

    cast(enemy, 'ability-1', SOUTH); // Blade Runner through the Vanguard
    run(15);

    expect(lost(vanguard)).toBeGreaterThan(0);
    expect(veilLog()).toHaveLength(2);
    expect(veilLog()[1]).toContain(`invisible off ${vanguard}`);
  });

  it('gives the same hash for the same seed and commands (determinism)', () => {
    const hashOf = (): number => {
      const { vanguard, enemy, attack, veil, run, sim } = match();
      attack(enemy, vanguard);
      run(10);
      veil();
      run(20);
      attack(vanguard, enemy);
      run(60);
      return sim.hash();
    };

    expect(hashOf()).toBe(hashOf());
  });
});
