import { describe, expect, it } from 'vitest';

import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { WARRIOR } from '../content/legends/warrior';
import { loadDefaultContent } from '../content/loadDefaultContent';
import {
  MAP_OBJECT_DEFINITIONS,
  STRUCTURE_MAP_OBJECT_KINDS,
} from '../content/maps/mapObjectDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { LEGEND_LEVEL_CURVE } from '../content/progression/levelCurves';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { DamageSource } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { WorldObjectStore } from '../state/WorldObjectStore';
import type { PlayableTeam, Team } from '../teams/teams.types';
import { IdGenerator } from '../utils/IdGenerator';
import { BasicAttackLevelStep } from './BasicAttackLevelStep';
import { DamagePipeline } from './DamagePipeline';

const CONFIG = createDefaultGameConfig();

const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const warrior = spawn('warrior', 'warrior', 'light');
  const dummy = spawn('light-mob', 'training-dummy', 'dark');
  const tower = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
  ).create('spawner-tower', 'spawner-tower', { position: { x: 0, y: 0 }, team: 'dark' });
  state.entities.add(tower);
  // Walls, turrets and gates are map objects, not structure entities (07 §13), spawned as a
  // match spawns them.
  const object = (id: string, kind: MapObject['kind'], team?: PlayableTeam): MapObject => ({
    id,
    kind,
    footprints: [[{ x: 0, y: 0 }]],
    isBlocking: true,
    ...(team === undefined ? {} : { team }),
  });
  const world = new WorldObjectStore({
    objects: [
      object('wall', 'wall', 'dark'),
      object('cathedral-wall', 'wall'),
      object('turret', 'turret', 'dark'),
      object('tree', 'tree'),
    ],
    factory: new EntityFactory(
      createDefaultEntityRegistry(),
      new ContentCatalogue(Object.values(MAP_OBJECT_DEFINITIONS)),
      new IdGenerator(2000),
    ),
    entities: state.entities,
    definitions: MAP_OBJECT_DEFINITIONS,
  });
  const entityOf = (objectId: string): string => {
    const entityId = world.snapshot().find(({ id }) => id === objectId)?.entityId;
    if (entityId === undefined || entityId === null) throw new Error(`No entity: ${objectId}`);
    return entityId;
  };
  const raiseTo = (level: number) => {
    const progression = warrior.getComponent(Progression);
    progression.addXp(progression.xpToReach(level, LEGEND_LEVEL_CURVE), LEGEND_LEVEL_CURVE);
  };
  const from = (attacker: Entity | null, kind: DamageSource['kind'] = 'weapon'): DamageSource => ({
    attackerId: attacker?.id ?? null,
    kind,
    definitionId: 'raptor-talons',
  });
  return { state, warrior, dummy, tower, entityOf, spawn, raiseTo, from };
};

const step = new BasicAttackLevelStep(
  new ContentCatalogue([
    {
      ...WARRIOR,
      levelScaling: {
        ...WARRIOR.levelScaling,
        basicAttackPerLevel: 0.5,
        basicAttackPerLevelOnStructures: 0.25,
      },
    },
  ]),
  STRUCTURE_MAP_OBJECT_KINDS,
);

describe('BasicAttackLevelStep', () => {
  it("multiplies a Legend's weapon hit by 1 + basicAttackPerLevel × (level − 1)", () => {
    const { state, warrior, dummy, raiseTo, from } = setUp();
    const hit = { targetId: dummy.id, amount: 10, source: from(warrior) };

    expect(step.adjust(hit, state)).toBe(10);
    raiseTo(3);
    expect(step.adjust(hit, state)).toBe(20); // 10 × (1 + 0.5 × 2)
  });

  it('scales a weapon hit on a structure at the structure rate (DEC-405)', () => {
    const { state, warrior, tower, entityOf, raiseTo, from } = setUp();
    const structures = [tower.id, ...['wall', 'cathedral-wall', 'turret'].map(entityOf)];
    const at = (targetId: string) =>
      step.adjust({ targetId, amount: 10, source: from(warrior) }, state);

    expect(structures.map(at)).toEqual([10, 10, 10, 10]);
    raiseTo(3);
    expect(structures.map(at)).toEqual([15, 15, 15, 15]); // 10 × (1 + 0.25 × 2)
  });

  it('keeps the full rate on mobs, bosses, Legends and scenery', () => {
    const { state, warrior, dummy, entityOf, spawn, raiseTo, from } = setUp();
    const targets = [
      dummy.id,
      spawn('heavy-mob', 'capture-point-boss', 'neutral').id,
      spawn('magus', 'magus', 'dark').id,
      entityOf('tree'),
    ];
    raiseTo(3);

    expect(
      targets.map((targetId) =>
        step.adjust({ targetId, amount: 10, source: from(warrior) }, state),
      ),
    ).toEqual([20, 20, 20, 20]); // 10 × (1 + 0.5 × 2)
  });

  it('leaves ability, status and attacker-less hits, mobs and departed attackers unchanged', () => {
    const { state, warrior, dummy, raiseTo, from } = setUp();
    raiseTo(3);
    const at = (source: DamageSource) =>
      step.adjust({ targetId: dummy.id, amount: 10, source }, state);

    expect(at(from(warrior, 'ability'))).toBe(10);
    expect(at(from(warrior, 'status'))).toBe(10);
    expect(at(from(null))).toBe(10);
    expect(at(from(dummy))).toBe(10);
    state.entities.remove(warrior.id, 'died');
    expect(at(from(warrior))).toBe(10);
  });

  it('runs in the default damage steps: a max-level Legend hits harder than a level-1 one', () => {
    const { state, warrior, dummy, raiseTo, from } = setUp();
    const potency = 1 + WARRIOR.levelScaling.basicAttackPerLevel * (LEGEND_LEVEL_CURVE.cap - 1);
    const damage = new DamagePipeline();

    expect(damage.apply(state, dummy.id, 10, from(warrior))).toMatchObject({ amount: 10 });
    raiseTo(LEGEND_LEVEL_CURVE.cap);
    const result = damage.apply(state, dummy.id, 10, from(warrior));
    expect(result.applied && result.amount).toBeCloseTo(10 * potency);
  });
});
