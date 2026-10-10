import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import { HealthWithinBoundsInvariant } from './HealthWithinBoundsInvariant';

class Patient extends Entity {
  public readonly kind = 'patient';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Health(100));
  }
}

class Ghost extends Entity {
  public readonly kind = 'ghost';
  public readonly family = 'test';

  protected installComponents(): void {
    // No Health: nothing to check.
  }
}

const stateWith = (...entities: Entity[]): GameState => {
  const state = new GameState(createDefaultGameConfig(), 1);
  for (const entity of entities) {
    entity.spawn({});
    state.entities.add(entity);
  }
  return state;
};

describe('HealthWithinBoundsInvariant', () => {
  it('holds for healthy, damaged and shielded entities and for entities without Health', () => {
    const patient = new Patient('entity-1', 'patient');
    const state = stateWith(patient, new Ghost('entity-2', 'ghost'));
    patient.getComponent(Health).addShield('buff-tower-1', 50);
    patient.getComponent(Health).applyDamage(120);

    expect(new HealthWithinBoundsInvariant().check(state)).toEqual([]);
  });

  it('flags health above max and a shield bar below zero (injected corruption)', () => {
    const patient = new Patient('entity-1', 'patient');
    const state = stateWith(patient);
    const health = patient.getComponent(Health);
    health.addShield('buff-tower-1', 50);
    Reflect.set(health, 'currentValue', 150);
    const bars: unknown = Reflect.get(health, 'shieldBars');
    Reflect.set((bars as object[])[0] ?? {}, 'current', -1);

    const violations = new HealthWithinBoundsInvariant().check(state);

    expect(violations.map((v) => v.message)).toEqual([
      'Entity "entity-1" has health 150 outside 0..100.',
      'Entity "entity-1" has shield buff-tower-1 -1 outside 0..50.',
    ]);
    expect(violations[0]).toMatchObject({
      invariantId: 'health-within-bounds',
      severity: 'error',
      entityId: 'entity-1',
      details: { bar: 'health', current: 150, max: 100 },
    });
  });
});
