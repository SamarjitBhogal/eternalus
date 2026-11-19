import type { AbilityDisplay, EntityId, Snapshot, Vec2 } from '@eternalus/core';

import type { HudSlotId } from '../bridge/Binding.types';
import type { DashReach } from './Match.types';
import type { AimTarget } from './views/AimOverlayView.types';

/**
 * Builds what the range overlay (`AimOverlayView`) draws each frame: the ability in the player's
 * selected slot, from the snapshot's slots and the display data, aimed from where the player's
 * Legend is drawn toward the pointer. It asks the simulation's rule how far each dash step really
 * goes (`DashReach`), so the view itself never calls the simulation (AGENTS.md rule 6).
 */
export class AimTargeting {
  /**
   * @param abilities Every ability's display data (`DisplayCatalogue.abilities`).
   * @param playerId The player's Legend, or `null` when it has none.
   * @param dashReach How far a dash really goes; without it a dash goes its whole distance.
   */
  public constructor(
    private readonly abilities: readonly AbilityDisplay[],
    private readonly playerId: EntityId | null,
    private readonly dashReach?: DashReach,
  ) {}

  /**
   * The overlay's target: the ability in the player's `slot` (from `snapshot`) aimed at `aim`
   * from `origin`, where the player's Legend is drawn this frame. `null` (nothing to draw) for no
   * slot, no aim, no origin, no such ability, or a Legend not in the snapshot.
   */
  public targetOf(
    snapshot: Snapshot,
    slot: HudSlotId | null,
    aim: Vec2 | null,
    origin: Vec2 | null,
  ): AimTarget | null {
    const abilityId = snapshot.player?.slots.find((entry) => entry.slot === slot)?.abilityId;
    const ability = this.abilities.find(({ id }) => id === abilityId);
    const radius = snapshot.entities.find(({ id }) => id === this.playerId)?.transform?.radius;
    if (aim === null || origin === null || ability === undefined || radius === undefined) {
      return null;
    }
    const length = Math.hypot(aim.x - origin.x, aim.y - origin.y);
    const direction =
      length === 0
        ? { x: 0, y: 0 }
        : { x: (aim.x - origin.x) / length, y: (aim.y - origin.y) / length };
    const steps = ability.steps.map(({ shape, distance }) => ({
      shape: shape ?? null,
      reach:
        distance === undefined
          ? null
          : (this.dashReach?.(origin, direction, distance, radius) ?? distance),
    }));
    return { origin: { x: origin.x, y: origin.y }, direction, steps };
  }
}
