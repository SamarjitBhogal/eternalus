import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { Team } from '../teams/teams.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { CombatSystem } from './CombatSystem';
import type { SystemContext } from './System.types';

const CONFIG = createDefaultGameConfig();

/** A Warrior (light) at the origin; `spawn` adds more units to the same world. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, x: number, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const warrior = spawn('warrior', 'warrior', 0, 'light');
  const context: SystemContext = { state, logger: new NullLogger() };
  const attack = (target: Entity) => state.entities.setAttackTarget(warrior.id, target.id);
  return { state, warrior, spawn, context, attack };
};

describe('CombatSystem', () => {
  it('hits a target in reach once per attack interval', () => {
    const { state, warrior, spawn, context, attack } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 1, 'dark');
    const { damage, interval } = warrior.getComponent(Combat).attack;
    const system = new CombatSystem();

    expect(attack(dummy)).toBe(true);
    for (let tick = 0; tick <= interval; tick += 1) {
      system.update(context);
      state.advanceTick();
    }

    // Ticks 0 and `interval`: two hits.
    expect(dummy.getComponent(Health).current).toBe(dummy.getComponent(Health).max - 2 * damage);
  });

  it('does not hit a target out of reach', () => {
    const { spawn, context, attack } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 50, 'dark');

    attack(dummy);
    new CombatSystem().update(context);

    expect(dummy.getComponent(Health).current).toBe(dummy.getComponent(Health).max);
  });

  it('drops a target once it is dead', () => {
    const { warrior, spawn, context, attack } = setUp();
    const dummy = spawn('light-mob', 'training-dummy', 1, 'dark');

    attack(dummy);
    dummy.getComponent(Health).applyDamage(1_000_000);
    new CombatSystem().update(context);

    expect(warrior.getComponent(Combat).targetId).toBeNull();
  });

  it('gives the same hash for the same seed and attacks (determinism)', () => {
    const run = (): number => {
      const { state, spawn, context, attack } = setUp();
      attack(spawn('light-mob', 'training-dummy', 1, 'dark'));
      const system = new CombatSystem();
      for (let tick = 0; tick < 60; tick += 1) {
        system.update(context);
        state.advanceTick();
      }
      return new StateHasher().hash(state);
    };

    expect(run()).toBe(run());
  });
});
