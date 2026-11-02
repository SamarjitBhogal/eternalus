import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../../components/StatusEffects';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadStatusEffects } from '../../content/status-effects/loadStatusEffects';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import { StatusStacksWithinMaxInvariant } from './StatusStacksWithinMaxInvariant';

class Patient extends Entity {
  public readonly kind = 'patient';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new StatusEffects());
  }
}

const BLEED = loadStatusEffects(30, 2).get('bleed');

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const patient = new Patient('entity-1', 'patient');
  patient.spawn({});
  state.entities.add(patient);
  return { state, statuses: patient.getComponent(StatusEffects) };
};

describe('StatusStacksWithinMaxInvariant', () => {
  it('holds at the cap', () => {
    const { state, statuses } = setUp();
    for (let tick = 0; tick < 5; tick += 1) {
      statuses.apply(BLEED, null, tick);
    }

    expect(new StatusStacksWithinMaxInvariant().check(state)).toEqual([]);
  });

  it('flags a status pushed past its cap', () => {
    const { state, statuses } = setUp();
    statuses.apply(BLEED, null, 0);
    const [bleed] = statuses.active;
    if (bleed !== undefined) {
      bleed.stacks = 4; // a stacking bug
    }

    expect(new StatusStacksWithinMaxInvariant().check(state)).toEqual([
      expect.objectContaining({
        invariantId: 'status-stacks-within-max',
        entityId: 'entity-1',
        details: { statusId: 'bleed', stacks: 4, maxStacks: 3 },
      }),
    ]);
  });
});
