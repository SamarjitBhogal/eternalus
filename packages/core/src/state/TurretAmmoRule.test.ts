import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { TurretState } from '../components/TurretState';
import { loadTurrets } from '../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { IdGenerator } from '../utils/IdGenerator';
import { EntityStore } from './EntityStore';
import { TurretAmmoRule } from './TurretAmmoRule';

const TURRETS = loadTurrets(30);

/** An entity with no components: no `Combat`, no `TurretState`. */
class Bare extends Entity {
  public readonly kind = 'bare';
  public readonly family = 'test';

  protected installComponents(): void {
    // No components.
  }
}

const setUp = () => {
  const entities = new EntityStore();
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1),
    null,
    null,
    TURRETS.ammo,
  );
  const turret = factory.create('turret', 'turret', { team: 'light', position: { x: 5, y: 5 } });
  const bare = new Bare('bare-1', 'bare-definition');
  bare.spawn({});
  entities.add(turret);
  entities.add(bare);
  return { entities, turretId: turret.id, rule: new TurretAmmoRule() };
};

describe('TurretAmmoRule', () => {
  it('reads the ammo a turret carries and the one it has loaded, and nothing for an unknown id or a non-turret', () => {
    const { entities, turretId, rule } = setUp();

    const view = rule.ammoOf(entities, turretId);

    expect(view?.ammo.map(({ id }) => id)).toEqual(['bolt-heavy', 'bolt-default']);
    expect(view?.loadedId).toBe('bolt-heavy');
    expect(rule.ammoOf(entities, 'missing')).toBeUndefined();
    expect(rule.ammoOf(entities, 'bare-1')).toBeUndefined();
  });

  it('loads a carried ammo: the turret records it and its Combat equips the ammo attack', () => {
    const { entities, turretId, rule } = setUp();

    expect(rule.load(entities, turretId, 'bolt-default')).toBe(true);

    const turret = entities.get(turretId);
    expect(turret?.getComponent(TurretState).loadedId).toBe('bolt-default');
    expect(turret?.getComponent(Combat).attack).toBe(TURRETS.ammo.get('bolt-default').attack);
  });

  it('changes nothing and returns false for an ammo the turret does not carry', () => {
    const { entities, turretId, rule } = setUp();
    const before = entities.get(turretId)?.getComponent(Combat).attack;

    expect(rule.load(entities, turretId, 'bolt-missing')).toBe(false);

    expect(entities.get(turretId)?.getComponent(TurretState).loadedId).toBe('bolt-heavy');
    expect(entities.get(turretId)?.getComponent(Combat).attack).toBe(before);
  });

  it('returns false for an unknown entity and for one with no Combat', () => {
    const { entities, rule } = setUp();

    expect(rule.load(entities, 'missing', 'bolt-default')).toBe(false);
    expect(rule.load(entities, 'bare-1', 'bolt-default')).toBe(false);
  });
});
