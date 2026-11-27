import type { Renderer } from '../engine/render/Renderer';
import { colorWithAlpha } from './colorWithAlpha';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  PROJECTILE_CORE_COLOR,
  PROJECTILE_CORE_SIZE,
  PROJECTILE_DOT_SIZE,
  PROJECTILE_DROP_FADE_FROM,
  PROJECTILE_ENDING_LOOKS,
  PROJECTILE_MIST_DOT_COUNT,
  PROJECTILE_MIST_DOT_SIZE,
  PROJECTILE_MIST_END_RADIUS,
  PROJECTILE_MIST_OPACITY,
  PROJECTILE_MIST_START_RADIUS,
  PROJECTILE_SHADOW_COLOR,
  PROJECTILE_SHADOW_HEIGHT,
  PROJECTILE_SHADOW_OPACITY,
  PROJECTILE_SHADOW_SIZE,
  PROJECTILE_STREAK_LENGTH,
  PROJECTILE_STREAK_WIDTH,
} from './ProjectileView.constants';
import type { Point, ProjectileEndingLook } from './ProjectileView.types';

/**
 * The placeholder look for projectiles (arrows, bolts): a small dot in the shooter's team colour
 * with a bright core, and a short streak behind it, opposite its facing. A shot that drops (an
 * arrow) also has a shadow dot below it that closes in as it slows. When a shot ends (DEC-306), a
 * bolt thins into a mist that grows and fades, and an arrow lies still on its shadow, then fades.
 * The look of each id is in `PROJECTILE_ENDING_LOOKS`. It has no mini map marker. Final projectile
 * art replaces it.
 */
export class ProjectileView extends DefaultEntityView {
  /** The ways a shot looks while it ends. */
  private readonly endings: Readonly<
    Record<
      ProjectileEndingLook,
      (state: EntityDrawState, ending: number, renderer: Renderer) => void
    >
  > = {
    fizzle: (state, ending, renderer) => {
      this.drawMist(state, ending, renderer);
    },
    drop: (state, ending, renderer) => {
      this.drawLanded(state, ending, renderer);
    },
  };

  /** Draws the flying shot, or its ending look once it has ended. */
  public override draw(state: EntityDrawState, renderer: Renderer): undefined {
    const ending = state.entity.projectile?.ending ?? null;
    if (ending !== null) {
      this.endings[this.lookOf(state)](state, ending, renderer);
      return;
    }
    if (this.lookOf(state) === 'drop') {
      this.drawShadow(state, 1, renderer);
    }
    this.drawShot(state, this.colorOf(state.entity.team), renderer);
  }

  /** The shot's ending look; throws for an id with none, which the content check rules out. */
  private lookOf({ entity }: EntityDrawState): ProjectileEndingLook {
    const look = PROJECTILE_ENDING_LOOKS[entity.definitionId];
    if (look === undefined) {
      throw new Error(`Projectile "${entity.definitionId}" has no ending look.`);
    }
    return look;
  }

  /** The streak, then the dot and its core on top. */
  private drawShot({ position, facing }: EntityDrawState, color: string, renderer: Renderer): void {
    renderer.strokePath([this.behind(position, facing), position], color, PROJECTILE_STREAK_WIDTH);
    renderer.drawWorldGlyph({ shape: 'dot', size: PROJECTILE_DOT_SIZE }, position, color);
    renderer.drawWorldGlyph(
      { shape: 'dot', size: PROJECTILE_CORE_SIZE },
      position,
      PROJECTILE_CORE_COLOR,
    );
  }

  /** The shadow under a dropping shot, nearer to it the slower the shot, scaled by `fade`. */
  private drawShadow(
    { entity, position }: EntityDrawState,
    fade: number,
    renderer: Renderer,
  ): void {
    const speedShare = entity.projectile?.speedShare ?? 1;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: PROJECTILE_SHADOW_SIZE },
      { x: position.x, y: position.y + PROJECTILE_SHADOW_HEIGHT * speedShare },
      colorWithAlpha(PROJECTILE_SHADOW_COLOR, PROJECTILE_SHADOW_OPACITY * fade),
    );
  }

  /** A ring of translucent team-coloured dots that spread and fade as `ending` goes to 1. */
  private drawMist(
    { entity, position }: EntityDrawState,
    ending: number,
    renderer: Renderer,
  ): void {
    const radius =
      PROJECTILE_MIST_START_RADIUS +
      (PROJECTILE_MIST_END_RADIUS - PROJECTILE_MIST_START_RADIUS) * ending;
    const color = colorWithAlpha(this.colorOf(entity.team), PROJECTILE_MIST_OPACITY * (1 - ending));
    for (let dot = 0; dot < PROJECTILE_MIST_DOT_COUNT; dot += 1) {
      const angle = (dot / PROJECTILE_MIST_DOT_COUNT) * 2 * Math.PI;
      renderer.drawWorldGlyph(
        { shape: 'dot', size: PROJECTILE_MIST_DOT_SIZE },
        { x: position.x + Math.cos(angle) * radius, y: position.y + Math.sin(angle) * radius },
        color,
      );
    }
  }

  /** The shot lying still on its shadow, fading over the last part of its ending. */
  private drawLanded(state: EntityDrawState, ending: number, renderer: Renderer): void {
    const fade =
      ending <= PROJECTILE_DROP_FADE_FROM
        ? 1
        : 1 - (ending - PROJECTILE_DROP_FADE_FROM) / (1 - PROJECTILE_DROP_FADE_FROM);
    this.drawShadow(state, fade, renderer);
    renderer.strokePath(
      [this.behind(state.position, state.facing), state.position],
      colorWithAlpha(this.colorOf(state.entity.team), fade),
      PROJECTILE_STREAK_WIDTH,
    );
  }

  /** The tail of the streak: `PROJECTILE_STREAK_LENGTH` behind `position`, opposite `facing`. */
  private behind(position: Point, facing: Point): Point {
    return {
      x: position.x - facing.x * PROJECTILE_STREAK_LENGTH,
      y: position.y - facing.y * PROJECTILE_STREAK_LENGTH,
    };
  }
}
