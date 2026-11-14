import type { AbilityDisplay, EntityId, Snapshot, Vec2 } from '@eternalus/core';

import type { HudSlotId } from '../../bridge/Binding.types';
import type { Renderer } from '../engine/render/Renderer';
import { AIM_SHAPE_PAINTERS } from './aimShapePainters';
import type { AimFrame, DashReach, ShapePainters } from './AimOverlayView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * The range overlay of an ability selected for aiming (DEC-209 (3)): the area of each of its
 * effect steps, read from the display data, drawn in the world around the player's Legend. A
 * caster-centred ability shows a circle on the caster whatever the pointer does; a dash shows its
 * path from the caster toward the pointer, as far as the dash will really go (a wall stops it), and the circles of the steps that run at its end. It
 * draws nothing while no slot is selected (always the case in quick-cast mode), while the player's
 * Legend is not in the snapshot, or for a slot with no ability. Each shape kind is one painter
 * (`AIM_SHAPE_PAINTERS`).
 */
export class AimOverlayView implements WorldLayer {
  private target: {
    readonly origin: Vec2;
    readonly aim: Vec2;
    readonly ability: AbilityDisplay;
  } | null = null;

  /**
   * @param abilities Every ability's display data (`DisplayCatalogue.abilities`).
   * @param playerId The player's Legend, or `null` when it has none.
   * @param reach How far a dash may go before a wall stops it (the simulation's query).
   * @param painters How each shape kind is drawn.
   */
  public constructor(
    private readonly abilities: readonly AbilityDisplay[],
    private readonly playerId: EntityId | null,
    private readonly reach: DashReach,
    private readonly painters: ShapePainters = AIM_SHAPE_PAINTERS,
  ) {}

  /**
   * Sets what the next `draw` shows: the ability in the player's `slot` (from the snapshot's slots)
   * aimed at `aim`. `null` for either, or no such ability, shows nothing.
   */
  public show(snapshot: Snapshot, slot: HudSlotId | null, aim: Vec2 | null): void {
    const origin = snapshot.entities.find(({ id }) => id === this.playerId)?.transform ?? null;
    const abilityId = snapshot.player?.slots.find((entry) => entry.slot === slot)?.abilityId;
    const ability = this.abilities.find(({ id }) => id === abilityId);
    this.target =
      aim === null || origin === null || ability === undefined
        ? null
        : { origin: { x: origin.x, y: origin.y }, aim, ability };
  }

  /** Draws the selected ability's areas, each distinct one once, in cast order. */
  public draw(renderer: Renderer): void {
    if (this.target === null) return;
    const { origin, aim, ability } = this.target;
    const length = Math.hypot(aim.x - origin.x, aim.y - origin.y);
    const direction =
      length === 0
        ? { x: 0, y: 0 }
        : { x: (aim.x - origin.x) / length, y: (aim.y - origin.y) / length };
    let frame: AimFrame = { origin, direction, circleCentre: origin, pathLength: null };
    const drawn = new Set<string>();
    for (const { shape, distance } of ability.steps) {
      if (distance !== undefined) {
        const reached = this.reach(origin, direction, distance);
        frame = {
          ...frame,
          pathLength: reached,
          circleCentre: {
            x: origin.x + direction.x * reached,
            y: origin.y + direction.y * reached,
          },
        };
      }
      const key = `${JSON.stringify(shape)}@${String(frame.circleCentre.x)},${String(frame.circleCentre.y)}`;
      if (!drawn.has(key)) {
        drawn.add(key);
        const paint = this.painters[shape.kind] as (
          s: typeof shape,
          f: AimFrame,
          r: Renderer,
        ) => void;
        paint(shape, frame, renderer);
      }
    }
  }

  /** The overlay is not on the minimap. */
  public drawMinimap(): void {
    // Nothing to draw: an aim is only meaningful in the main view.
  }
}
