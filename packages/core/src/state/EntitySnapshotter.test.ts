import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { Footprint } from '../components/Footprint';
import { MapFeatureLink } from '../components/MapFeatureLink';
import { MapObjectBody } from '../components/MapObjectBody';
import { ZoneArea } from '../components/ZoneArea';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { CAPTURE_POINT } from '../content/zones/capturePoint';
import { Entity } from '../entities/Entity';
import { BuffTower } from '../entities/structures/BuffTower';
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

  it('names the map object a body stands for, and leaves the key out for every other entity', () => {
    const house = new Bare('entity-1', 'house');
    house.addComponent(
      new MapObjectBody({ id: 'house-7', kind: 'house', isBlocking: true, footprints: [SQUARE] }),
    );
    const snapshotter = new EntitySnapshotter(4, CURVES);

    expect(snapshotter.snapshotOf(house).mapObjectId).toBe('house-7');
    expect(snapshotter.snapshotOf(new Bare('entity-2', 'bare'))).not.toHaveProperty('mapObjectId');
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

  it("carries a buff tower's aura radius from its definition, measured from its centre without a Footprint, and null for a structure without an aura (DEC-315 (4))", () => {
    const tower = new BuffTower('entity-1', 'buff-tower');
    tower.spawn({
      definition: STRUCTURE_DEFINITIONS.get('buff-tower'),
      position: { x: 5, y: 6 },
      team: 'light',
    });
    const stronghold = new Stronghold('entity-2', 'stronghold');
    stronghold.spawn({
      definition: STRUCTURE_DEFINITIONS.get('stronghold'),
      position: { x: 7, y: 8 },
      team: 'light',
    });
    const snapshotter = new EntitySnapshotter(4, CURVES);

    expect(snapshotter.snapshotOf(tower).aura).toEqual({
      radius: 12,
      box: { x: 5, y: 6, width: 0, height: 0 },
    });
    expect(snapshotter.snapshotOf(stronghold).aura).toBeNull();
  });

  it("carries the box a buff tower's aura is measured beyond: its Footprint box (DEC-323 (3))", () => {
    const tower = new BuffTower('entity-1', 'buff-tower');
    tower.spawn({
      definition: STRUCTURE_DEFINITIONS.get('buff-tower'),
      position: { x: 2, y: 2 },
      team: 'dark',
    });
    const footprint = new Footprint([SQUARE, [...SQUARE.map(({ x, y }) => ({ x: x + 6, y }))]]);
    tower.addComponent(footprint);

    const snapshot = new EntitySnapshotter(4, CURVES).snapshotOf(tower);

    expect(snapshot.aura).toEqual({ radius: 12, box: { x: 0, y: 0, width: 10, height: 4 } });
    expect(snapshot.aura?.box).toEqual(footprint.bounds);
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
