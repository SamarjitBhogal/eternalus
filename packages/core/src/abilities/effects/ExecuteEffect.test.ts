import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import type { DamageStep } from '../../combat/DamageStep.types';
import { Health } from '../../components/Health';
import type { GameEventMap } from '../../state/GameEvents.types';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { ExecuteEffect } from './ExecuteEffect';

const AREA = { kind: 'circle', radius: 4 } as const;
const EXECUTE = { kind: 'execute', atOrBelow: 0.1, shape: AREA } as const;
/** A damage step that blocks every hit (an unbreakable target, a body that takes no damage). */
const BLOCK_ALL: DamageStep = { name: 'block-all', adjust: () => 0 };
/** A damage step that only lowers every hit, as `damageTaken` × 0.1 does. */
const REDUCE: DamageStep = { name: 'reduce', adjust: ({ amount }) => amount * 0.1 };

/** The Warrior at the origin and a training dummy (100 health) of `team` at (`x`, 0), left with `left` health. */
const setUp = () => {
  const { state, factory, caster } = casterState();
  const dummyAt = (x: number, team: 'light' | 'dark', left: number) => {
    const dummy = factory.create('light-mob', 'training-dummy', { position: { x, y: 0 }, team });
    state.entities.add(dummy);
    const health = dummy.getComponent(Health);
    health.applyDamage(health.max - left);
    return dummy;
  };
  const hits: GameEventMap['damage-applied'][] = [];
  const deaths: GameEventMap['entity-died'][] = [];
  state.events.on('damage-applied', (hit) => hits.push(hit));
  state.events.on('entity-died', (death) => deaths.push(death));
  return { state, factory, caster, dummyAt, hits, deaths };
};

/** The set-up with an enemy tower at (2, 0), left with 5% of its health. */
const withTower = () => {
  const scene = setUp();
  const tower = scene.factory.create('buff-tower', 'buff-tower', {
    position: { x: 2, y: 0 },
    team: 'dark',
  });
  scene.state.entities.add(tower);
  const towerHealth = tower.getComponent(Health);
  towerHealth.applyDamage(towerHealth.max * 0.95);
  return { ...scene, towerHealth };
};

describe('ExecuteEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new ExecuteEffect().kind).toBe('execute');
  });

  it('kills an enemy at or below the threshold as a killing hit of the caster, and spares the rest', () => {
    const { state, caster, dummyAt, hits, deaths } = setUp();
    const low = dummyAt(2, 'dark', 10);
    const above = dummyAt(-2, 'dark', 11);
    const ally = dummyAt(0, 'light', 5);
    const source = { attackerId: caster.id, kind: 'ability', definitionId: 'test-cast' };

    castSteps(state, caster.id, [EXECUTE]);

    expect(hits).toEqual([{ targetId: low.id, amount: 10, absorbed: 0, source }]);
    expect(deaths).toEqual([{ entityId: low.id, killer: source }]);
    expect([above, ally].map((dummy) => dummy.getComponent(Health).current)).toEqual([11, 5]);
  });

  it('is reduced by nothing: a step that only lowers a hit does not count, and a shield goes with the health', () => {
    const { state, caster, dummyAt, hits } = setUp();
    const shielded = dummyAt(2, 'dark', 10);
    shielded.getComponent(Health).addShield('ward', 50);

    castSteps(state, caster.id, [EXECUTE], { damage: new DamagePipeline([REDUCE]) });

    expect(shielded.getComponent(Health).isDead).toBe(true);
    expect(hits.map(({ amount, absorbed }) => [amount, absorbed])).toEqual([[10, 50]]);
  });

  it('spares an enemy that a damage step blocks fully, even at or below the threshold', () => {
    const { state, caster, dummyAt, hits, deaths } = setUp();
    const blocked = dummyAt(2, 'dark', 5);

    castSteps(state, caster.id, [EXECUTE], { damage: new DamagePipeline([BLOCK_ALL]) });

    expect(blocked.getComponent(Health).current).toBe(5);
    expect([hits, deaths]).toEqual([[], []]);
  });

  it('kills only units when its spec says so: an enemy tower at or below the threshold is spared (reading, owner card PR6 R6)', () => {
    const { state, caster, towerHealth, hits } = withTower();

    castSteps(state, caster.id, [{ ...EXECUTE, families: 'units' }]);

    expect(towerHealth.isDead).toBe(false);
    expect(hits).toEqual([]);
  });

  it('kills an enemy of any family with no family in its spec: a tower at or below the threshold dies', () => {
    const { state, caster, towerHealth } = withTower();

    castSteps(state, caster.id, [EXECUTE]);

    expect(towerHealth.isDead).toBe(true);
  });

  it('needs a threshold above 0 and at most 1', () => {
    const execute = new ExecuteEffect();

    expect(execute.validate(EXECUTE)).toEqual([]);
    expect(execute.validate({ ...EXECUTE, atOrBelow: 1 })).toEqual([]);
    expect(execute.validate({ ...EXECUTE, atOrBelow: 0 })).toEqual([
      'execute atOrBelow must be above 0',
    ]);
    expect(execute.validate({ ...EXECUTE, atOrBelow: 1.5 })).toEqual([
      'execute atOrBelow must be a fraction from 0 to 1',
    ]);
  });

  it('describes its area for the overlay', () => {
    expect(new ExecuteEffect().describe(EXECUTE)).toEqual([{ kind: 'execute', shape: AREA }]);
  });
});
