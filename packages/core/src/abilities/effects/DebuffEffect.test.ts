import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../../components/StatusEffects';
import { STATUS_EFFECTS } from '../../content/status-effects/statusEffectCatalogue';
import type { GameEventMap } from '../../state/GameEvents.types';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { DebuffEffect } from './DebuffEffect';

const AREA = { kind: 'circle', radius: 3 } as const;

const setUp = () => {
  const { state, factory, caster } = casterState();
  const at = (x: number, team: 'light' | 'dark') => {
    const dummy = factory.create('light-mob', 'training-dummy', { position: { x, y: 0 }, team });
    state.entities.add(dummy);
    return dummy;
  };
  const applied: GameEventMap['status-applied'][] = [];
  state.events.on('status-applied', (payload) => applied.push(payload));
  const expiryOf = (entity: ReturnType<typeof at>, statusId: string) =>
    entity.getComponent(StatusEffects).active.find(({ definition }) => definition.id === statusId)
      ?.expiresTick;
  return { state, caster, at, applied, expiryOf };
};

describe('DebuffEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new DebuffEffect(STATUS_EFFECTS).kind).toBe('debuff');
  });

  it('applies its status to every enemy in its shape, credited to the caster', () => {
    const { state, caster, at, applied } = setUp();
    const enemy = at(2, 'dark');
    at(-2, 'light');
    at(8, 'dark');

    castSteps(state, caster.id, [{ kind: 'debuff', statusId: 'concussion', shape: AREA }]);

    expect(applied).toEqual([{ entityId: enemy.id, statusId: 'concussion', sourceId: caster.id }]);
  });

  it('lasts the step’s own duration when it has one, the status’s otherwise', () => {
    const { state, caster, at, expiryOf } = setUp();
    const enemy = at(2, 'dark');

    castSteps(state, caster.id, [
      { kind: 'debuff', statusId: 'stun', durationTicks: 15, shape: AREA },
      { kind: 'debuff', statusId: 'concussion', shape: AREA },
    ]);

    expect(expiryOf(enemy, 'stun')).toBe(state.tick + 15);
    expect(expiryOf(enemy, 'concussion')).toBe(state.tick + 90);
  });

  it('checks its own fields: a known status, a duration override of at least one tick', () => {
    const debuff = new DebuffEffect(STATUS_EFFECTS);
    const stun = { kind: 'debuff', statusId: 'stun', shape: AREA } as const;

    expect(debuff.validate(stun)).toEqual([]);
    expect(debuff.validate({ ...stun, durationTicks: 15 })).toEqual([]);
    expect(debuff.validate({ ...stun, statusId: 'frozen', durationTicks: 0 })).toEqual([
      'debuff status "frozen" is unknown',
      'debuff duration must be positive',
    ]);
  });

  it('shows its area on the aim overlay', () => {
    const stun = { kind: 'debuff', statusId: 'stun', shape: AREA } as const;

    expect(new DebuffEffect(STATUS_EFFECTS).describe(stun)).toEqual([
      { kind: 'debuff', shape: AREA },
    ]);
  });
});
