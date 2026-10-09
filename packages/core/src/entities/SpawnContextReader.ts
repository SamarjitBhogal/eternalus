import type { Vec2 } from '../utils/geometry.types';
import type { Entity } from './Entity';
import { SPAWNABLE_TEAMS } from './SpawnContextReader.constants';
import type {
  DefinitionRef,
  PlacedSpawnContext,
  PositionedSpawnContext,
} from './SpawnContextReader.types';

/**
 * Narrows the spawn context an entity receives in `installComponents` to its position and team,
 * and fails fast when they are missing.
 *
 * @remarks `Entity.spawn` takes `unknown`, so every family accepts the same input as `Entity`
 * (Liskov substitution) and narrows it here, in one place. The definition is the one the
 * `EntityFactory` looked up and matched to the entity's kind, so it is trusted as given.
 */
export class SpawnContextReader {
  /** Creates a reader for the spawn context of `entity`. */
  public constructor(private readonly entity: Entity) {}

  /**
   * Reads a context's position, with the definition the factory put next to it.
   *
   * @throws Error when the context has no position.
   */
  public positioned<Definition extends DefinitionRef>(
    context: unknown,
  ): PositionedSpawnContext<Definition> {
    const { definition, position } = SpawnContextReader.fields(context);

    if (!SpawnContextReader.isObject(position)) {
      throw new Error(`Entity "${this.entity.id}" needs a spawn context with a position.`);
    }

    // Safe: the factory looked the definition up and matched it to this kind (04 §6), so it is
    // not checked again; Transform rejects a position that is not a finite point.
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
}
