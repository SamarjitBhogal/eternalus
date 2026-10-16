import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { BLIND } from '../content/status-effects/blind';
import { ENRAGED } from '../content/status-effects/enraged';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { StatusModifierStep } from './StatusModifierStep';

const CONFIG = createDefaultGameConfig();
/** Enraged and blind as shipped, plus a stand-in `sundered` (+20% damage taken). */
const LOADED = loadStatusEffects(CONFIG.tickRate, 2, [
  ENRAGED,
  BLIND,
  {
    ...BLIND,
    id: 'sundered',
    flags: [],
    modifiers: [{ stat: 'damageTaken', op: 'mul', value: 1.2 }],
  },
]);

/** An attacker (light) and a target (dark). */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const spawn = (team: 'light' | 'dark'): Entity => {
    const entity = factory.create('light-mob', 'training-dummy', {
      position: { x: 0, y: 0 },
      team,
    });
    state.entities.add(entity);
    return entity;
  };
  const attacker = spawn('light');
  const target = spawn('dark');
  const give = (entity: Entity, statusId: string) => {
    entity.getComponent(StatusEffects).apply(LOADED.get(statusId), null, 0);
  };
  const adjust = (attackerId: string | null, kind: 'weapon' | 'ability' = 'weapon') =>
    new StatusModifierStep().adjust(
      { targetId: target.id, amount: 100, source: { attackerId, kind, definitionId: 'x' } },
      state,
    );
  return { attacker, target, give, adjust };
};

describe('StatusModifierStep', () => {
  it('passes a hit unchanged when nobody has a status', () => {
    const { attacker, adjust } = setUp();

    expect(adjust(attacker.id)).toBe(100);
  });

  it("multiplies the attacker's damageDealt by the target's damageTaken", () => {
    const { attacker, target, give, adjust } = setUp();
    give(attacker, 'enraged');
    give(target, 'sundered');

    expect(adjust(attacker.id)).toBeCloseTo(100 * 1.15 * 1.2);
  });

  it('applies damageTaken to environment damage, which has no attacker', () => {
    const { target, give, adjust } = setUp();
    give(target, 'sundered');

    expect(adjust(null)).toBeCloseTo(120);
  });

  it('does not turn a blinded hit into a miss: CombatSystem resolves misses', () => {
    const { attacker, give, adjust } = setUp();
    give(attacker, 'blind');

    expect(adjust(attacker.id)).toBe(100);
    expect(adjust(attacker.id, 'ability')).toBe(100);
  });
});
