import type { EntityDefinitionBase } from '../content/EntityDefinition.types';
import type { LegendDefinition } from '../content/legends/legends.types';
import { autoBuildLoadout, validateLoadout } from '../loadout/loadoutApi';
import type { Loadout } from '../loadout/Loadout.types';
import type { LoadoutContent, LoadoutProblem } from '../loadout/LoadoutValidator.types';
import { IdGenerator } from '../utils/IdGenerator';
import { Entity } from './Entity';
import { ENTITY_ID_PREFIX } from './EntityFactory.constants';
import type {
  DefinitionSource,
  LegendEquipment,
  Placement,
  WeaponSource,
} from './EntityFactory.types';
import type { EntityRegistry } from './EntityRegistry';

/** A definition that builds a Legend: it has a default loadout (05 §12). */
type LoadoutDefinition = EntityDefinitionBase & Pick<LegendDefinition, 'defaultLoadout'>;

/**
 * Builds and spawns entities (architecture 04 §6). It looks the definition up by id, checks once
 * that the kind builds it, takes a fresh id from an `IdGenerator` (the same creation order yields
 * the same ids) and spawns the entity with its definition and placement. Callers (commands,
 * systems) only say what to build and where. A Legend spawns with a loadout that passed
 * `validateLoadout`: the placement's, or the class auto-build when it gives none or an invalid one
 * (05 §12, reference 08), so one validator decides what a Legend may carry.
 */
export class EntityFactory {
  /**
   * @param registry - Where entity kinds are looked up.
   * @param definitions - Where definitions are looked up by id.
   * @param ids - Where entity ids come from; a new counter per factory by default.
   * @param equipment - What Legends are equipped from: the weapons (passed in every spawn context)
   *   and who hears of a rejected loadout. Without it a Legend's loadout is not checked.
   */
  public constructor(
    public readonly registry: EntityRegistry,
    public readonly definitions: DefinitionSource,
    private readonly ids: IdGenerator = new IdGenerator(),
    private readonly equipment: LegendEquipment | null = null,
  ) {}

  /** Whether `kind` is registered and `definitionId` names a definition that `kind` builds. */
  public canCreate(kind: string, definitionId: string): boolean {
    return (
      this.registry.has(kind) &&
      this.definitions.has(definitionId) &&
      this.definitions.get(definitionId).kind === kind
    );
  }

  /**
   * Constructs the entity registered for `kind`, assigns it the next id and spawns it with its
   * definition at `placement`.
   *
   * @throws Error when the kind is unknown, the definition is missing or another kind builds it.
   */
  public create(kind: string, definitionId: string, placement: Placement): Entity {
    const EntityConstructor = this.registry.get(kind);

    if (EntityConstructor === undefined) {
      throw new Error(`Unknown entity kind "${kind}".`);
    }

    if (!this.definitions.has(definitionId)) {
      throw new Error(`Unknown definition "${definitionId}".`);
    }

    const definition = this.definitions.get(definitionId);

    if (definition.kind !== kind) {
      throw new Error(
        `Definition "${definitionId}" is built by "${definition.kind}", not "${kind}".`,
      );
    }

    const entity = new EntityConstructor(
      `${ENTITY_ID_PREFIX}${String(this.ids.next())}`,
      definitionId,
    );

    if (!(entity instanceof Entity)) {
      throw new Error(
        `Invalid entity registration for "${kind}": constructor must create an Entity.`,
      );
    }

    const loadout = this.loadoutFor(definition, placement.loadout);
    entity.spawn({
      ...placement,
      definition,
      ...(this.equipment && { weapons: this.equipment.weapons }),
      ...(loadout && { loadout }),
    });
    return entity;
  }

  /**
   * The loadout a Legend of `definition` spawns with: `given` when it validates for that class,
   * else the auto-build, reporting the rejection. `undefined` for a non-Legend, or without
   * equipment (nothing to check against: `given` is passed on as it is).
   */
  private loadoutFor(
    definition: EntityDefinitionBase,
    given: Loadout | undefined,
  ): Loadout | undefined {
    if (this.equipment === null || !EntityFactory.isLoadoutDefinition(definition)) return given;
    const content = this.loadoutContent(this.equipment.weapons);
    const used = autoBuildLoadout(definition.id, content);
    if (given === undefined) return used;
    const problems: LoadoutProblem[] = [...validateLoadout(given, content)];
    if (given.classId !== definition.id) {
      problems.unshift({
        field: 'class',
        ruleId: 'class-matches-legend',
        message: `loadout for class "${given.classId}" given to a "${definition.id}"`,
      });
    }
    if (problems.length === 0) return given;
    this.equipment.onLoadoutRejected?.({ definitionId: definition.id, given, problems, used });
    return used;
  }

  /** The Legend definitions and `weapons`, as the loadout rules read them. */
  private loadoutContent(weapons: WeaponSource): LoadoutContent {
    const { definitions } = this;
    return {
      legends: {
        has: (id) => definitions.has(id) && EntityFactory.isLoadoutDefinition(definitions.get(id)),
        get: (id) => {
          const definition = definitions.get(id);
          if (!EntityFactory.isLoadoutDefinition(definition)) {
            throw new Error(`Definition "${id}" is not a Legend class.`);
          }
          return definition;
        },
      },
      weapons,
    };
  }

  private static isLoadoutDefinition(
    definition: EntityDefinitionBase,
  ): definition is LoadoutDefinition {
    return 'defaultLoadout' in definition && typeof definition.defaultLoadout === 'object';
  }
}
