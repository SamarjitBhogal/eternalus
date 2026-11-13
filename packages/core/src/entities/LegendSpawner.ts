import type { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { Entity } from './Entity';
import type { EntityFactory } from './EntityFactory';
import type { ControllerSpawn } from './EntityFactory.types';
import { Legend } from './Legend';

/**
 * The one way a Legend is added to a match from a definition id: the roster at setup and the
 * developer menu's `dev-spawn-legend` both go through it, so they check and spawn alike.
 */
export class LegendSpawner {
  /** @param factory - Where definitions and kinds are looked up and entities are built. */
  public constructor(private readonly factory: EntityFactory) {}

  /** Why `definitionId` cannot spawn as a Legend: it names no definition or a non-Legend kind. */
  public refusal(definitionId: string): 'unknown-definition' | 'not-a-legend' | null {
    const { definitions, registry } = this.factory;
    if (!definitions.has(definitionId)) {
      return 'unknown-definition';
    }
    return registry.get(definitions.get(definitionId).kind)?.prototype instanceof Legend
      ? null
      : 'not-a-legend';
  }

  /**
   * Spawns the Legend of `definitionId` at `position` on `team`, with `controller` when it is a
   * bot's (none for the human's), and announces it with `entity-spawned`. Call `refusal` first.
   */
  public spawn(
    state: GameState,
    definitionId: string,
    team: PlayableTeam,
    position: Vec2,
    controller?: ControllerSpawn,
  ): Entity {
    const { kind } = this.factory.definitions.get(definitionId);
    const entity = this.factory.create(kind, definitionId, {
      position,
      team,
      ...(controller !== undefined && { controller }),
    });
    state.entities.add(entity);
    state.events.emit('entity-spawned', { entityId: entity.id, kind: entity.kind, team });
    return entity;
  }
}
