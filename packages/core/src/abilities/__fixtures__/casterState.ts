import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import type { AbilityKit } from '../../content/abilities/AbilityDefinition.types';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { loadWeapons } from '../../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import type { Entity } from '../../entities/Entity';
import { EntityFactory } from '../../entities/EntityFactory';
import type { DefinitionSource } from '../../entities/EntityFactory.types';
import { GameState } from '../../state/GameState';

const UNITS = loadDefaultContent(30);

/**
 * The shipped unit and structure definitions, with the Warrior's default kit replaced by `kit`
 * when given.
 */
export const unitsWithWarriorKit = (kit?: AbilityKit): DefinitionSource => ({
  has: (id) => UNITS.has(id) || STRUCTURE_DEFINITIONS.has(id),
  get: (id) =>
    STRUCTURE_DEFINITIONS.has(id)
      ? STRUCTURE_DEFINITIONS.get(id)
      : id === 'warrior' && kit !== undefined
        ? { ...UNITS.get('warrior'), defaultKit: kit }
        : UNITS.get(id),
});

/**
 * A match state with one light Warrior at the origin (`entity-1`), equipped with `kit` (the class
 * default when omitted), and the factory that built it.
 */
export const casterState = (
  kit?: AbilityKit,
): { readonly state: GameState; readonly factory: EntityFactory; readonly caster: Entity } => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    unitsWithWarriorKit(kit),
    undefined,
    loadWeapons(30),
  );
  const caster = factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' });
  state.entities.add(caster);
  return { state, factory, caster };
};

/** The kit of the cast tests: a strike, an unbuilt ability, a dash and an ultimate with an effect. */
export const TEST_KIT: AbilityKit = {
  abilities: ['fake-strike', 'veil', 'fake-dash'],
  ultimate: 'fake-ultimate',
};
