import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { Transform } from '../../components/Transform';
import { Entity } from '../../entities/Entity';
import type { GameEventMap } from '../../state/GameEvents.types';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { DamageEffect } from './DamageEffect';

const AREA = { kind: 'circle', radius: 4 } as const;
const HIT = { kind: 'damage', amount: 100, damageType: 'physical', shape: AREA } as const;

/** A breakable obstacle: health and a body, no team (a map object). */
class Crate extends Entity {
  public readonly kind = 'crate';
  public readonly family = 'obstacle';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 0, y: 3 }, 0.5));
    this.addComponent(new Health(1000));
  }
}

const setUp = () => {
  const { state, factory, caster } = casterState();
  const at = (x: number, team: 'light' | 'dark') => {
    const dummy = factory.create('light-mob', 'training-dummy', { position: { x, y: 0 }, team });
    state.entities.add(dummy);
    return dummy;
  };
  const hits: GameEventMap['damage-applied'][] = [];
  state.events.on('damage-applied', (hit) => hits.push(hit));
  return { state, factory, caster, at, hits };
};

describe('DamageEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new DamageEffect().kind).toBe('damage');
  });

  it('damages every enemy in its shape through the pipeline, never allies or the caster', () => {
    const { state, caster, at, hits } = setUp();
    const enemy = at(2, 'dark');
    const ally = at(-2, 'light');
    const far = at(9, 'dark');

    castSteps(state, caster.id, [HIT]);

    expect(hits).toEqual([
      {
        targetId: enemy.id,
        amount: 100,
        absorbed: 0,
        source: { attackerId: caster.id, kind: 'ability', definitionId: 'test-cast' },
      },
    ]);
    expect([ally, far, caster].map((e) => e.getComponent(Health).current)).toEqual(
      [ally, far, caster].map((e) => e.getComponent(Health).max),
    );
  });

  it('grows the amount by the ability’s per-level scaling: +4% per level above 1', () => {
    const { state, caster, at, hits } = setUp();
    at(2, 'dark');

    castSteps(state, caster.id, [{ ...HIT, amount: 50 }], {
      level: 6,
      scaling: { amount: { perLevel: 0.04 } },
    });

    expect(hits[0]?.amount).toBeCloseTo(60);
  });

  it('multiplies the hit by structureMultiplier against structures and obstacles, not units', () => {
    const { state, factory, caster, at, hits } = setUp();
    const unit = at(2, 'dark');
    const tower = factory.create('spawner-tower', 'spawner-tower', {
      position: { x: -3, y: 0 },
      team: 'dark',
    });
    state.entities.add(tower);
    const crate = new Crate('crate-1', 'crate');
    crate.spawn({});
    state.entities.add(crate);

    castSteps(state, caster.id, [{ ...HIT, amount: 40, structureMultiplier: 2 }]);

    const amountOn = (id: string) => hits.find((hit) => hit.targetId === id)?.amount;
    expect([unit.id, tower.id, crate.id].map(amountOn)).toEqual([40, 80, 80]);
  });

  it('hits a structure for the plain amount when the step has no structureMultiplier', () => {
    const { state, factory, caster, hits } = setUp();
    const tower = factory.create('spawner-tower', 'spawner-tower', {
      position: { x: -3, y: 0 },
      team: 'dark',
    });
    state.entities.add(tower);

    castSteps(state, caster.id, [{ ...HIT, amount: 40 }]);

    expect(hits.map(({ targetId, amount }) => [targetId, amount])).toEqual([[tower.id, 40]]);
  });
});
