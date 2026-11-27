import type { Renderer } from '../engine/render/Renderer';
import { colorWithAlpha } from './colorWithAlpha';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import { ellipsePoints } from './ellipsePoints';
import {
  PROJECTILE_ARC_LAUNCH_HEIGHT,
  PROJECTILE_ARC_LAUNCH_HEIGHTS,
  PROJECTILE_ARC_REFERENCE_RANGE,
  PROJECTILE_ARC_RISE,
  PROJECTILE_ARC_SHADOW_OPACITY_END,
  PROJECTILE_ARC_SHADOW_OPACITY_START,
  PROJECTILE_ARC_SHADOW_RADIUS_X,
  PROJECTILE_ARC_SHADOW_RADIUS_Y,
  PROJECTILE_ARC_SHADOW_SEGMENTS,
  PROJECTILE_BODY_LOOKS,
  PROJECTILE_BURST_OPACITY,
  PROJECTILE_BURST_SEGMENTS,
  PROJECTILE_ORB_BODY_SIZE,
  PROJECTILE_CORE_COLOR,
  PROJECTILE_CORE_SIZE,
  PROJECTILE_DOT_SIZE,
  PROJECTILE_DROP_FADE_FROM,
  PROJECTILE_ENDING_LOOKS,
  PROJECTILE_LIT_COLOR,
  PROJECTILE_MIST_DOT_COUNT,
  PROJECTILE_MIST_DOT_SIZE,
  PROJECTILE_MIST_END_RADIUS,
  PROJECTILE_MIST_OPACITY,
  PROJECTILE_MIST_START_RADIUS,
  PROJECTILE_SHADOW_COLOR,
  PROJECTILE_SHADOW_OPACITY,
  PROJECTILE_SHADOW_SIZE,
  PROJECTILE_STREAK_LENGTH,
  PROJECTILE_STREAK_WIDTH,
} from './ProjectileView.constants';
import type { Point, ProjectileBodyLook, ProjectileEndingLook } from './ProjectileView.types';

