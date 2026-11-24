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
/** A damage step that blocks every hit: an execute runs none. */
const BLOCK_ALL: DamageStep = { name: 'block-all', adjust: () => 0 };

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
  return { state, caster, dummyAt, hits, deaths };
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

  it('is reduced by nothing: no damage step runs, and a shield goes with the health', () => {
    const { state, caster, dummyAt, hits } = setUp();
    const shielded = dummyAt(2, 'dark', 10);
    shielded.getComponent(Health).addShield('ward', 50);

    castSteps(state, caster.id, [EXECUTE], { damage: new DamagePipeline([BLOCK_ALL]) });

    expect(shielded.getComponent(Health).isDead).toBe(true);
    expect(hits.map(({ amount, absorbed }) => [amount, absorbed])).toEqual([[10, 50]]);
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
