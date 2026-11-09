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

/**
 * Decides which units draw a health bar in the world (owner, 2026-11-09). A unit's bar stays
 * hidden from its spawn until it fights: it takes damage, or it deals damage to a living unit (a
 * Legend, mob or boss). A hit on a map object or a structure does not count. From then on the bar
 * shows until the unit dies. Only units outside the player's team show a bar, because the HUD
 * shows the player's own health. The rule reads the simulation's events through `Simulation.on`,
 * as `SoundView` does (08 §6). The views get only `hasHealthBar`.
 */
export class HealthBarVisibility {
  /** The units that fought since their last spawn. */
  private readonly fought = new Set<EntityId>();

  /** The units of the latest snapshot: a hit on one of them makes its attacker fight. */
  private units: ReadonlySet<EntityId> = new Set();

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
   * Reads the latest snapshot: which entities are units, and the player's team. Call it once for
   * the first snapshot and again after each `step`, before that step's events are needed.
   */
  public observe(snapshot: Snapshot): void {
    this.units = new Set(
      snapshot.entities.filter((entity) => isUnitFamily(entity.family)).map(({ id }) => id),
    );
    const playerId = snapshot.match.humanLegendId;
    this.playerTeam = snapshot.entities.find(({ id }) => id === playerId)?.team ?? null;
  }

  /** Whether `entity` draws its health bar: a living unit outside the player's team that fought. */
  public readonly hasHealthBar = (entity: EntitySnapshot): boolean =>
    this.fought.has(entity.id) &&
    isUnitFamily(entity.family) &&
    entity.team !== this.playerTeam &&
    !isDead(entity.health);

  /** Stops listening, so a finished match leaves no listener behind (13 §2). */
  public destroy(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
  }
}