/**
 * The placeholder look for projectiles (arrows, bolts): a small dot in the shooter's team colour
 * with a bright core, and a short streak behind it, opposite its facing. A shot that drops (an
 * arrow) flies an artificial arc (DEC-322 (2)): its shadow dot below it drops away to mid-flight,
 * then closes in and meets it at the end of its range. A lit shot (it flew over lava and burns what
 * it lands on, HC-Q89, DEC-345) is drawn in `PROJECTILE_LIT_COLOR`. When a shot ends (DEC-306), a
 * bolt thins into a mist that grows and fades, and an arrow lies still on its shadow, then fades.
 * A shot whose id is in `PROJECTILE_BODY_LOOKS` as an orb draws a team-coloured circle in place of
 * the dot and streak. The ending look of each id is in `PROJECTILE_ENDING_LOOKS`, the body look in
 * `PROJECTILE_BODY_LOOKS`. It has no mini map marker. Final projectile art replaces it.
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
    lodge: (state, ending, renderer) => {
      this.drawLodged(state, ending, renderer);
    },
    burst: (state, ending, renderer) => {
      this.drawBurst(state, ending, renderer);
    },
  };

  /** The ways a flying shot looks. */
  private readonly bodies: Readonly<
    Record<ProjectileBodyLook, (state: EntityDrawState, color: string, renderer: Renderer) => void>
  > = {
    streak: (state, color, renderer) => {
      this.drawShot(state, color, renderer);
    },
    orb: (state, color, renderer) => {
      this.drawOrb(state, color, renderer);
    },
  };

  /** Draws the flying shot, or its ending look once it has ended. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const ending = state.entity.projectile?.ending ?? null;
    if (ending !== null) {
      this.endings[this.lookOf(state)](state, ending, renderer);
      return;
    }
    if (state.entity.projectile?.isArc === true) {
      this.drawArcShadow(state, renderer);
    } else if (this.lookOf(state) === 'drop') {
      this.drawShadow(state, 1, renderer);
    }
    const color =
      state.entity.projectile?.isLit === true
        ? PROJECTILE_LIT_COLOR
        : this.colorOf(state.entity.team);
    this.bodies[this.bodyLookOf(state)](state, color, renderer);
  }

  /** The shot's body look; an id with no entry in `PROJECTILE_BODY_LOOKS` is a streak. */
  private bodyLookOf({ entity }: EntityDrawState): ProjectileBodyLook {
    return PROJECTILE_BODY_LOOKS[entity.definitionId] ?? 'streak';
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

  /** The orb: a circle in its team's colour (`PROJECTILE_ORB_BODY_SIZE`). */
  private drawOrb({ position }: EntityDrawState, color: string, renderer: Renderer): void {
    renderer.drawWorldGlyph({ shape: 'dot', size: PROJECTILE_ORB_BODY_SIZE }, position, color);
  }

  /**
   * The oval shadow under an arc shot, `arcHeight` below it, from `PROJECTILE_ARC_SHADOW_OPACITY_START`
   * at launch to `PROJECTILE_ARC_SHADOW_OPACITY_END` at its mark (linear in the share flown).
   */
  private drawArcShadow({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const flown = entity.projectile?.flownShare ?? 0;
    const opacity =
      PROJECTILE_ARC_SHADOW_OPACITY_START +
      (PROJECTILE_ARC_SHADOW_OPACITY_END - PROJECTILE_ARC_SHADOW_OPACITY_START) * flown;
    this.fillOval(
      { x: position.x, y: position.y + this.arcHeight(entity, flown) },
      opacity,
      renderer,
    );
  }

  /** Fills the shadow oval around `centre` with `PROJECTILE_SHADOW_COLOR` at `opacity`. */
  private fillOval(centre: Point, opacity: number, renderer: Renderer): void {
    renderer.fillPolygon(
      ellipsePoints(
        centre,
        PROJECTILE_ARC_SHADOW_RADIUS_X,
        PROJECTILE_ARC_SHADOW_RADIUS_Y,
        PROJECTILE_ARC_SHADOW_SEGMENTS,
      ),
      colorWithAlpha(PROJECTILE_SHADOW_COLOR, opacity),
    );
  }

  /** The shadow under a dropping shot, as far below it as its arc is high; scaled by `fade`. */
  private drawShadow(
    { entity, position }: EntityDrawState,
    fade: number,
    renderer: Renderer,
  ): void {
    renderer.drawWorldGlyph(
      { shape: 'dot', size: PROJECTILE_SHADOW_SIZE },
      { x: position.x, y: position.y + this.arcHeight(entity, entity.projectile?.flownShare ?? 0) },
      colorWithAlpha(PROJECTILE_SHADOW_COLOR, PROJECTILE_SHADOW_OPACITY * fade),
    );
  }

  /**
   * How high a shot is after flying `flown` (0 to 1) of its range: a straight drop from the launch
   * height to the ground at the end, plus a parabola that is 0 at both ends and the rise at
   * mid-flight (`4 * flown * (1 - flown)` peaks at 1 there). An arrow rises by
   * `PROJECTILE_ARC_RISE`. An arc shot starts at the launch height of its id and rises by
   * `PROJECTILE_ARC_RISE x min(1, range / PROJECTILE_ARC_REFERENCE_RANGE)`, so a nearer shot arcs
   * less (DEC-341 (4)).
   */
  private arcHeight(entity: EntityDrawState['entity'], flown: number): number {
    const left = 1 - flown;
    const { projectile } = entity;
    const isArc = projectile?.isArc === true;
    const launch = isArc
      ? (PROJECTILE_ARC_LAUNCH_HEIGHTS[entity.definitionId] ?? PROJECTILE_ARC_LAUNCH_HEIGHT)
      : PROJECTILE_ARC_LAUNCH_HEIGHT;
    const reach = isArc ? Math.min(1, projectile.range / PROJECTILE_ARC_REFERENCE_RANGE) : 1;
    return launch * left + PROJECTILE_ARC_RISE * reach * 4 * flown * left;
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
    const fade = this.fadeOf(ending);
    this.drawShadow(state, fade, renderer);
    renderer.strokePath(
      [this.behind(state.position, state.facing), state.position],
      colorWithAlpha(this.colorOf(state.entity.team), fade),
      PROJECTILE_STREAK_WIDTH,
    );
  }

  /** The bolt lying still on its mark, with its shadow solid under it, fading at the end. */
  private drawLodged(
    { entity, position, facing }: EntityDrawState,
    ending: number,
    renderer: Renderer,
  ): void {
    const fade = this.fadeOf(ending);
    this.fillOval(position, PROJECTILE_ARC_SHADOW_OPACITY_END * fade, renderer);
    renderer.strokePath(
      [this.behind(position, facing), position],
      colorWithAlpha(this.colorOf(entity.team), fade),
      PROJECTILE_STREAK_WIDTH,
    );
  }

  /**
   * A circle that grows to the shot's blast radius (`ProjectileSnapshot.blastRadius`) and fades as
   * `ending` goes to 1; a shot with no blast draws no circle.
   */
  private drawBurst(
    { entity, position }: EntityDrawState,
    ending: number,
    renderer: Renderer,
  ): void {
    const blastRadius = entity.projectile?.blastRadius ?? null;
    if (blastRadius === null) {
      return;
    }
    const radius = blastRadius * ending;
    renderer.fillPolygon(
      ellipsePoints(position, radius, radius, PROJECTILE_BURST_SEGMENTS),
      colorWithAlpha(this.colorOf(entity.team), PROJECTILE_BURST_OPACITY * (1 - ending)),
    );
  }

  /** 1 until `PROJECTILE_DROP_FADE_FROM` of the ending, then down to 0 at its end. */
  private fadeOf(ending: number): number {
    return ending <= PROJECTILE_DROP_FADE_FROM
      ? 1
      : 1 - (ending - PROJECTILE_DROP_FADE_FROM) / (1 - PROJECTILE_DROP_FADE_FROM);
  }

  /** The tail of the streak: `PROJECTILE_STREAK_LENGTH` behind `position`, opposite `facing`. */
  private behind(position: Point, facing: Point): Point {
    return {
      x: position.x - facing.x * PROJECTILE_STREAK_LENGTH,
      y: position.y - facing.y * PROJECTILE_STREAK_LENGTH,
    };
  }
}
