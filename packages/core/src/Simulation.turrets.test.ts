import { describe, expect, it } from 'vitest';
import { createDefaultAbilityRegistry } from './abilities/defaultAbilityRegistry';
import { countdownTicks } from './config/countdownTicks';
import { loadAbilities } from './content/abilities/loadAbilities';
import { ContentCatalogue } from './content/ContentCatalogue';
import type { MapFeature } from './content/maps/maps.types';
import { loadTurrets } from './content/structures/loadTurrets';
import { loadWeapons } from './content/weapons/loadWeapons';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import type { StructureDefinition } from './content/structures/structures.types';
import { WALL_TURRET } from './content/ai/turret';
import { RELEASE_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { createDefaultEntityRegistry } from './entities/defaultEntityRegistry';
import { Structure } from './entities/structures/Structure';
import { Health } from './components/Health';
import type { Vec2 } from './utils/geometry.types';
import { isPointInAnyPolygon } from './utils/geometry';
import { Transform } from './components/Transform';
import { TurretAmmoRule } from './state/TurretAmmoRule';
import type { GameEventMap } from './state/GameEvents.types';
import { TRAINING_DUMMY } from './content/mobs/trainingDummy';
import { DamagePipeline } from './combat/DamagePipeline';
import {
  config,
  MAP,
  MAP_OBJECTS,
  TURRET_FEATURES,
  setUp,
  outwardOf,
  outside,
  LIGHT_TURRET,
  FIRING_TURRET,
  COUNTDOWN,
  spawnDark,
} from './__fixtures__/turretMatch';

const AMMO = loadTurrets(config.tickRate).ammo;
const DEFAULT_BOLT = AMMO.get('bolt-default');
const HEAVY_BOLT = AMMO.get('bolt-heavy');
const DUMMY_HEALTH = TRAINING_DUMMY.baseHealth;

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

  it("gives each turret's pylon map object its own entity, 600 health and the turret's breakability, and carries the turret's health on it (DEC-375)", () => {
    const { simulation, state, turretOf } = setUp();
    const { entities, mapObjects = [] } = simulation.snapshot();

    for (const feature of TURRET_FEATURES) {
      const turret = turretOf(feature);
      const pylon = mapObjects.find(({ id }) => id === feature.id);
      expect(pylon).toMatchObject({
        health: { current: 600, max: 600 },
        condition: 'standing',
        carriedHealth: turret?.health,
      });
      expect(entities.find(({ id }) => id === pylon?.entityId)).toMatchObject({
        definitionId: 'map-object-turret',
        team: feature.team,
        mapObjectId: feature.id,
      });
      // Like the turret, the pylon takes no damage until two BuffTowers fall (DEC-341 (1)).
      expect(state.entities.takesNoDamage(pylon?.entityId ?? '')).toBe(true);
    }
    expect(
      entities.filter(({ definitionId }) => definitionId === 'map-object-turret'),
    ).toHaveLength(TURRET_FEATURES.length);
  });

  it("takes a hit on the turret into its pool only, and a hit on its pylon into the pylon's only (DEC-375)", () => {
    // Breakable from the start, so a hit lands before two BuffTowers fall.
    const breakable = new ContentCatalogue<StructureDefinition>(
      STRUCTURE_DEFINITIONS.all().map((definition) =>
        definition.id === 'turret'
          ? { ...definition, breakability: { kind: 'always' } }
          : definition,
      ),
    );
    const match = setUp({ structures: breakable });
    const { simulation, state, run, turretOf } = match;
    const feature = LIGHT_TURRET ?? TURRET_FEATURES[0];
    if (feature === undefined) throw new Error('The generated map has no turret.');
    run(COUNTDOWN + 1);
    const warriorId = spawnDark(match, 'warrior', 'warrior', outside(feature, 0.5));
    const turretId = turretOf(feature)?.id ?? '';
    const pylonOf = () => simulation.snapshot().mapObjects?.find(({ id }) => id === feature.id);
    const pylonId = pylonOf()?.entityId ?? '';
    // One hit on each body, through the damage pipeline as a real hit lands (a sweep hits both).
    const source = { attackerId: warriorId, kind: 'weapon', definitionId: 'test' } as const;
    const damage = new DamagePipeline();
    damage.apply(state, turretId, 100, source);
    run(1);
    const afterTurretHit = pylonOf();
    damage.apply(state, pylonId, 50, source);
    run(1);

    expect(afterTurretHit).toMatchObject({
      entityId: pylonId,
      health: { current: 600, max: 600 },
      carriedHealth: { current: 500, max: 600 },
    });
    expect(pylonOf()).toMatchObject({
      health: { current: 550, max: 600 },
      carriedHealth: { current: 500, max: 600 },
    });
    expect(turretOf(feature)?.health).toEqual({ current: 500, max: 600 });
  });

  it("keeps a destroyed turret's pylon standing and blocking, with its own health, its footprint and nav cells kept, as a fallen lane tower's fort (DEC-341, HC-Q91, DEC-375)", () => {
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
    const pylonId = state.worldObjects?.carrierOf(turretOf(feature)?.id ?? '');

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
    expect(mapObjects.find(({ id }) => id === feature.id)).toEqual({
      id: feature.id,
      entityId: pylonId,
      health: { current: 600, max: 600 },
      condition: 'ruin',
    });
    expect(state.worldObjects?.blockingAt(probe, 0.3)).toBe(feature.id);
    expect(grid?.isWalkableAt(probe.x, probe.y)).toBe(false);
    expect(simulation.dashReach(from, direction, gap, 0.3)).toBeLessThan(gap);
    expect(mapObjects.find(({ id }) => id === tower.id)).toMatchObject({ condition: 'ruin' });
    expect(state.worldObjects?.blockingAt(inFort, 0.5)).toBe(tower.id);
  });

  it('keeps only its target in its brain, its ammo and aim on the turret, and drops a removed target', () => {
    const match = setUp();
    const { simulation, state, run, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const sentinelId = spawnDark(match, 'sentinel', 'sentinel', outside(feature, 4));
    run(COUNTDOWN + 3);

    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: sentinelId });
    expect(new TurretAmmoRule().ammoOf(state.entities, turretId)?.loadedId).toBe('bolt-heavy');
    expect(state.entities.attackAimOf(turretId)).toEqual(
      state.entities.placeOf(sentinelId)?.position,
    );

    simulation.enqueueCommand({ type: 'dev-remove-entity', entityId: sentinelId });
    run(4);
    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: null });
    expect(state.entities.attackAimOf(turretId)).toBeNull();
  });

  it('gives the same state hash for the same seed and commands with turrets firing, and the hash covers their brains and loaded ammo', () => {
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
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
    if (third !== undefined)
      new TurretAmmoRule().load(third.state.entities, third.turretId, 'bolt-default');
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
    expect(new TurretAmmoRule().ammoOf(state.entities, turretId)?.loadedId).toBe('bolt-default');
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

  it('skips a nearer enemy behind a cliff for one it has a line of fire to, and sees past its own pylon (DEC-334)', () => {
    const match = setUp();
    const { state, run, turretOf } = match;
    const feature = LIGHT_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light turret.');
    const turretId = turretOf(feature)?.id ?? '';
    const hidden = spawnDark(match, 'light-mob', 'training-dummy', outside(feature, 2));
    const open = spawnDark(match, 'light-mob', 'training-dummy', outside(feature, 4, 60));
    const centre = state.entities.placeOf(turretId)?.position ?? { x: 0, y: 0 };
    const pylon = state.entities.outlineOf(turretId)?.polygons ?? [];
    const hit: string[] = [];
    state.events.on('damage-applied', ({ targetId, source }) => {
      if (source.attackerId === turretId) hit.push(targetId);
    });
    run(COUNTDOWN + 3);

    // The nearer dummy ranks first; the cliff stops its line, so the turret takes the open one.
    expect(isPointInAnyPolygon(centre, pylon)).toBe(true);
    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: open });
    expect(state.entities.attackAimOf(turretId)).toEqual(state.entities.placeOf(open)?.position);
    run(DEFAULT_BOLT.attack.interval);
    expect(hit).toContain(open);
    expect(hit).not.toContain(hidden);
    expect(state.entities.get(hidden)?.getComponent(Health).current).toBe(DUMMY_HEALTH);
  });

  it('drops a held target whose line of fire closes behind a cliff, as one that leaves range', () => {
    const match = setUp();
    const { state, run, turretOf } = match;
    const feature = LIGHT_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light turret.');
    const turretId = turretOf(feature)?.id ?? '';
    const dummyId = spawnDark(match, 'light-mob', 'training-dummy', outside(feature, 4, 60));
    run(COUNTDOWN + 3);
    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: dummyId });
    let shots = 0;
    state.events.on('entity-spawned', ({ kind }) => {
      if (kind === 'projectile') shots += 1;
    });

    state.entities.get(dummyId)?.getComponent(Transform).moveTo(outside(feature, 2));
    run(4);

    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: null });
    expect(state.entities.attackAimOf(turretId)).toBeNull();
    run(DEFAULT_BOLT.attack.interval);
    expect(shots).toBe(0);
  });

  it('leads a unit that crosses its range at constant velocity, and its bolt hits it (predictive aim)', () => {
    const match = setUp();
    const { simulation, state, run, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const out = outwardOf(feature);
    const across = outwardOf(feature, 90);
    // Out of range at first, on a line 14 m out that crosses the range circle.
    const start = {
      x: feature.position.x + out.x * 14 - across.x * 26,
      y: feature.position.y + out.y * 14 - across.y * 26,
    };
    const runnerId = spawnDark(match, 'warrior', 'warrior', start);
    run(COUNTDOWN);
    const hits: number[] = [];
    state.events.on('damage-applied', ({ targetId, source }) => {
      if (targetId === runnerId && source.attackerId === turretId) hits.push(state.tick);
    });
    const speeds: number[] = [];
    simulation.enqueueCommand({ type: 'move', actorId: runnerId, direction: across });
    for (let tick = 0; tick < 90 && hits.length === 0; tick += 1) {
      run(1);
      const velocity = state.entities.velocityOf(runnerId) ?? { x: 0, y: 0 };
      if (state.entities.attackAimOf(turretId) !== null)
        speeds.push(Math.hypot(velocity.x, velocity.y));
    }

    expect(hits).toHaveLength(1);
    // It moved at one speed from the turret's first aim to the hit.
    expect(speeds.length).toBeGreaterThan(0);
    expect(new Set(speeds.map((speed) => speed.toFixed(6))).size).toBe(1);
  });

  it('switches to an enemy Legend that kills an allied Legend in its range by a real hit (11 §8)', () => {
    const match = setUp();
    const { simulation, state, run, turretOf } = match;
    const feature = FIRING_TURRET;
    if (feature === undefined) throw new Error('The generated map has no light-turret-2.');
    const turretId = turretOf(feature)?.id ?? '';
    const dummyId = spawnDark(match, 'light-mob', 'training-dummy', outside(feature, 2, 30));
    const killerId = spawnDark(match, 'warrior', 'warrior', outside(feature, 7.5));
    let allyId = '';
    const stop = state.events.on('entity-spawned', ({ entityId, team }) => {
      if (team === 'light' && allyId === '') allyId = entityId;
    });
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: outside(feature, 6),
      count: 1,
    });
    run(1);
    stop();
    run(COUNTDOWN + 3);
    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: dummyId });

    // One hit from the killer is enough: the ally is left with 1 health.
    const allyHealth = state.entities.get(allyId)?.getComponent(Health);
    allyHealth?.applyDamage(allyHealth.current - 1);
    const killers: (string | null)[] = [];
    state.events.on('entity-died', ({ entityId, killer }) => {
      if (entityId === allyId) killers.push(killer.attackerId);
    });
    simulation.enqueueCommand({ type: 'attack-target', actorId: killerId, targetId: allyId });
    for (let tick = 0; tick < 60 && killers.length === 0; tick += 1) run(1);
    expect(killers).toEqual([killerId]);
    run(4);

    expect(state.ai.get(turretId)?.memory).toEqual({ targetId: killerId });
  });

  it('checks the ammo lists of the injected structures it builds from, not the shipped ones (DEC-168 B8)', () => {
    const badAmmo = new ContentCatalogue<StructureDefinition>(
      STRUCTURE_DEFINITIONS.all().map((definition) =>
        definition.id === 'turret' ? { ...definition, ammo: ['bolt-missing'] } : definition,
      ),
    );

    expect(() => setUp({ structures: badAmmo })).toThrow(
      'Structure "turret": unknown ammo "bolt-missing".',
    );
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
