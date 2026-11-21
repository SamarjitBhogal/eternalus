import { describe, expect, it } from 'vitest';

import { loadDefaultContent } from '../../content/loadDefaultContent';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { Entity } from '../Entity';
import { Warrior } from '../legends/Warrior';
import { weaponSourceOf } from './weaponSourceOf';

/** A thing with no `Combat`: it fights, if at all, with its own definition. */
class Biter extends Entity {
  public readonly kind = 'biter';
  public readonly family = 'mob';
  protected installComponents(): void {
    // Nothing: no weapon to name.
  }
}

describe('weaponSourceOf', () => {
  it('names the attacker and the weapon it holds', () => {
    const warrior = new Warrior('entity-1', 'warrior');
    warrior.spawn({
      definition: loadDefaultContent(30).get('warrior'),
      position: { x: 0, y: 0 },
      team: 'light',
      weapons: loadWeapons(30),
    });

    expect(weaponSourceOf(warrior)).toEqual({
      attackerId: 'entity-1',
      kind: 'weapon',
      definitionId: 'raptor-talons',
    });
  });

  it('names its own definition for a unit without a weapon (04 §5)', () => {
    const biter = new Biter('entity-2', 'test-biter');
    biter.spawn({});

    expect(weaponSourceOf(biter)).toEqual({
      attackerId: 'entity-2',
      kind: 'weapon',
      definitionId: 'test-biter',
    });
  });
});
