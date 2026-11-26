import { describe, expect, it } from 'vitest';

import { DamagePipeline } from './combat/DamagePipeline';
import { Health } from './components/Health';
import { MapObjectBody } from './components/MapObjectBody';
import { ProjectileFlight } from './components/ProjectileFlight';
import { ProjectilePayload } from './components/ProjectilePayload';
import { Transform } from './components/Transform';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { loadProjectiles } from './content/projectiles/loadProjectiles';
import type { RangedAttack } from './content/units/units.types';
import { NullLogger } from './diagnostics/NullLogger';
import type { Entity } from './entities/Entity';
import { Projectile } from './entities/Projectile';
import { Structure } from './entities/structures/Structure';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { GameState } from './state/GameState';
import { createDefaultProjectileImpacts } from './systems/defaultProjectileImpacts';
import { ProjectileSystem } from './systems/ProjectileSystem';
import type { Vec2 } from './utils/geometry.types';

/*
 * Arrows across the real camp fires of the seed 1 match, as `Simulation` builds them: the fire's
 * body (`WorldObjectStore`), the forest camp's home at the fire's centre (`spawnStructures`) and
 * the fire's stones in the match's collision rule (HC-Q105, DEC-373, HC-Q115).
 */

const CONFIG = createDefaultGameConfig();
const ARROW = loadProjectiles(CONFIG.tickRate).get('arrow');
const ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 10,
  reach: 100,
  interval: 27,
  projectile: { projectileId: 'arrow', falloff: null },
};
/** A forest camp, with its camp structure, and a corner camp, which has none. */
const FOREST_CAMP = 'west-camp-corridor-0-0';
const CORNER_CAMP = 'west-corner-camp-0';

/** The seed 1 match before its first tick, with a projectile system of its own. */
const match = () => {
  const map = new MapGenerator().generate(CONFIG, 1);
  const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
  const simulation = new Simulation({
    config: CONFIG,
    seed: 1,
    logger: new NullLogger(),
    map,
    mapObjects,
  });
  const { state } = simulation as unknown as { readonly state: GameState };
  // The countdown holds every shot. The shots here fly before the first tick, so no camp mob
  // stands in their way.
  state.match.holdIdle(false);
  const projectiles = new ProjectileSystem(
    createDefaultProjectileImpacts(new DamagePipeline(), null),
  );
  /** The camp's centre, its fire's body and its camp structure (none at a corner camp). */
  const campOf = (featureId: string) => {
    const centre = map.features.find(({ id }) => id === featureId)?.position;
    let fire: Entity | undefined;
    let camp: Entity | undefined;
    state.entities.forEach((entity) => {
      if (entity.findComponent(MapObjectBody)?.object.id === `${featureId}-camp-fire`) {
        fire = entity;
      }
      if (entity instanceof Structure && entity.mapFeatureId === featureId) camp = entity;
    });
    if (centre === undefined || fire === undefined) {
      throw new Error(`The seed 1 map has no camp fire at "${featureId}".`);
    }
    return { centre, fire, camp };
  };
  let counter = 0;
  /**
   * A light arrow 8 m west of `centre`, moved 16 m east this tick: across the fire's stones (8 m
   * wide) and its centre, clear of the tents. Aimed at `targetId`, or at nothing.
   */
  const shootAcross = (centre: Vec2, targetId: string | null = null): Projectile => {
    counter += 1;
    const origin = { x: centre.x - 8, y: centre.y };
    const shot = new Projectile(`shot-${String(counter)}`, ARROW.id);
    shot.spawn({ definition: ARROW, position: origin, team: 'light' });
    shot.addComponent(
      new ProjectilePayload({
        ownerId: 'archer',
        team: 'light',
        ownerLevel: 1,
        source: { attackerId: 'archer', kind: 'weapon', definitionId: 'bow' },
        targetId,
        impact: { kind: 'weapon', attack: ATTACK },
        origin,
      }),
    );
    state.entities.add(shot);
    shot.getComponent(Transform).moveBy({ x: 16, y: 0 });
    projectiles.update({ state, logger: new NullLogger() });
    return shot;
  };
  const healthOf = (entity: Entity): number => entity.getComponent(Health).current;
  /** The map feature id of every camp fire on the map, in map order. */
  const campIds = (): readonly string[] =>
    mapObjects
      .filter(({ id }) => id.endsWith('-camp-fire'))
      .map(({ id }) => id.slice(0, -'-camp-fire'.length));
  return { state, campOf, campIds, shootAcross, healthOf };
};

describe('Simulation: arrows over the camp fires (HC-Q105, DEC-373, HC-Q115)', () => {
  it("flies an arrow not aimed at the camp over every camp fire and the camp's home at its centre, and lights it", () => {
    const { state, campOf, campIds, shootAcross, healthOf } = match();
    expect(campIds()).toHaveLength(16);

    const results = campIds().map((featureId) => {
      const { centre, fire, camp } = campOf(featureId);
      const shot = shootAcross(centre);
      return {
        featureId,
        // A forest camp has its home at the fire's centre; a corner camp has none (`MapBuilder`).
        isHomeAsExpected: featureId.includes('corner-camp')
          ? camp === undefined
          : camp?.getComponent(Transform).position.x === centre.x &&
            camp.getComponent(Transform).position.y === centre.y,
        isShotFlying: state.entities.has(shot.id),
        isShotLit: shot.findComponent(ProjectileFlight)?.isLit === true,
        isFireUnharmed: healthOf(fire) === fire.getComponent(Health).max,
      };
    });

    expect(
      results.filter(
        (r) => !(r.isHomeAsExpected && r.isShotFlying && r.isShotLit && r.isFireUnharmed),
      ),
    ).toEqual([]);
  });

  it("does the same at a corner camp's fire, which has no camp structure", () => {
    const { state, campOf, shootAcross, healthOf } = match();
    const { centre, fire, camp } = campOf(CORNER_CAMP);

    const shot = shootAcross(centre);

    expect(camp).toBeUndefined();
    expect(state.entities.has(shot.id)).toBe(true);
    expect(shot.getComponent(ProjectileFlight).isLit).toBe(true);
    expect(healthOf(fire)).toBe(fire.getComponent(Health).max);
  });

  it('lands an arrow aimed at the fire on the fire, and stops one aimed at the camp on the camp with no damage', () => {
    const { state, campOf, shootAcross, healthOf } = match();
    const { centre, fire, camp } = campOf(FOREST_CAMP);
    if (camp === undefined) throw new Error(`No camp structure at "${FOREST_CAMP}".`);

    const atCamp = shootAcross(centre, camp.id);
    const fireAfterCampShot = healthOf(fire);
    const atFire = shootAcross(centre, fire.id);

    expect(state.entities.has(atCamp.id)).toBe(false);
    expect(fireAfterCampShot).toBe(fire.getComponent(Health).max);
    expect(healthOf(camp)).toBe(camp.getComponent(Health).max);
    expect(state.entities.has(atFire.id)).toBe(false);
    expect(healthOf(fire)).toBe(fire.getComponent(Health).max - ATTACK.damage);
  });
});
