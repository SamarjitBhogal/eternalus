import type { ControllerSpawn } from './EntityFactory.types';
import { CONTROLLER_IDS } from '../content/ai/controllerIds';
import type { Vec2 } from '../utils/geometry.types';
import type { Entity } from './Entity';
import type { WeaponSource } from './EntityFactory.types';
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

    const controller = this.controllerOf(SpawnContextReader.fields(context).controller);
    return controller === undefined ? { ...positioned, team } : { ...positioned, team, controller };
  }

  /**
   * The context's `Placement.controller`, or `undefined` when it gives none.
   *
   * @throws Error when it gives one that is not a known controller with a profile and a memory.
   */
  private controllerOf(candidate: unknown): ControllerSpawn | undefined {
    if (candidate === undefined) {
      return undefined;
    }
    const { controllerId, profileId, memory } = SpawnContextReader.fields(candidate);
    const id = CONTROLLER_IDS.find((known) => known === controllerId);
    if (id === undefined || typeof profileId !== 'string' || !SpawnContextReader.isObject(memory)) {
      throw new Error(
        `Entity "${this.entity.id}" was given a spawn controller that is not a known controller with a profile and a memory.`,
      );
    }
    // Safe: memory is the plain data the spawner wrote (`Placement.controller` is typed).
    return { controllerId: id, profileId, memory: memory as ControllerSpawn['memory'] };
  }

  /** The lane the context places the entity on (a lane structure's `MapLane.id`), or `null`. */
  public laneId(context: unknown): string | null {
    const { laneId } = SpawnContextReader.fields(context);
    return typeof laneId === 'string' ? laneId : null;
  }

  /** The weapon source the factory put in the context, or `null` when it has none. */
  public weapons(context: unknown): WeaponSource | null {
    const { weapons } = SpawnContextReader.fields(context);
    return SpawnContextReader.isWeaponSource(weapons) ? weapons : null;
  }

  private static isWeaponSource(value: unknown): value is WeaponSource {
    return (
      SpawnContextReader.isObject(value) &&
      typeof value.has === 'function' &&
      typeof value.get === 'function'
    );
  }

  private static fields(context: unknown): Readonly<Record<string, unknown>> {
    return SpawnContextReader.isObject(context) ? context : {};
  }

  private static isObject(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null;
  }
}
