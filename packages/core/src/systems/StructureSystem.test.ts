import { describe, expect, it } from 'vitest';

import { loadTurrets } from '../content/structures/loadTurrets';
import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { MAP_OBJECT_DEFINITIONS } from '../content/maps/mapObjectDefinitions';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { WorldObjectStore } from '../state/WorldObjectStore';
import { IdGenerator } from '../utils/IdGenerator';
import { StructureSystem } from './StructureSystem';

const CONFIG = createDefaultGameConfig();

/** A light gate on lane-0 behind three light BuffTowers, a light SpawnerTower and a dark Stronghold. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    undefined,
    null,
    null,
    loadTurrets(30).ammo,
  );
  const spawn = (definitionId: string, team: 'light' | 'dark', laneId?: string): Entity => {
    const { kind } = STRUCTURE_DEFINITIONS.get(definitionId);
    const placement = { position: { x: 0, y: 0 }, team, ...(laneId !== undefined && { laneId }) };
    const entity = factory.create(kind, definitionId, placement);
    state.entities.add(entity);
    return entity;
  };
  const gate = spawn('gate', 'light', 'lane-0');
  const buffTowers = ['lane-0', 'lane-1', 'lane-2'].map((lane) =>
    spawn('buff-tower', 'light', lane),
  );
  const spawner = spawn('spawner-tower', 'light', 'lane-1');
  spawn('stronghold', 'dark');
  state.indexStructures();
  const destroyed: GameEventMap['structure-destroyed'][] = [];
  const changed: GameEventMap['structure-breakability-changed'][] = [];
  state.events.on('structure-destroyed', (event) => destroyed.push(event));
  state.events.on('structure-breakability-changed', (event) => changed.push(event));
  const system = new StructureSystem(STRUCTURE_DEFINITIONS);
  /** Kills `entity`, runs the system, then removes the dead like `DeathSystem`. */
  const kill = (entity: Entity) => {
    entity.getComponent(Health).applyDamage(1_000_000);
    system.update({ state, logger: { log: () => undefined } });
    state.entities.remove(entity.id, 'died');
  };
  return { state, system, gate, buffTowers, spawner, destroyed, changed, kill };
};

describe('StructureSystem', () => {
  it('announces a destroyed structure with its kind, team and lane', () => {
    const { spawner, destroyed, kill } = setUp();

    kill(spawner);

    expect(destroyed).toEqual([
      {
        entityId: spawner.id,
        kind: 'spawner-tower',
        definitionId: spawner.definitionId,
        team: 'light',
        lane: 'lane-1',
      },
    ]);
  });

  it('keeps a gate unbreakable until two of its team’s three BuffTowers are down', () => {
    const { state, system, gate, buffTowers, changed, kill } = setUp();
    const [first, second] = buffTowers;
    if (first === undefined || second === undefined) {
      throw new Error('fixture has three BuffTowers');
    }

    expect(gate.getComponent(Collider).isUnbreakable).toBe(true);
    kill(first);
    expect(gate.getComponent(Collider).isUnbreakable).toBe(true);
    expect(changed).toEqual([]);

    kill(second);
    system.update({ state, logger: { log: () => undefined } });

    expect(gate.getComponent(Collider).isUnbreakable).toBe(false);
    expect(changed).toEqual([{ entityId: gate.id, isBreakable: true, lane: 'lane-0' }]);
  });

  it("flips the map object a structure is mounted on (a wall turret's pylon) with it (DEC-388)", () => {
    const { state, system, gate, buffTowers, kill } = setUp();
    const [first, second] = buffTowers;
    if (first === undefined || second === undefined) {
      throw new Error('fixture has three BuffTowers');
    }
    const pylon = {
      id: 'pylon',
      kind: 'turret',
      isBlocking: true,
      footprints: [
        [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 4 },
        ],
      ],
    } as const;
    state.worldObjects = new WorldObjectStore({
      objects: [pylon],
      factory: new EntityFactory(
        createDefaultEntityRegistry(),
        new ContentCatalogue(Object.values(MAP_OBJECT_DEFINITIONS)),
        new IdGenerator(2000),
      ),
      entities: state.entities,
      definitions: MAP_OBJECT_DEFINITIONS,
      mounted: new Map([['pylon', gate.id]]),
    });
    const pylonId = state.worldObjects.mountOf(gate.id) ?? '';

    expect(state.entities.takesNoDamage(pylonId)).toBe(true);
    kill(first);
    kill(second);
    system.update({ state, logger: { log: () => undefined } });

    expect(state.entities.takesNoDamage(gate.id)).toBe(false);
    expect(state.entities.takesNoDamage(pylonId)).toBe(false);
  });

  it('never makes towers unbreakable', () => {
    const { state, system, spawner, changed } = setUp();

    system.update({ state, logger: { log: () => undefined } });

    expect(spawner.getComponent(Collider).isUnbreakable).toBe(false);
    expect(changed).toEqual([]);
  });

  it.each([
    [{ kind: 'always' } as const, 0, 3, true],
    [{ kind: 'never' } as const, 3, 3, false],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 } as const, 1, 3, false],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 } as const, 4, 5, true],
    [{ kind: 'allied-buff-towers-down', fraction: 2 / 3 } as const, 3, 5, false],
  ])('evaluates %o with %i of %i BuffTowers down as %s', (rule, down, total, expected) => {
    expect(StructureSystem.passes(rule, down, total)).toBe(expected);
  });
});
