import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { CombatHitbox } from '../components/CombatHitbox';
import { Jump } from '../components/Jump';
import { MapFeatureLink } from '../components/MapFeatureLink';
import { MapObjectBody } from '../components/MapObjectBody';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { CAPTURE_POINT } from '../content/zones/capturePoint';
import { Entity } from '../entities/Entity';
import { Stronghold } from '../entities/structures/Stronghold';
import { CapturePoint } from '../entities/zones/CapturePoint';
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
const SQUARE = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 4 },
  { x: 0, y: 4 },
];

describe('EntitySnapshotter', () => {
  it("snapshots a zone's area and capture state, with the checkpoint count it is given", () => {
    const zone = new Bare('zone-1', 'zone-definition');
    const area = new ZoneArea([SQUARE]);
    zone.addComponent(area);
    zone.addComponent(new Capturable());

    const snapshot = new EntitySnapshotter(4, CURVES).snapshotOf(zone);

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

  it("snapshots a jumper's height, and null for an entity that cannot jump (DEC-390)", () => {
    const jumper = new Bare('entity-1', 'bare-definition');
    const jump = new Jump();
    jumper.addComponent(jump);
    const snapshotter = new EntitySnapshotter(4, CURVES);
    expect(snapshotter.snapshotOf(jumper).elevation).toEqual({ height: 0 });

    jump.takeOff({ x: 1, y: 0 });
    jump.advance({ airTicks: 4, peakHeight: 2 });

    expect(snapshotter.snapshotOf(jumper).elevation).toEqual({ height: 1.5 });
    expect(snapshotter.snapshotOf(new Bare('entity-2', 'bare-definition')).elevation).toBeNull();
  });

  it('names the map object a body stands for, and leaves the key out for every other entity', () => {
    const house = new Bare('entity-1', 'house');
    house.addComponent(
      new MapObjectBody({ id: 'house-7', kind: 'house', isBlocking: true, footprints: [SQUARE] }),
    );
    const snapshotter = new EntitySnapshotter(4, CURVES);

    expect(snapshotter.snapshotOf(house).mapObjectId).toBe('house-7');
    expect(snapshotter.snapshotOf(new Bare('entity-2', 'bare'))).not.toHaveProperty('mapObjectId');
  });

  it("puts a big boss's body outline where it stands, and leaves the key out for every other entity", () => {
    const boss = new Bare('entity-1', 'greater-boss');
    boss.addComponent(new Transform({ x: 10, y: 20 }, 2.5));
    boss.addComponent(new CombatHitbox({ outline: SQUARE }));
    const snapshotter = new EntitySnapshotter(4, CURVES);

    expect(snapshotter.snapshotOf(boss).combatHitbox).toEqual([
      { x: 10, y: 20 },
      { x: 6, y: 20 },
      { x: 6, y: 24 },
      { x: 10, y: 24 },
    ]);
    expect(snapshotter.snapshotOf(new Bare('entity-2', 'bare'))).not.toHaveProperty('combatHitbox');
  });

  it('names the map feature a structure was built from, and leaves the key out for every other entity', () => {
    const built = new Stronghold('entity-1', 'stronghold');
    built.spawn({
      definition: STRUCTURE_DEFINITIONS.get('stronghold'),
      position: { x: 5, y: 6 },
      team: 'light',
    });
    built.addComponent(new MapFeatureLink('light-stronghold'));
    const loose = new Stronghold('entity-2', 'stronghold');
    loose.spawn({
      definition: STRUCTURE_DEFINITIONS.get('stronghold'),
      position: { x: 7, y: 8 },
      team: 'dark',
    });
    const snapshotter = new EntitySnapshotter(4, CURVES);

    const snapshot = snapshotter.snapshotOf(built);

    expect(snapshot.mapFeatureId).toBe('light-stronghold');
    expect(snapshotter.snapshotOf(loose)).not.toHaveProperty('mapFeatureId');
    expect(snapshotter.snapshotOf(new Bare('entity-3', 'bare'))).not.toHaveProperty('mapFeatureId');
    expect(structuredClone(snapshot)).toEqual(snapshot);
  });

  it('names the map feature of every entity that links one, a capture zone too (DEC-231)', () => {
    const zoneAt = (id: string, mapFeatureId?: string): CapturePoint => {
      const zone = new CapturePoint(id, CAPTURE_POINT.id);
      zone.spawn({
        definition: CAPTURE_POINT,
        position: { x: 5, y: 5 },
        team: 'neutral',
        area: [SQUARE],
      });
      if (mapFeatureId !== undefined) zone.addComponent(new MapFeatureLink(mapFeatureId));
      return zone;
    };
    const linked = new Bare('entity-3', 'bare');
    linked.addComponent(new MapFeatureLink('light-gate-lane-0'));
    const snapshotter = new EntitySnapshotter(4, CURVES);

    expect(snapshotter.snapshotOf(zoneAt('entity-1', 'capture-point-lane-1')).mapFeatureId).toBe(
      'capture-point-lane-1',
    );
    expect(snapshotter.snapshotOf(zoneAt('entity-2'))).not.toHaveProperty('mapFeatureId');
    expect(snapshotter.snapshotOf(linked).mapFeatureId).toBe('light-gate-lane-0');
  });
});
