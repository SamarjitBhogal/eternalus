import type { Renderer } from '../engine/render/Renderer';
import { COLOSSUS_SPRITE } from './ColossusView.constants';
import type { EntityDrawState } from './EntityView.types';
import { MobView } from './MobView';

/** Draws the Cathedral boss with the obsidian colossus artwork. */
export class ColossusView extends MobView {
  /** Gets decoded assets from the resource controller without managing their lifetime. */
  public constructor(private readonly image: (id: string) => HTMLImageElement | undefined) {
    super();
  }

  /** Selects an animation frame from the simulation tick and draws any active beam. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const { entity, position, facing, tick = 0 } = state;
    const cast = entity.bossCast;
    const frame = this.frameOf(state, tick);
    const image = this.image(`colossus-${frame.id}`) ?? this.image('colossus-idle');
    const size = COLOSSUS_SPRITE.worldWidth;
    const flipX = facing.x > 0;
    if (image === undefined || entity.transform === null) {
      super.draw(state, renderer);
    } else {
      const { frame: cell, columns } = COLOSSUS_SPRITE;
      const isIdle = image === this.image('colossus-idle');
      const width = isIdle ? image.naturalWidth : cell;
      const height = isIdle ? image.naturalHeight : cell;
      renderer.drawSprite(
        image,
        {
          x: isIdle ? 0 : (frame.index % columns) * cell,
          y: isIdle ? 0 : Math.floor(frame.index / columns) * cell,
          width,
          height,
        },
        {
          x: position.x - size / 2,
          y: position.y - size * (isIdle ? 0.5 : 0.65),
          width: size,
          height: (size * height) / width,
        },
        flipX,
      );
    }
    if (cast?.id === 'void-sweep' && tick < cast.recover) {
      const visor = {
        x: position.x + size * (flipX ? 1 : -1) * (frame.index === 3 ? 0.23 : 0.14),
        y: position.y - size * (frame.index === 3 ? 0.2 : 0.1),
      };
      const end = {
        x: position.x + Math.cos(cast.angle) * cast.range,
        y: position.y + Math.sin(cast.angle) * cast.range,
      };
      const side = { x: -Math.sin(cast.angle) * cast.width, y: Math.cos(cast.angle) * cast.width };
      renderer.fillPolygon(
        [
          { x: position.x + side.x, y: position.y + side.y },
          { x: end.x + side.x, y: end.y + side.y },
          { x: end.x - side.x, y: end.y - side.y },
          { x: position.x - side.x, y: position.y - side.y },
        ],
        tick < cast.fire ? 'rgba(150, 48, 233, 0.17)' : 'rgba(150, 48, 233, 0.4)',
      );
      if (tick < cast.fire) {
        renderer.strokePath([visor, end], 'rgba(183, 71, 255, 0.55)', 2);
      } else {
        renderer.strokePath([visor, end], 'rgba(147, 49, 255, 0.4)', 20);
        renderer.strokePath([visor, end], '#b845ff', 9);
        renderer.strokePath([visor, end], '#fbe4ff', 3);
      }
    }
  }

  private frameOf(state: EntityDrawState, tick: number): { id: string; index: number } {
    const { frames, moveFrameTicks, meleeFrameTicks } = COLOSSUS_SPRITE;
    const cast = state.entity.bossCast;
    if (cast !== undefined) {
      const index =
        tick < cast.fire
          ? Math.floor((Math.max(0, tick - cast.start) * 3) / (cast.fire - cast.start))
          : tick < cast.recover
            ? 3 + Math.floor(((tick - cast.fire) * 2) / (cast.recover - cast.fire))
            : 5;
      return { id: cast.id, index };
    }
    const elapsed = tick - (state.entity.bossAttackTick ?? Number.NEGATIVE_INFINITY);
    if (elapsed >= 0 && elapsed < frames * meleeFrameTicks) {
      return { id: 'melee', index: Math.floor(elapsed / meleeFrameTicks) };
    }
    return state.isMoving === true
      ? { id: 'move', index: Math.floor(Math.max(0, tick) / moveFrameTicks) % frames }
      : { id: 'idle', index: 0 };
  }
}
