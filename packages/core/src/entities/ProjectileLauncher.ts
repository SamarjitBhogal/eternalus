import { Movement } from '../components/Movement';
import { ProjectilePayload } from '../components/ProjectilePayload';
import type { ProjectilePayloadData } from '../components/ProjectilePayload.types';
import type { GameState } from '../state/GameState';
import type { ShotLauncher } from '../state/ShotLauncher.types';
import type { Vec2 } from '../utils/geometry.types';
import type { EntityFactory } from './EntityFactory';

/**
 * Puts a shot into the match through the match's one `EntityFactory` (architecture 05 §3, §10):
 * the projectile by id at the payload's origin, its `ProjectilePayload`, steered along the given
 * direction, added to the store and announced. An ability's `projectile` step launches through it
 * (`ShotLauncher`); `AbilitySystem` runs before the flight, so the shot moves, and can land, in its
 * cast tick.
 */
export class ProjectileLauncher implements ShotLauncher {
  /** @param factory - The match's one factory, which knows the projectile definitions. */
  public constructor(private readonly factory: Pick<EntityFactory, 'create'>) {}

  /**
   * Builds, steers, adds and announces the shot.
   *
   * @throws Error when the factory knows no projectile `projectileId` (`ProjectileEffect.validate`
   *   checks every id an ability names at boot, so this is a factory given other content).
   */
  public launch(
    state: GameState,
    projectileId: string,
    payload: ProjectilePayloadData,
    direction: Vec2,
  ): void {
    const { team, origin } = payload;
    const projectile = this.factory.create('projectile', projectileId, { team, position: origin });
    projectile.addComponent(new ProjectilePayload(payload));
    projectile.getComponent(Movement).steer(direction);
    state.entities.add(projectile);
    state.events.emit('entity-spawned', { entityId: projectile.id, kind: projectile.kind, team });
  }
}
