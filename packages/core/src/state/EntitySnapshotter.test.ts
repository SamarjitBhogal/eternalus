import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { MapObjectBody } from '../components/MapObjectBody';
import { ZoneArea } from '../components/ZoneArea';
import { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { Entity } from '../entities/Entity';
import { Warrior } from '../entities/legends/Warrior';
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
/** The shipped curves, which a Legend's `Progression` levels along. */
const LEVEL_CURVES = loadLevelCurves();
const WARRIOR = loadDefaultContent(30).get('warrior');
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

  it("names a Legend's spec, and leaves the key out for a Legend without one and every other entity", () => {
    const placement = {
      position: { x: 1, y: 2 },
      team: 'light',
      weapons: loadWeapons(30),
    } as const;
    const knight = new Warrior('entity-1', 'warrior');
    knight.spawn({ ...placement, definition: WARRIOR, specId: 'knight' });
    const plain = new Warrior('entity-2', 'warrior');
    plain.spawn({ ...placement, definition: WARRIOR });
    const snapshotter = new EntitySnapshotter(4, LEVEL_CURVES);

    const snapshot = snapshotter.snapshotOf(knight);

    expect(snapshot.specId).toBe('knight');
    expect(snapshotter.snapshotOf(plain)).not.toHaveProperty('specId');
    expect(snapshotter.snapshotOf(new Bare('entity-3', 'bare'))).not.toHaveProperty('specId');
    expect(structuredClone(snapshot)).toEqual(snapshot);
  });
});
