import {
  type EntityId,
  isUnitFamily,
  type Simulation,
  type Snapshot,
  type Unsubscribe,
} from '@eternalus/core';

import { isDead } from '../bridge/selectors/isDead';
import type { Viewer } from './Viewer';
import type { HealthBarRule } from './views/EntityLayer.types';

/**
 * Decides which units draw a health bar in the world, and on which side (DEC-195). A unit's bar
 * stays hidden from its spawn until it fights: it takes damage, or it deals damage to a living
 * unit (a Legend, mob or boss). A hit on a map object or a structure does not count. From then on
 * the bar shows until the unit dies. Allies and enemies both show one; the player's own Legend
 * does not, because the HUD shows the player's health; the `Viewer` names the player and its team.
 * The rule reads the simulation's events through `Simulation.on`, as 08 §6 designs `SoundView`.
 * The views get only `healthBarOf`.
 */
export class HealthBarVisibility {
  /** The units that fought since their last spawn. */
  private readonly fought = new Set<EntityId>();

  /** The units of the latest snapshot: a hit on one of them makes its attacker fight. */
  private units: ReadonlySet<EntityId> = new Set();

  private readonly unsubscribes: readonly Unsubscribe[];

  /**
   * Starts listening to `damage-applied` and `entity-removed`; `destroy` stops. A removal (death or
   * any other cause) forgets the unit, after the tick's last hit, so a later unit starts hidden.
   */
  public constructor(
    simulation: Pick<Simulation, 'on'>,
    private readonly viewer: Viewer,
  ) {
    this.unsubscribes = [
      simulation.on('damage-applied', ({ targetId, source }) => {
        this.fought.add(targetId);
        if (source.attackerId !== null && this.units.has(targetId)) {
          this.fought.add(source.attackerId);
        }
      }),
      simulation.on('entity-removed', ({ entityId }) => this.fought.delete(entityId)),
    ];
  }

  /**
   * Reads which entities of the latest snapshot are units. Call it for the first snapshot and
   * after each step, so the next step's hits see this snapshot's units.
   */
  public observe(snapshot: Snapshot): void {
    this.units = new Set(
      snapshot.entities.filter((entity) => isUnitFamily(entity.family)).map(({ id }) => id),
    );
  }

  /**
   * The side of `entity`'s health bar, or `null` when it draws none: a living unit that fought,
   * other than the player. With no player (sim mode), every unit is on the `enemy` side.
   */
  public readonly healthBarOf: HealthBarRule = (entity) => {
    const isShown =
      this.fought.has(entity.id) &&
      isUnitFamily(entity.family) &&
      entity.id !== this.viewer.playerId &&
      !isDead(entity.health);
    if (!isShown) {
      return null;
    }
    return entity.team === this.viewer.team ? 'ally' : 'enemy';
  };

  /** Stops listening, so a finished match leaves no listener behind (13 §2). */
  public destroy(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  }
}
