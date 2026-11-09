import {
  type EntityId,
  type EntitySnapshot,
  isUnitFamily,
  type Simulation,
  type Snapshot,
  type Team,
  type Unsubscribe,
} from '@eternalus/core';

import { isDead } from '../bridge/selectors/isDead';
import type { HealthBarSide } from './views/EntityLayer.types';

/**
 * Decides which units draw a health bar in the world, and on which side (DEC-195). A unit's bar
 * stays hidden from its spawn until it fights: it takes damage, or it deals damage to a living
 * unit (a Legend, mob or boss). A hit on a map object or a structure does not count. From then on
 * the bar shows until the unit dies. Allies and enemies both show one; the player's own Legend
 * does not, because the HUD shows the player's health. The rule reads the simulation's events
 * through `Simulation.on`, as `SoundView` does (08 §6). The views get only `healthBarOf`.
 */
export class HealthBarVisibility {
  /** The units that fought since their last spawn. */
  private readonly fought = new Set<EntityId>();

  /** The units of the latest snapshot: a hit on one of them makes its attacker fight. */
  private units: ReadonlySet<EntityId> = new Set();

  private playerId: EntityId | null = null;

  private playerTeam: Team | null = null;

  private readonly unsubscribes: readonly Unsubscribe[];

  /** Starts listening to `damage-applied` and `entity-died`; `destroy` stops. */
  public constructor(simulation: Pick<Simulation, 'on'>) {
    this.unsubscribes = [
      simulation.on('damage-applied', ({ targetId, source }) => {
        this.fought.add(targetId);
        if (source.attackerId !== null && this.units.has(targetId)) {
          this.fought.add(source.attackerId);
        }
      }),
      simulation.on('entity-died', ({ entityId }) => this.fought.delete(entityId)),
    ];
  }

  /**
   * Reads the latest snapshot: which entities are units, and the player and their team. Call it
   * once for the first snapshot and again after each `step`, before that step's events are needed.
   */
  public observe(snapshot: Snapshot): void {
    this.units = new Set(
      snapshot.entities.filter((entity) => isUnitFamily(entity.family)).map(({ id }) => id),
    );
    this.playerId = snapshot.match.humanLegendId;
    this.playerTeam = snapshot.entities.find(({ id }) => id === this.playerId)?.team ?? null;
  }

  /**
   * The side of `entity`'s health bar, or `null` when it draws none: a living unit that fought,
   * other than the player. With no player (sim mode), every unit is on the `enemy` side.
   */
  public readonly healthBarOf = (entity: EntitySnapshot): HealthBarSide | null => {
    const isShown =
      this.fought.has(entity.id) &&
      isUnitFamily(entity.family) &&
      entity.id !== this.playerId &&
      !isDead(entity.health);
    if (!isShown) {
      return null;
    }
    return entity.team === this.playerTeam ? 'ally' : 'enemy';
  };

  /** Stops listening, so a finished match leaves no listener behind (13 §2). */
  public destroy(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  }
}
