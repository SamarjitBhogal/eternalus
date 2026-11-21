import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { MapObjectBody } from '../components/MapObjectBody';
import { ZoneArea } from '../components/ZoneArea';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
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
      mapFeatureId: 'light-stronghold',
    });
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
});
