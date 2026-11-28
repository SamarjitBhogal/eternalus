import { describe, expect, it } from 'vitest';

import { Footprint } from '../components/Footprint';
import { StatusEffects } from '../components/StatusEffects';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { StatusModifierStep } from '../combat/StatusModifierStep';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { RALLIED } from '../content/status-effects/rallied';
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
import { SpaceSystem } from './SpaceSystem';
import { StructureAuraSystem } from './StructureAuraSystem';

const RADIUS = STRUCTURE_DEFINITIONS.get('buff-tower').aura?.radius ?? 0;

/**
 * A light buff tower at (50, 20) in a match whose clock is stepped by hand. Each step refills the
 * neighbour index with the match's own `SpaceSystem` (units only), then runs the aura.
 */
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
  const unit = (team: 'light' | 'dark' | 'neutral', x: number, y = 20): Entity => {
    const entity = factory.create('light-mob', 'light-minion', { team, position: { x, y } });
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
    new SpaceSystem(space).update({ state, logger: new NullLogger() });
    system.update({ state, logger: new NullLogger() });
  };
  return {
    state,
    system,
    statuses,
    unit,
    tower,
    step,
    buff: tower('buff-tower', 'light', 50),
  };
};

/**
 * A 40 by 32 m fort round the tower at (50, 20): its keep (46..54, 16..24) and its west and east
 * walls (30..32 and 68..70, from y 4 to 36), so its box is x 30..70, y 4..36 and the court between
 * the keep and the walls is in no polygon.
 */
const FORT = [
  [
    { x: 46, y: 16 },
    { x: 54, y: 16 },
    { x: 54, y: 24 },
    { x: 46, y: 24 },
  ],
  [
    { x: 30, y: 4 },
    { x: 32, y: 4 },
    { x: 32, y: 36 },
    { x: 30, y: 36 },
  ],
  [
    { x: 68, y: 4 },
    { x: 70, y: 4 },
    { x: 70, y: 36 },
    { x: 68, y: 36 },
  ],
];

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

  it('finds the tower by its Transform, as the neighbour index of a match holds only units', () => {
    const { state, buff, unit, step } = setUp();
    const ally = unit('light', 52);

    step();

    expect(state.space?.indexOf(buff.id)).toBeUndefined();
    expect(idsOf(ally)).toEqual(['tower-aura-buff']);
  });

  it('measures from the centre of a source without a Footprint: exactly the content radius, and not beyond', () => {
    const { unit, step } = setUp();
    const inside = unit('dark', 50 + RADIUS - 0.5);
    const outside = unit('dark', 50 + RADIUS + 0.5);

    step();

    expect(RADIUS).toBe(12);
    expect(idsOf(inside)).toEqual(['tower-aura-debuff']);
    expect(idsOf(outside)).toEqual([]);
  });

  it('measures the radius beyond the fort box: beside a wall, more than the radius from the tower (DEC-323 (3))', () => {
    const { buff, unit, step } = setUp();
    buff.addComponent(new Footprint(FORT));
    const ally = unit('light', 70 + 10);
    const enemy = unit('dark', 70 + RADIUS - 0.5);
    const beyond = unit('light', 70 + RADIUS + 0.5);

    step();

    expect(80 - 50).toBeGreaterThan(RADIUS);
    expect(idsOf(ally)).toEqual(['tower-aura-buff']);
    expect(idsOf(enemy)).toEqual(['tower-aura-debuff']);
    expect(idsOf(beyond)).toEqual([]);
  });

  it('covers the whole court inside the fort box, at no distance (DEC-323 (3))', () => {
    const { buff, unit, step } = setUp();
    buff.addComponent(new Footprint(FORT));
    const court = unit('light', 64, 34);

    step();

    expect(Math.hypot(64 - 50, 34 - 20)).toBeGreaterThan(RADIUS);
    expect(idsOf(court)).toEqual(['tower-aura-buff']);
  });

  it('rounds the corners of the fort box: the radius counts along the diagonal (DEC-323 (3))', () => {
    const { buff, unit, step } = setUp();
    buff.addComponent(new Footprint(FORT));
    const near = unit('dark', 70 + 8, 36 + 8);
    const far = unit('dark', 70 + 9, 36 + 9);

    step();

    expect(Math.hypot(8, 8)).toBeLessThan(RADIUS);
    expect(Math.hypot(9, 9)).toBeGreaterThan(RADIUS);
    expect(idsOf(near)).toEqual(['tower-aura-debuff']);
    expect(idsOf(far)).toEqual([]);
  });

  it('takes the status away from a unit that left, on the next pass, and keeps its other statuses', () => {
    const { state, statuses, unit, step } = setUp();
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);
    step();
    statuses.apply(state, ally.id, RALLIED.id, null);
    state.advanceTick();
    ally.getComponent(Transform).moveTo({ x: 50 + RADIUS + 5, y: 20 });
    enemy.getComponent(Transform).moveTo({ x: 50 + RADIUS + 5, y: 20 });

    step();

    expect(idsOf(ally)).toEqual([RALLIED.id]);
    expect(idsOf(enemy)).toEqual([]);
  });

  it('keeps the status of a unit that left one tower for another of its side, now credited to it', () => {
    const { state, unit, tower, step } = setUp();
    const second = tower('buff-tower', 'light', 50 + 2 * RADIUS);
    const ally = unit('light', 52);
    step();
    state.advanceTick();
    const expired: string[] = [];
    state.events.on('status-expired', ({ statusId }) => expired.push(statusId));
    ally.getComponent(Transform).moveTo({ x: 50 + 2 * RADIUS - 2, y: 20 });

    step();

    expect(idsOf(ally)).toEqual(['tower-aura-buff']);
    expect(ally.getComponent(StatusEffects).active[0]?.sourceId).toBe(second.id);
    expect(expired).toEqual([]);
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

  it('takes the statuses away on the next pass when the tower is gone from the match', () => {
    const { state, unit, buff, step } = setUp();
    const ally = unit('light', 52);
    const enemy = unit('dark', 53);
    step();
    state.advanceTick();
    state.entities.remove(buff.id, 'died');

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

  it('works without a neighbour index', () => {
    const config = createDefaultGameConfig();
    const state = new GameState(config, 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), {
      has: (id) => id === 'light-minion' || STRUCTURE_DEFINITIONS.has(id),
      get: (id) =>
        id === 'light-minion' ? loadDefaultContent(30).get(id) : STRUCTURE_DEFINITIONS.get(id),
    });
    const { kind } = STRUCTURE_DEFINITIONS.get('buff-tower');
    state.entities.add(
      factory.create(kind, 'buff-tower', { team: 'light', position: { x: 0, y: 0 } }),
    );
    const ally = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 2, y: 0 },
    });
    state.entities.add(ally);
    const system = new StructureAuraSystem(
      new StatusEffectApplier(loadStatusEffects(30, 2)),
      STRUCTURE_DEFINITIONS,
      { everyTicks: 1 },
    );

    system.update({ state, logger: new NullLogger() });

    expect(state.space).toBeNull();
    expect(idsOf(ally)).toEqual(['tower-aura-buff']);
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
