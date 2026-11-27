import type { EntityId, Snapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import {
  BADGE_EDGE_RGB,
  BADGE_EDGE_WIDTH,
  BADGE_FADE_SECONDS,
  BADGE_FONT,
  BADGE_FONT_WEIGHT,
  BADGE_GOLD_RGB,
  BADGE_GOLD_WIDTH,
  BADGE_HOLD_SECONDS,
  BADGE_LIFETIME_SECONDS,
  BADGE_LIFT,
  BADGE_POP_SCALE,
  BADGE_POP_SECONDS,
  BADGE_RADIUS,
  BADGE_SLOT_OFFSETS,
  BADGE_SPACING,
  BADGE_TEXT_OUTLINE_WIDTH,
  BADGE_TEXT_RGB,
  BADGE_TEXT_SCALE,
  BIG_BADGE_SCALE,
  DAMAGE_BADGE_STYLES,
} from './DamageBadgeLayer.constants';
import type { DamageBadge } from './DamageBadgeLayer.types';
import { lerpPoint } from './lerpPoint';
import type { WorldLayer } from './SceneView.types';

/** `rgb` (`r,g,b`) at opacity `alpha`. */
const rgba = (rgb: string, alpha: number): string => `rgba(${rgb},${String(alpha)})`;

/**
 * The scene's top layer: the damage numbers (W5, DEC-410). Each badge sits on its target's body
 * (interpolated like the entities, 08 §8; where the target last stood once it is gone), in its
 * side-by-side place. It pops in, stays `BADGE_HOLD_SECONDS`, then fades; a bleed drop drips and a
 * flame flickers up as it fades (W5b). With reduced motion on, a badge only appears and fades. A
 * big hit's badge is larger, with a gold rim (W5a). `DamageBadges` decides which badges exist;
 * `Match` injects them, because views read only snapshots.
 */
export class DamageBadgeLayer implements WorldLayer {
  private positions = new Map<EntityId, WorldPoint>();

  private frameTick = 0;

  /**
   * @param badges - The badges to draw (`DamageBadges.badges`).
   * @param isReducedMotion - The Reduce motion setting (UE-03), read each frame.
   * @param tickRate - Ticks per second, to turn ticks into seconds.
   */
  public constructor(
    private readonly badges: () => readonly DamageBadge[],
    private readonly isReducedMotion: () => boolean,
    private readonly tickRate: number,
  ) {}

  /**
   * Sets what the next draw shows: where each target with a badge stands this frame, and the
   * frame's time in ticks.
   *
   * @param previous - The snapshot before `current`, or `null` on the first tick.
   * @param current - The latest snapshot.
   * @param alpha - How far between `previous` and `current` this frame is, in [0, 1).
   */
  public show(previous: Snapshot | null, current: Snapshot, alpha: number): void {
    const targets = new Set(this.badges().map(({ targetId }) => targetId));
    const before = new Map(
      previous?.entities.filter(({ id }) => targets.has(id)).map((e) => [e.id, e.transform]),
    );
    this.positions = new Map(
      current.entities.flatMap(({ id, transform: now }) =>
        targets.has(id) && now !== null
          ? [[id, lerpPoint(before.get(id) ?? now, now, alpha)] as const]
          : [],
      ),
    );
    this.frameTick = current.tick + alpha;
  }

  /** Draws every badge that is still showing, oldest first, so a newer one covers an older one. */
  public draw(renderer: Renderer): void {
    const isStill = this.isReducedMotion();
    for (const badge of this.badges()) {
      const seconds = (this.frameTick - badge.bornTick) / this.tickRate;
      if (seconds >= 0 && seconds < BADGE_LIFETIME_SECONDS) {
        this.drawBadge(renderer, badge, seconds, isStill);
      }
    }
  }

  /** Damage numbers have no minimap marker. */
  public drawMinimap(): void {
    // Nothing: the minimap shows where things are, not what hits them.
  }

  private drawBadge(
    renderer: Renderer,
    badge: DamageBadge,
    seconds: number,
    isStill: boolean,
  ): void {
    const style = DAMAGE_BADGE_STYLES[badge.kind];
    const fade = Math.min(1, Math.max(0, (seconds - BADGE_HOLD_SECONDS) / BADGE_FADE_SECONDS));
    const pop = isStill
      ? 1
      : 1 + (BADGE_POP_SCALE - 1) * Math.max(0, 1 - seconds / BADGE_POP_SECONDS);
    const radius = BADGE_RADIUS * (badge.isBig ? BIG_BADGE_SCALE : 1) * pop;
    const moved = isStill ? { x: 0, y: 0 } : style.motion(fade, seconds);
    const anchor = this.positions.get(badge.targetId) ?? badge.at;
    const centre = {
      x: anchor.x + (BADGE_SLOT_OFFSETS[badge.slot] ?? 0) * BADGE_SPACING + moved.x * radius,
      y: anchor.y - BADGE_LIFT + moved.y * radius,
    };
    const outline = style.outline.map((point) => ({
      x: centre.x + point.x * radius,
      y: centre.y + point.y * radius,
    }));
    const alpha = 1 - fade;
    renderer.fillPolygon(outline, rgba(style.rgb, alpha));
    renderer.strokePath(
      [...outline, ...outline.slice(0, 1)],
      rgba(badge.isBig ? BADGE_GOLD_RGB : BADGE_EDGE_RGB, alpha),
      badge.isBig ? BADGE_GOLD_WIDTH : BADGE_EDGE_WIDTH,
    );
    renderer.drawText(
      badge.text,
      { x: centre.x, y: centre.y + style.textOffsetY * radius },
      {
        font: BADGE_FONT,
        weight: BADGE_FONT_WEIGHT,
        size: BADGE_TEXT_SCALE * radius,
        color: rgba(BADGE_TEXT_RGB, alpha),
        outline: { color: rgba(BADGE_EDGE_RGB, alpha), width: BADGE_TEXT_OUTLINE_WIDTH },
      },
    );
  }
}
