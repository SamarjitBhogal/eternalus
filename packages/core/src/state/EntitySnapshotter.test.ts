import { describe, expect, it } from 'vitest';

import { Aether } from '../components/Aether';
import { Combat } from '../components/Combat';
import { Footprint } from '../components/Footprint';
import { Capturable } from '../components/Capturable';
import { MapObjectBody } from '../components/MapObjectBody';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { ProjectilePayload } from '../components/ProjectilePayload';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import type { RangedAttack } from '../content/units/units.types';
import { Entity } from '../entities/Entity';
import { Stronghold } from '../entities/structures/Stronghold';
import { EntitySnapshotter } from './EntitySnapshotter';

/** An entity with no components; a test adds the ones it needs. */
class Bare extends Entity {
  public readonly kind = 'bare';
  public readonly family = 'test';

  protected installComponents(): void {
    // Each test adds its own components.
  }
}

const CURVES = new ContentCatalogue<LevelCurveDefinition>([]);
const STATUSES = loadStatusEffects(30, 2);
const SQUARE = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
];
const SHOT_ATTACK: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 45,
  reach: 50,
  interval: 21,
  projectile: { projectileId: 'arrow', falloff: null },
};

describe('EntitySnapshotter', () => {
  it("snapshots a zone's area and capture state, with the checkpoint count it is given", () => {
    const zone = new Bare('zone-1', 'zone-definition');
    const area = new ZoneArea([SQUARE]);
    zone.addComponent(area);
    zone.addComponent(new Capturable());

    const snapshot = new EntitySnapshotter(4, CURVES, 0).snapshotOf(zone);

    expect(snapshot.area).toBe(area.polygons);
    expect(snapshot.capture).toEqual({
      owner: 'neutral',
      progress: 0,
      checkpoint: 0,
      checkpoints: 4,
      lockedBy: null,
      presence: { light: 0, dark: 0, neutral: 0 },
    });
  });

  it('names the map object a body stands for, and leaves the key out for every other entity', () => {
    const house = new Bare('entity-1', 'house');
    house.addComponent(
      new MapObjectBody({ id: 'house-7', kind: 'house', isBlocking: true, footprints: [SQUARE] }),
    );
    const snapshotter = new EntitySnapshotter(4, CURVES, 0);

    expect(snapshotter.snapshotOf(house).mapObjectId).toBe('house-7');
    expect(snapshotter.snapshotOf(new Bare('entity-2', 'bare'))).not.toHaveProperty('mapObjectId');
  });

  it("snapshots an entity's aether pool as current and max (DEC-230)", () => {
    const mage = new Bare('entity-1', 'mage');
    const aether = new Aether(80);
    aether.spend(30);
    mage.addComponent(aether);

    expect(new EntitySnapshotter(4, CURVES, 0).snapshotOf(mage).aether).toEqual({
      current: 50,
      max: 80,
    });
  });

  it('gives an entity without aether no aether group', () => {
    expect(
      new EntitySnapshotter(4, CURVES, 0).snapshotOf(new Bare('entity-1', 'bare')).aether,
    ).toBeNull();
  });

  it('names the map feature a structure was built from, and leaves the key out for every other entity', () => {
    const built = new Stronghold('entity-1', 'stronghold');
    built.spawn({
      definition: STRUCTURE_DEFINITIONS.get('stronghold'),
      position: { x: 5, y: 6 },
      team: 'light',
      mapFeatureId: 'light-stronghold',
    });
    const loose = new Stronghold('entity-2', 'stronghold');
    loose.spawn({
      definition: STRUCTURE_DEFINITIONS.get('stronghold'),
      position: { x: 7, y: 8 },
      team: 'dark',
    });
    const snapshotter = new EntitySnapshotter(4, CURVES, 0);

    const snapshot = snapshotter.snapshotOf(built);

    expect(snapshot.mapFeatureId).toBe('light-stronghold');
    expect(snapshotter.snapshotOf(loose)).not.toHaveProperty('mapFeatureId');
    expect(snapshotter.snapshotOf(new Bare('entity-3', 'bare'))).not.toHaveProperty('mapFeatureId');
    expect(structuredClone(snapshot)).toEqual(snapshot);
  });

  it('snapshots each active status with its ticks so far and left, null without the component', () => {
    const vanguard = new Bare('entity-1', 'warrior');
    const statuses = new StatusEffects();
    statuses.apply(STATUSES.get('fury-windup'), vanguard.id, 10);
    statuses.apply(STATUSES.get('enraged'), null, 4);
    vanguard.addComponent(statuses);
    const calm = new Bare('entity-2', 'warrior');
    calm.addComponent(new StatusEffects());

    const snapshotter = new EntitySnapshotter(4, CURVES, 13);

    expect(snapshotter.snapshotOf(vanguard).statuses).toEqual([
      { id: 'fury-windup', ticksActive: 3, ticksLeft: 6 },
      { id: 'enraged', ticksActive: 9, ticksLeft: null },
    ]);
    expect(snapshotter.snapshotOf(calm).statuses).toEqual([]);
    expect(snapshotter.snapshotOf(new Bare('entity-3', 'bare')).statuses).toBeNull();
  });

  it('marks an entity a `hidden` status holds (Veil, DEC-266), and leaves the key out otherwise', () => {
    const veiled = new Bare('entity-1', 'warrior');
    const statuses = new StatusEffects();
    statuses.apply(STATUSES.get('invisible'), veiled.id, 0);
    veiled.addComponent(statuses);
    const furious = new Bare('entity-2', 'warrior');
    const fury = new StatusEffects();
    fury.apply(STATUSES.get('enraged'), null, 0);
    furious.addComponent(fury);

    const snapshotter = new EntitySnapshotter(4, CURVES, 1);

    expect(snapshotter.snapshotOf(veiled).isHidden).toBe(true);
    expect(snapshotter.snapshotOf(furious)).not.toHaveProperty('isHidden');
    expect(snapshotter.snapshotOf(new Bare('entity-3', 'bare'))).not.toHaveProperty('isHidden');
  });

  it('leaves a broken status out of the list at once, as it leaves isHidden out (DEC-267)', () => {
    const veiled = new Bare('entity-1', 'warrior');
    const statuses = new StatusEffects();
    statuses.apply(STATUSES.get('invisible'), veiled.id, 0);
    statuses.apply(STATUSES.get('enraged'), null, 0);
    veiled.addComponent(statuses);

    statuses.breakOnHit(1);
    const snapshot = new EntitySnapshotter(4, CURVES, 1).snapshotOf(veiled);

    expect(snapshot.statuses?.map(({ id }) => id)).toEqual(['enraged']);
    expect(snapshot).not.toHaveProperty('isHidden');
  });

  it('snapshots the latest sweep as plain data, and null when there is none (DEC-304)', () => {
    const swinger = new Bare('entity-1', 'warrior');
    const combat = new Combat({ basic: { strategy: 'melee', damage: 1, reach: 1, interval: 5 } });
    swinger.addComponent(combat);
    const snapshotter = new EntitySnapshotter(4, CURVES, 9);
    expect(snapshotter.snapshotOf(swinger).swing).toBeNull();
    expect(snapshotter.snapshotOf(new Bare('entity-2', 'bare')).swing).toBeNull();

    combat.recordSwing({ atTick: 7, direction: { x: 0, y: 1 }, radius: 3.5, arcDegrees: 160 });
    const { swing } = snapshotter.snapshotOf(swinger);

    expect(swing).toEqual({
      atTick: 7,
      direction: { x: 0, y: 1 },
      radius: 3.5,
      arcDegrees: 160,
    });
    expect(structuredClone(swing)).toEqual(swing);
  });

  it('snapshots a fired shot as its flown share of the range and its ending, and anything else as null', () => {
    const snapshotter = new EntitySnapshotter(3, CURVES, 0);
    const shot = new Bare('shot-1', 'arrow');
    const flight = new ProjectileFlight(100, 80, 4);
    const at = new Transform({ x: 13, y: 4 }, 0.15);
    shot.addComponent(at);
    shot.addComponent(flight);
    shot.addComponent(
      new ProjectilePayload({
        ownerId: 'owner',
        team: 'light',
        source: { attackerId: 'owner', kind: 'weapon', definitionId: 'obsidian-bow' },
        targetId: null,
        impact: { kind: 'weapon', attack: SHOT_ATTACK },
        origin: { x: 10, y: 0 },
      }),
    );
    const unfired = new Bare('shot-2', 'arrow');
    unfired.addComponent(new Transform({ x: 0, y: 0 }, 0.15));
    unfired.addComponent(new ProjectileFlight(100, 80, 4));

    // 5 m from its origin (a 3-4-5 triangle) of a 100 m range.
    const flying = snapshotter.snapshotOf(shot).projectile;
    at.moveBy({ x: 60, y: 80 });
    flight.end();
    flight.tickEnding();
    const ending = snapshotter.snapshotOf(shot).projectile;

    expect(flying).toEqual({ flownShare: 0.05, ending: null });
    expect(ending).toEqual({ flownShare: 1, ending: 0.25 });
    expect(snapshotter.snapshotOf(unfired).projectile).toBeNull();
    expect(snapshotter.snapshotOf(new Bare('bare-1', 'x')).projectile).toBeNull();
  });

  it('gives a placed body its outline, and leaves the key out for a structure and every other entity', () => {
    const wall = new Bare('entity-1', 'wall');
    wall.addComponent(new Footprint([SQUARE]));
    const stronghold = new Stronghold('entity-2', 'stronghold');
    stronghold.spawn({
      definition: STRUCTURE_DEFINITIONS.get('stronghold'),
      position: { x: 2, y: 2 },
      team: 'light',
    });
    stronghold.addComponent(new Footprint([SQUARE]));
    const snapshotter = new EntitySnapshotter(4, CURVES, 0);

    const snapshot = snapshotter.snapshotOf(wall);

    expect(snapshot.outline).toEqual([SQUARE]);
    expect(snapshotter.snapshotOf(stronghold)).not.toHaveProperty('outline');
    expect(snapshotter.snapshotOf(new Bare('entity-3', 'bare'))).not.toHaveProperty('outline');
    expect(structuredClone(snapshot)).toEqual(snapshot);
  });
});
