import { describe, expect, it } from 'vitest';

import { createDefaultAbilityRegistry } from './abilities/defaultAbilityRegistry';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { countdownTicks } from './config/countdownTicks';
import { loadAbilities } from './content/abilities/loadAbilities';
import { ContentCatalogue } from './content/ContentCatalogue';
import type { MapFeature } from './content/maps/maps.types';
import { loadTurrets } from './content/structures/loadTurrets';
import { loadWeapons } from './content/weapons/loadWeapons';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import type { StructureDefinition } from './content/structures/structures.types';
import { WALL_TURRET } from './content/structures/turret';
import { RELEASE_DEBUG_CONFIG, TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { MemoryLogger } from './diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { Structure } from './entities/structures/Structure';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { SimulationOptions } from './Simulation.types';
import type { GameState } from './state/GameState';
import { Health } from './components/Health';
import type { Vec2 } from './utils/geometry.types';
import { isPointInAnyPolygon } from './utils/geometry';
import { TeamMembership } from './components/TeamMembership';
import { Transform } from './components/Transform';
import { Turret } from './entities/structures/Turret';
import { AreaHitQuery } from './state/AreaHitQuery';
import type { GameEventMap } from './state/GameEvents.types';
import { TRAINING_DUMMY } from './content/mobs/trainingDummy';

const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
const MAP = new MapGenerator().generate(config, 1);
const MAP_OBJECTS = new MapObjectBuilder().build(MAP, new MapPresentationBuilder().build(MAP));
const TURRET_FEATURES = MAP.features.filter(({ kind }) => kind === 'turret');

/** A match on the generated map with its map objects; `state` is the simulation's own. */
const setUp = (options: Partial<SimulationOptions> = {}) => {
  const logger = new MemoryLogger();
  const simulation = new Simulation({
    config,
    seed: 1,
    logger,
    debug: TEST_DEBUG_CONFIG,
    map: MAP,
    mapObjects: MAP_OBJECTS,
    ...options,
  });
  const { state } = simulation as unknown as { readonly state: GameState };
  const run = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      simulation.step();
    }
  };
  /** The turret structure built from `feature`. */
  const turretOf = (feature: MapFeature) =>
    simulation.snapshot().entities.find(({ mapFeatureId }) => mapFeatureId === feature.id);
  return { simulation, state, logger, run, turretOf };
};

/** A point `gap` metres outside `feature`'s pylon, away from its team's Stronghold. */
const outside = (feature: MapFeature, gap: number): Vec2 => {
  const home = MAP.features.find(
    ({ kind, team }) => kind === 'stronghold' && team === feature.team,
  )?.position;
  const dx = feature.position.x - (home?.x ?? 0);
  const dy = feature.position.y - (home?.y ?? 0);
  const length = Math.hypot(dx, dy);
  const radius = STRUCTURE_DEFINITIONS.get('turret').footprintRadius;
  return {
    x: feature.position.x + (dx / length) * (radius + gap),
    y: feature.position.y + (dy / length) * (radius + gap),
  };
};

const LIGHT_TURRET = TURRET_FEATURES.find(({ team }) => team === 'light');
/**
 * A light turret whose line out, away from its Stronghold, is open for its whole range. The line
 * out of `LIGHT_TURRET` meets a cliff 7.35 m from its centre, where its bolts end.
 */
const FIRING_TURRET = TURRET_FEATURES.find(({ id }) => id === 'light-turret-2');
const AMMO = loadTurrets(config.tickRate).ammo;
const DEFAULT_BOLT = AMMO.get('bolt-default');
const HEAVY_BOLT = AMMO.get('bolt-heavy');
const DUMMY_HEALTH = TRAINING_DUMMY.baseHealth;

/** Ticks from the match start to the end of its countdown, when turrets start to fire. */
const COUNTDOWN = countdownTicks(config.match.countdownSeconds, config.tickRate);

/**
 * Spawns one dark `kind` at `at` and runs the tick that spawns it; returns its id. The dev command
 * runs first in its tick, before the match spawns its own units.
 */
const spawnDark = (
  { simulation, state, run }: ReturnType<typeof setUp>,
  kind: string,
  definitionId: string,
  at: Vec2,
): string => {
  let id = '';
  const stop = state.events.on('entity-spawned', (spawned) => {
    const isOurs =
      id === '' &&
      spawned.team === 'dark' &&
      state.entities.get(spawned.entityId)?.definitionId === definitionId;
    if (isOurs) id = spawned.entityId;
  });
  simulation.enqueueCommand({ type: 'dev-spawn', kind, definitionId, team: 'dark', at, count: 1 });
  run(1);
  stop();
  return id;
};

