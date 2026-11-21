import { describe, expect, it } from 'vitest';

import { StatusEffects } from '../components/StatusEffects';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { StatusModifierStep } from '../combat/StatusModifierStep';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { loadStructureAuraCadence } from '../content/structures/loadStructureAuraCadence';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { StructureAuraSystem } from './StructureAuraSystem';

const RADIUS = STRUCTURE_DEFINITIONS.get('buff-tower').aura?.radius ?? 0;

/** A light buff tower at (50, 20) in a match whose clock is stepped by hand. */
const setUp = (everyTicks = 1) => {
  const config = createDefaultGameConfig();
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP), { space });
  const unitDefinitions = loadDefaultContent(30);
  // One factory, so ids do not repeat: units and structures answer from their own catalogue.
  const factory = new EntityFactory(createDefaultEntityRegistry(), {
    has: (id) => unitDefinitions.has(id) || STRUCTURE_DEFINITIONS.has(id),
    get: (id) =>
      unitDefinitions.has(id) ? unitDefinitions.get(id) : STRUCTURE_DEFINITIONS.get(id),
  });
  const statuses = new StatusEffectApplier(loadStatusEffects(30, 2));
  const system = new StructureAuraSystem(statuses, STRUCTURE_DEFINITIONS, { everyTicks });
  const unit = (team: 'light' | 'dark' | 'neutral', x: number): Entity => {
    const entity = factory.create('light-mob', 'light-minion', { team, position: { x, y: 20 } });
    state.entities.add(entity);
    return entity;
  };
  const tower = (definitionId: string, team: 'light' | 'dark', x: number): Entity => {
    const { kind } = STRUCTURE_DEFINITIONS.get(definitionId);
    const entity = factory.create(kind, definitionId, { team, position: { x, y: 20 } });
    state.entities.add(entity);
    return entity;
  };
  const step = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    system.update({ state, logger: new NullLogger() });
  };
  return {
    state,
    space,
    system,
    statuses,
    unit,
    tower,
    step,
    buff: tower('buff-tower', 'light', 50),
  };
};

const idsOf = (entity: Entity) =>
  entity.getComponent(StatusEffects).active.map(({ definition }) => definition.id);

describe('StructureAuraSystem', () => {
  it('gives allies the buff and enemies the debuff, and neutral units nothing (DEC-315 (4))', () => {
    const { unit, step } = setUp();
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);
    const neutral = unit('neutral', 54);

    step();

    expect(idsOf(ally)).toEqual(['tower-aura-buff']);
    expect(idsOf(enemy)).toEqual(['tower-aura-debuff']);
    expect(idsOf(neutral)).toEqual([]);
  });

  it('reaches exactly the content radius, and not beyond', () => {
    const { unit, step } = setUp();
    const inside = unit('dark', 50 + RADIUS - 0.5);
    const outside = unit('dark', 50 + RADIUS + 0.5);

    step();

    expect(RADIUS).toBe(12);
    expect(idsOf(inside)).toEqual(['tower-aura-debuff']);
    expect(idsOf(outside)).toEqual([]);
  });

  it('takes the status away from a unit that left, on the next pass', () => {
    const { state, unit, step } = setUp();
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);
    step();
    state.advanceTick();
    ally.getComponent(Transform).moveTo({ x: 50 + RADIUS + 5, y: 20 });
    enemy.getComponent(Transform).moveTo({ x: 50 + RADIUS + 5, y: 20 });

    step();

    expect(idsOf(ally)).toEqual([]);
    expect(idsOf(enemy)).toEqual([]);
  });

  it('takes the statuses away from everyone when the tower is dead, and does not give them again', () => {
    const { state, unit, buff, step } = setUp();
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);
    step();
    state.advanceTick();
    buff.getComponent(Health).applyDamage(1_000_000);

    step();

    expect(idsOf(ally)).toEqual([]);
    expect(idsOf(enemy)).toEqual([]);
  });

  it('gives nothing for a structure without an aura', () => {
    const { state, unit, buff, tower, step } = setUp();
    state.entities.remove(buff.id, 'died');
    tower('spawner-tower', 'light', 50);
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);

    step();

    expect(idsOf(ally)).toEqual([]);
    expect(idsOf(enemy)).toEqual([]);
  });

  it('refreshes only on its cadence', () => {
    const { state, unit, step } = setUp(loadStructureAuraCadence(30).everyTicks);
    const ally = unit('light', 52);
    step();
    expect(idsOf(ally)).toEqual(['tower-aura-buff']);

    state.advanceTick();
    ally.getComponent(Transform).moveTo({ x: 50 + RADIUS + 5, y: 20 });
    step();
    expect(idsOf(ally)).toEqual(['tower-aura-buff']);

    for (let tick = 1; tick < 15; tick += 1) {
      state.advanceTick();
    }
    step();
    expect(idsOf(ally)).toEqual([]);
  });

  it('does nothing without a neighbour index', () => {
    const config = createDefaultGameConfig();
    const state = new GameState(config, 1);
    const { kind } = STRUCTURE_DEFINITIONS.get('buff-tower');
    const tower = new EntityFactory(createDefaultEntityRegistry(), STRUCTURE_DEFINITIONS).create(
      kind,
      'buff-tower',
      { team: 'light', position: { x: 0, y: 0 } },
    );
    state.entities.add(tower);
    const system = new StructureAuraSystem(
      new StatusEffectApplier(loadStatusEffects(30, 2)),
      STRUCTURE_DEFINITIONS,
      { everyTicks: 1 },
    );

    expect(() => {
      system.update({ state, logger: new NullLogger() });
    }).not.toThrow();
  });

  it('scales damage: an ally hits x1.1, an enemy hits x0.9 and takes x1.1 (DEC-315 (4))', () => {
    const { state, unit, step } = setUp();
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);
    step();
    const hit = (attacker: Entity, target: Entity) =>
      new StatusModifierStep().adjust(
        {
          targetId: target.id,
          amount: 100,
          source: { attackerId: attacker.id, kind: 'weapon', definitionId: 'x' },
        },
        state,
      );
    const bystander = (team: 'light' | 'dark') => {
      const entity = unit(team, 150);
      return entity;
    };

    expect(hit(ally, bystander('dark'))).toBeCloseTo(110);
    expect(hit(bystander('dark'), bystander('light'))).toBeCloseTo(100);
    expect(hit(enemy, bystander('light'))).toBeCloseTo(90);
    expect(hit(bystander('light'), enemy)).toBeCloseTo(110);
  });

  it('gives the same hash for the same match with the aura active (determinism)', () => {
    const run = () => {
      const match = setUp();
      match.unit('light', 52);
      match.unit('dark', 53);
      for (let tick = 0; tick < 5; tick += 1) {
        match.step();
        match.state.advanceTick();
      }
      return new StateHasher().hash(match.state);
    };

    expect(run()).toBe(run());
  });
});
