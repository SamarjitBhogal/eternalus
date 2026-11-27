import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { ControllerBinding } from '../../components/ControllerBinding';
import { Health } from '../../components/Health';
import { Transform } from '../../components/Transform';
import { MAP_FEATURE_DEFINITIONS } from '../../content/maps/mapFeatureDefinitions';
import { Combat } from '../../components/Combat';
import { TurretState } from '../../components/TurretState';
import { loadTurrets } from '../../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import type { StructureDefinition } from '../../content/structures/structures.types';
import { EntityFactory } from '../EntityFactory';
import { Turret } from './Turret';

const AMMO = loadTurrets(30).ammo;

/** A turret spawn context: the shipped definition, overridden by `changes`. */
const contextWith = (changes: Partial<StructureDefinition>, ammo: unknown = AMMO) => ({
  definition: { ...STRUCTURE_DEFINITIONS.get('turret'), ...changes },
  position: { x: 0, y: 0 },
  team: 'light',
  ammo,
});

describe('Turret', () => {
  it('is built from the shipped turret definition: 600 health, the map pylon radius, unbreakable at first, driven by the turret controller', () => {
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      STRUCTURE_DEFINITIONS,
      undefined,
      null,
      null,
      AMMO,
    );

    const turret = factory.create('turret', 'turret', {
      position: { x: 10, y: 20 },
      team: 'light',
      mapFeatureId: 'light-turret-0',
    });

    expect(turret).toBeInstanceOf(Turret);
    expect(turret.kind).toBe('turret');
    expect(turret.family).toBe('structure');
    expect(turret.getComponent(Health).max).toBe(600);
    expect(turret.getComponent(Transform).radius).toBe(
      MAP_FEATURE_DEFINITIONS.turret?.footprintRadius,
    );
    expect(turret.getComponent(Collider).isUnbreakable).toBe(true);
    expect(turret.getComponent(ControllerBinding)).toMatchObject({
      controllerId: 'turret',
      profileId: 'wall-turret',
    });
  });

  it('carries the ammo its definition names, best first, with the first loaded into a Combat that has no weapon', () => {
    const turret = new Turret('entity-1', 'turret');
    turret.spawn(contextWith({}));

    const state = turret.getComponent(TurretState);
    expect(state.ammo.map(({ id }) => id)).toEqual(['bolt-heavy', 'bolt-default']);
    expect(state.loadedId).toBe('bolt-heavy');
    const combat = turret.getComponent(Combat);
    expect(combat.attack).toBe(AMMO.get('bolt-heavy').attack);
    expect(combat.weaponId).toBeNull();
  });

  it('fails at spawn without an ammo source, with no ammo, or with an unknown ammo', () => {
    const spawn = (id: string, context: unknown) => () => {
      new Turret(id, 'turret').spawn(context);
    };

    expect(spawn('entity-1', contextWith({}, null))).toThrow(
      'Structure "entity-1" needs an ammo source to load its ammo.',
    );
    const { id, kind, displayName, baseHealth, footprintRadius, breakability } =
      STRUCTURE_DEFINITIONS.get('turret');
    const unarmed = {
      ...contextWith({}),
      definition: { id, kind, displayName, baseHealth, footprintRadius, breakability },
    };
    expect(spawn('entity-4', unarmed)).toThrow('Turret "entity-4" names no ammo.');
    expect(spawn('entity-2', contextWith({ ammo: [] }))).toThrow(
      'A turret needs at least one ammo.',
    );
    expect(spawn('entity-3', contextWith({ ammo: ['no-such-bolt'] }))).toThrow(
      'Structure "entity-3": unknown ammo "no-such-bolt".',
    );
  });
});