describe('Simulation wall turrets', () => {
  it('builds every turret feature as a Turret structure with its team, no lane and 600 health', () => {
    const { state, turretOf } = setUp();

    expect(TURRET_FEATURES.length).toBeGreaterThan(0);
    for (const feature of TURRET_FEATURES) {
      const turret = turretOf(feature);
      const entity = state.entities.get(turret?.id ?? '');
      expect(turret).toMatchObject({
        kind: 'turret',
        family: 'structure',
        definitionId: 'turret',
        team: feature.team,
        health: { current: 600, max: 600 },
        transform: { x: feature.position.x, y: feature.position.y },
      });
      expect(entity instanceof Structure ? entity.laneId : 'not a structure').toBeNull();
    }
  });

  it("makes each turret's pylon map object its body: one health pool, no entity of its own", () => {
    const { simulation, turretOf } = setUp();
    const { entities, mapObjects = [] } = simulation.snapshot();

    for (const feature of TURRET_FEATURES) {
      const turret = turretOf(feature);
      const pylon = mapObjects.find(({ id }) => id === feature.id);
      expect(pylon).toMatchObject({ entityId: turret?.id, isDestroyed: false });
      expect(pylon?.health).toEqual(turret?.health);
    }
    expect(entities.filter(({ definitionId }) => definitionId === 'map-object-turret')).toEqual([]);
  });

  it("takes a hit on a turret into its one pool, which its pylon's map object shows", () => {
    // Breakable from the start, so a hit lands before two BuffTowers fall.
    const breakable = new ContentCatalogue<StructureDefinition>(
      STRUCTURE_DEFINITIONS.all().map((definition) =>
        definition.id === 'turret'
          ? { ...definition, breakability: { kind: 'always' } }
          : definition,
      ),
    );
    const { simulation, run, turretOf } = setUp({ structures: breakable });
    const feature = LIGHT_TURRET ?? TURRET_FEATURES[0];
    if (feature === undefined) throw new Error('The generated map has no turret.');
    run(countdownTicks(config.match.countdownSeconds, config.tickRate) + 1);
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'dark',
      at: outside(feature, 0.5),
      count: 1,
    });
    run(1);
    const warrior = simulation
      .snapshot()
      .entities.find(({ kind, team }) => kind === 'warrior' && team === 'dark');
    const turretId = turretOf(feature)?.id ?? '';
    simulation.enqueueCommand({
      type: 'attack-target',
      actorId: warrior?.id ?? '',
      targetId: turretId,
    });
    run(config.tickRate * 3);
    const { mapObjects = [] } = simulation.snapshot();
    const health = turretOf(feature)?.health;
    const pylon = mapObjects.find(({ id }) => id === feature.id);

    expect(health?.current).toBeLessThan(600);
    expect(pylon).toMatchObject({ entityId: turretId, health });
  });

  it("removes a destroyed turret's pylon, clearing its footprint and nav cells, while a fallen lane tower's fort stays", () => {
    // The lethal hits below skip the damage pipeline, which the test invariants refuse.
    const { simulation, state, run, turretOf } = setUp({ debug: RELEASE_DEBUG_CONFIG });
    const tower = MAP.features.find(
      ({ kind, team }) => kind === 'spawner-tower' && team === 'light',
    );
    if (tower === undefined) throw new Error('The map has no light spawner tower.');
    const towerId = simulation
      .snapshot()
      .entities.find(({ mapFeatureId }) => mapFeatureId === tower.id)?.id;
    const fortPiece = MAP_OBJECTS.find(({ id }) => id === tower.id)?.footprints[0] ?? [];
    const inFort = {
      x: fortPiece.reduce((sum, { x }) => sum + x, 0) / fortPiece.length,
      y: fortPiece.reduce((sum, { y }) => sum + y, 0) / fortPiece.length,
    };
    // A light turret and a point on its pylon that no wall segment or rock covers, with a clear
    // point 5 m further out in line with it (a pylon corner pulled in, and pushed out).
    const along = ({ position }: MapFeature, point: Vec2, scale: number): Vec2 => ({
      x: position.x + (point.x - position.x) * scale,
      y: position.y + (point.y - position.y) * scale,
    });
    const clearCorner = (feature: MapFeature) =>
      MAP_OBJECTS.find(({ id }) => id === feature.id)?.footprints[0]?.find(
        (point) =>
          state.worldObjects?.blockingAt(along(feature, point, 0.75), 0.3) === feature.id &&
          state.worldObjects.blockingAt(along(feature, point, 1.375), 0.3) === null,
      );
    const feature = TURRET_FEATURES.find(
      (turret) => turret.team === 'light' && clearCorner(turret),
    );
    const corner = feature === undefined ? undefined : clearCorner(feature);
    if (feature === undefined || corner === undefined) throw new Error('No pylon stands clear.');
    const probe = along(feature, corner, 0.75);
    const from = along(feature, corner, 1.375);
    const toProbe = { x: probe.x - from.x, y: probe.y - from.y };
    const gap = Math.hypot(toProbe.x, toProbe.y);
    const direction = { x: toProbe.x / gap, y: toProbe.y / gap };
    const { grid } = state.world ?? {};

    expect(state.worldObjects?.blockingAt(probe, 0.3)).toBe(feature.id);
    expect(grid?.isWalkableAt(probe.x, probe.y)).toBe(false);
    expect(simulation.dashReach(from, direction, gap, 0.3)).toBeLessThan(gap);
    expect(state.worldObjects?.blockingAt(inFort, 0.5)).toBe(tower.id);

    for (const id of [turretOf(feature)?.id, towerId]) {
      state.entities
        .get(id ?? '')
        ?.getComponent(Health)
        .applyDamage(1e6);
    }
    run(2);
    const { entities, mapObjects = [] } = simulation.snapshot();

    expect(entities.filter(({ id }) => id === turretOf(feature)?.id || id === towerId)).toEqual([]);
    expect(mapObjects.find(({ id }) => id === feature.id)?.isDestroyed).toBe(true);
    expect(state.worldObjects?.blockingAt(probe, 0.3)).toBeNull();
    expect(grid?.isWalkableAt(probe.x, probe.y)).toBe(true);
    expect(simulation.dashReach(from, direction, gap, 0.3)).toBe(gap);
    expect(mapObjects.find(({ id }) => id === tower.id)?.isDestroyed).toBe(false);
    expect(state.worldObjects?.blockingAt(inFort, 0.5)).toBe(tower.id);
  });

  it('keeps only its target in its brain, its ammo and aim on the turret, and drops a removed target', () => {
    const match = setUp();
    const { simulation, state, run, turretOf } = match;
    const feature = LIGHT_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light turret.');
    const turretId = turretOf(feature)?.id ?? '';
    const sentinelId = spawnDark(match, 'sentinel', 'sentinel', outside(feature, 4));
    run(COUNTDOWN + 3);

    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: sentinelId });
    expect(state.entities.turretAmmoOf(turretId)?.loadedId).toBe('bolt-heavy');
    expect(state.entities.attackAimOf(turretId)).toEqual(
      state.entities.placeOf(sentinelId)?.position,
    );

    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: sentinelId });
    run(4);
    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: null });
    expect(state.entities.attackAimOf(turretId)).toBeNull();
  });

  it('gives the same state hash for the same seed and commands with turrets firing, and the hash covers their brains and loaded ammo', () => {
    const feature = LIGHT_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light turret.');
    const runs = [setUp(), setUp(), setUp()].map((match) => {
      const { simulation, state, run, turretOf } = match;
      const fired: string[] = [];
      state.events.on('entity-spawned', ({ entityId, kind }) => {
        if (kind === 'projectile') fired.push(entityId);
      });
      spawnDark(match, 'sentinel', 'sentinel', outside(feature, 4));
      run(COUNTDOWN + 60);
      return { simulation, state, fired, turretId: turretOf(feature)?.id ?? '' };
    });
    const [first, second, third] = runs;

    expect(first?.fired.length).toBeGreaterThan(0);
    expect(first?.simulation.hash()).toBe(second?.simulation.hash());
    const brain = second?.state.ai.get(second.turretId);
    expect(typeof brain?.memory.targetId).toBe('string');
    if (second !== undefined && brain !== undefined) {
      second.state.ai.set(second.turretId, { ...brain, memory: { targetId: null } });
    }
    expect(first?.simulation.hash()).not.toBe(second?.simulation.hash());
    third?.state.entities.loadTurretAmmo(third.turretId, 'bolt-default');
    expect(first?.simulation.hash()).not.toBe(third?.simulation.hash());
  });

  it('kills a training dummy in range with a bolt that leaves its pylon and wall (DEC-334), credited to the turret', () => {
    const match = setUp();
    const { state, run, logger, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const dummyId = spawnDark(match, 'light-mob', 'training-dummy', outside(feature, 4));
    const hits: number[] = [];
    state.events.on('damage-applied', ({ targetId, amount, absorbed, source }) => {
      if (targetId === dummyId && source.attackerId === turretId) hits.push(amount + absorbed);
    });
    const deaths: GameEventMap['entity-died'][] = [];
    state.events.on('entity-died', (death) => deaths.push(death));
    run(COUNTDOWN + 30);

    expect(hits).toEqual([Math.min(DEFAULT_BOLT.attack.damage, DUMMY_HEALTH)]);
    expect(state.entities.turretAmmoOf(turretId)?.loadedId).toBe('bolt-default');
    expect(deaths).toContainEqual({
      entityId: dummyId,
      killer: { attackerId: turretId, kind: 'weapon', definitionId: 'turret' },
    });
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('loads heavy bolts against a Sentinel: each hit takes the heavy bolt damage and puts concussion on it', () => {
    const match = setUp();
    const { state, run, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const sentinelId = spawnDark(match, 'sentinel', 'sentinel', outside(feature, 4));
    const hits: number[] = [];
    state.events.on('damage-applied', ({ targetId, amount, absorbed, source }) => {
      if (targetId === sentinelId && source.attackerId === turretId) hits.push(amount + absorbed);
    });
    const statuses: GameEventMap['status-applied'][] = [];
    state.events.on('status-applied', (applied) => statuses.push(applied));
    run(COUNTDOWN + 1 + HEAVY_BOLT.attack.interval + 30);

    expect(hits).toEqual([HEAVY_BOLT.attack.damage, HEAVY_BOLT.attack.damage]);
    expect(statuses.filter(({ entityId }) => entityId === sentinelId)).toEqual([
      { entityId: sentinelId, statusId: 'concussion', sourceId: turretId },
      { entityId: sentinelId, statusId: 'concussion', sourceId: turretId },
    ]);
  });

  it('stops firing at a target that leaves its range: it drops the target and clears its aim', () => {
    const match = setUp();
    const { state, run, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const sentinelId = spawnDark(match, 'sentinel', 'sentinel', outside(feature, 4));
    run(COUNTDOWN + 3);
    expect(state.entities.attackAimOf(turretId)).not.toBeNull();
    let shots = 0;
    state.events.on('entity-spawned', ({ kind }) => {
      if (kind === 'projectile') shots += 1;
    });

    const far = outside(feature, WALL_TURRET.range + 10);
    state.entities.get(sentinelId)?.getComponent(Transform).moveTo(far);
    run(4);

    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: null });
    expect(state.entities.attackAimOf(turretId)).toBeNull();
    run(HEAVY_BOLT.attack.interval);
    expect(shots).toBe(0);
  });

  it('launches each bolt inside no body outline that would stop it, so the body stop needs no launch rule', () => {
    const { state, run } = setUp();
    run(1);
    const turretIds: string[] = [];
    state.entities.forEach((entity) => {
      if (entity instanceof Turret) turretIds.push(entity.id);
    });
    expect(turretIds).toHaveLength(TURRET_FEATURES.length);

    for (const turretId of turretIds) {
      const team = state.entities.teamOf(turretId);
      const launch = state.entities.placeOf(turretId)?.position;
      if (team === undefined || launch === undefined) throw new Error('A turret has no place.');
      state.entities.forEach((entity) => {
        const outline = state.entities.outlineOf(entity.id);
        const health = entity.findComponent(Health);
        if (outline === undefined || health === undefined) return;
        if (!isPointInAnyPolygon(launch, outline.polygons)) return;
        const body = { entity, health, membership: entity.findComponent(TeamMembership), outline };
        expect(
          AreaHitQuery.stopsShot(state.entities, { ownerId: turretId, team, targetId: null }, body),
        ).toBe(false);
      });
    }
  });

  it("refuses to start when a weapon attack's onHit step fails the ability registry's step check", () => {
    const weapons = loadWeapons(config.tickRate);
    const shortPush = { kind: 'knockback', distance: 0, shape: { kind: 'hit' } } as const;
    const broken = new ContentCatalogue(
      weapons.all().map((weapon) =>
        weapon.id === 'magus-staff'
          ? {
              ...weapon,
              attacks: weapon.attacks.map((attack) => ({ ...attack, onHit: [shortPush] })),
            }
          : weapon,
      ),
    );

    expect(() => setUp({ weapons: broken })).toThrow(
      'Weapon "magus-staff" attack 1 onHit: knockback distance must be positive.',
    );
  });

  it('logs no warning or error over a match start with turrets', () => {
    const { run, logger } = setUp();
    run(countdownTicks(config.match.countdownSeconds, config.tickRate) + 30);

    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });

  it('names only shipped entity kinds as heavy, so a typo never silently drops a target', () => {
    const registry = createDefaultEntityRegistry();

    for (const kind of WALL_TURRET.heavyKinds) {
      expect(registry.has(kind)).toBe(true);
    }
  });

  it("passes every turret ammo's onHit steps through the ability registry's step check", () => {
    const registry = createDefaultAbilityRegistry(loadAbilities(30), 30);

    for (const { id, attack } of loadTurrets(30).ammo.all()) {
      expect(registry.checkSteps(`Turret ammo "${id}" onHit`, attack.onHit ?? [])).toEqual([]);
    }
  });
});
