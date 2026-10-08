import type { Vec2 } from '../utils/geometry.types';
import type { Entity } from './Entity';
import { SPAWNABLE_TEAMS } from './SpawnContextReader.constants';
import type {
  DefinitionRef,
  PlacedSpawnContext,
  PositionedSpawnContext,
} from './SpawnContextReader.types';

/**
 * Reads the spawn context an entity receives in `installComponents`, and fails fast when it is not
 * the context that entity needs.
 *
 * @remarks `Entity.spawn` takes `unknown`, so every family accepts the same input as `Entity`
 * (Liskov substitution) and checks it here, in one place, instead of each family repeating the
 * checks. The reader checks the shape and that the definition is this entity's own (same id and
 * kind); the definition's fields are trusted to have passed `ContentValidator`.
 */
export class SpawnContextReader {
  /** Creates a reader for the spawn context of `entity`. */
  public constructor(private readonly entity: Entity) {}

  /**
   * Reads a context with a definition and a position.
   *
   * @throws Error when the context has no definition or position, or the definition is not
   * this entity's definition or kind.
   */
  public positioned<Definition extends DefinitionRef>(
    context: unknown,
  ): PositionedSpawnContext<Definition> {
    const { definition, position } = SpawnContextReader.fields(context);

    if (!SpawnContextReader.isDefinitionRef(definition) || !SpawnContextReader.isObject(position)) {
      throw new Error(
        `Entity "${this.entity.id}" needs a spawn context with a definition and a position.`,
      );
    }

    if (definition.id !== this.entity.definitionId || definition.kind !== this.entity.kind) {
      throw new Error(
        `Entity "${this.entity.id}" (${this.entity.kind}, ${this.entity.definitionId}) got ` +
          `definition "${definition.id}" (${definition.kind}).`,
      );
    }

    // Safe: shape and identity are checked above; field values were validated with the content,
    // and Transform rejects a position that is not a finite point.
    return { definition: definition as Definition, position: position as Vec2 };
  }

  /**
   * Reads a context with a definition, a position and a team.
   *
   * @throws Error when `positioned` would, or the team is not light, dark or neutral.
   */
  public placed<Definition extends DefinitionRef>(
    context: unknown,
  ): PlacedSpawnContext<Definition> {
    const positioned = this.positioned<Definition>(context);
    const { team: candidate } = SpawnContextReader.fields(context);
    const team = SPAWNABLE_TEAMS.find((spawnable) => spawnable === candidate);

    if (team === undefined) {
      throw new Error(
        `Entity "${this.entity.id}" needs a spawn context with a team (light, dark or neutral).`,
      );
    }

    return { ...positioned, team };
  }

  private static fields(context: unknown): Readonly<Record<string, unknown>> {
    return SpawnContextReader.isObject(context) ? context : {};
  }

  private static isObject(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null;
  }

  private static isDefinitionRef(value: unknown): value is DefinitionRef {
    return (
      SpawnContextReader.isObject(value) &&
      typeof value.id === 'string' &&
      typeof value.kind === 'string'
    );
  }
}
