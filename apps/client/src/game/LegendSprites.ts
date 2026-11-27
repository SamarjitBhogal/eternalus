import {
  type EntityId,
  type EntitySnapshot,
  makeLogRecord,
  type Snapshot,
  type Unsubscribe,
} from '@eternalus/core';

import type { SpriteRef } from './engine/render/Renderer.types';
import { LegendAnimation } from './LegendAnimation';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';
import type { LegendSpritesDeps } from './LegendSprites.types';
import type { EntityView } from './views/EntityView.types';
import { LegendSpriteView } from './views/LegendSpriteView';
import type { LegendSpriteSize, LegendSpriteSource } from './views/LegendSpriteView.types';

/**
 * The sprites of every Legend in one match (DEC-378 (2): every Legend gets its sprite). Each
 * Legend's snapshot names its sub-class (`EntitySnapshot.specId`), which picks its sheet. It owns
 * each Legend's `LegendAnimation` by entity id, the one `damage-applied` listener that starts
 * their attack rows, and the Legend view, to which it answers each Legend's sprite size and frame.
 * The view gets the frame time with its draw state (DEC-398, card PR170 (12)). A Legend without a
 * sub-class, without a sheet, or whose atlas did not load is drawn as the ordinary disc; the
 * others still get their sprites. `Match` gives it each tick's snapshot and destroys it with the
 * match.
 */
export class LegendSprites implements LegendSpriteSource {
  /**
   * The Legend family's view for the view registry: a `LegendSpriteView` when the renderer holds
   * the atlas of at least one sheet; else `undefined`, and the registry keeps its ordinary Legend
   * view.
   */
  public readonly view: EntityView | undefined;

  /** The sheets whose atlas the renderer holds, by sub-class id. */
  private readonly loaded = new Map<string, LegendSpriteSheet>();

  /** Each Legend's animation by entity id, made the first time the Legend is seen. */
  private readonly animations = new Map<EntityId, LegendAnimation>();

  private readonly unsubscribe: Unsubscribe;

  private readonly tickRate: number;

  private readonly renderer: LegendSpritesDeps['renderer'];

  /** Each class's sprite width by class id (DEC-424). */
  private readonly widths: Readonly<Record<string, number>>;

  /**
   * Keeps each sheet of `legendSheets` whose atlas the renderer holds, and logs one WARN for each
   * sheet whose atlas did not load (the resource controller has already warned about the file);
   * the match still starts. With no loaded sheet, nothing is subscribed and `view` is `undefined`.
   */
  public constructor(deps: LegendSpritesDeps) {
    const {
      legendSheets = new Map<string, LegendSpriteSheet>(),
      legendSpriteWidths = {},
      tickRate,
      simulation,
      renderer,
      logger,
    } = deps;
    this.tickRate = tickRate;
    this.renderer = renderer;
    this.widths = legendSpriteWidths;
    for (const [specId, sheet] of legendSheets) {
      if (renderer.hasSprite({ atlasId: sheet.atlasId, frame: 0 })) {
        this.loaded.set(specId, sheet);
      } else {
        logger.log(
          makeLogRecord(
            'WARN',
            'client.views',
            'The sprite atlas is not loaded; drawing the disc.',
            {
              attributes: { atlasId: sheet.atlasId },
            },
          ),
        );
      }
    }
    if (this.loaded.size === 0) {
      this.view = undefined;
      this.unsubscribe = () => undefined;
      return;
    }
    this.view = new LegendSpriteView(this);
    // One listener for every Legend: a weapon hit starts the attacker's attack row.
    this.unsubscribe = simulation.on('damage-applied', ({ source }) => {
      if (source.kind === 'weapon' && source.attackerId !== null) {
        this.animations.get(source.attackerId)?.attackStarted(simulation.tick);
      }
    });
  }

  /**
   * Follows each Legend with a sprite to this tick's snapshot (walk row, facing). Each animation
   * keeps its Legend's last place and tick, so no earlier snapshot is needed.
   */
  public observe(current: Snapshot): void {
    for (const entity of current.entities) {
      const sheet = this.sheetOf(entity);
      if (sheet !== undefined) {
        this.animationOf(entity, sheet).observe(entity, current.tick);
      }
    }
  }

  /** Releases the event subscription with the match. */
  public destroy(): void {
    this.unsubscribe();
  }

  /**
   * The sprite size of a Legend with a loaded sheet: its class's width (DEC-424) and the top that
   * the renderer measures from the sheet's data; `null` (the disc) without a sheet or a width.
   */
  public sizeOf(entity: EntitySnapshot): LegendSpriteSize | null {
    const sheet = this.sheetOf(entity);
    const width = this.widths[entity.definitionId];
    if (sheet === undefined || width === undefined) {
      return null;
    }
    const top = this.renderer.spriteTop({ atlasId: sheet.atlasId, frame: 0 }, width);
    return top === null ? null : { width, top };
  }

  /** The frame `entity` draws at `frameTick`, or `null` for the disc (no loaded sheet, or dead). */
  public frameOf(entity: EntitySnapshot, frameTick: number): SpriteRef | null {
    const sheet = this.sheetOf(entity);
    return sheet === undefined ? null : this.animationOf(entity, sheet).frame(entity, frameTick);
  }

  /** The loaded sheet of a Legend's sub-class, or `undefined` for any other entity. */
  private sheetOf(entity: EntitySnapshot): LegendSpriteSheet | undefined {
    return entity.family === 'legend' && entity.specId !== undefined
      ? this.loaded.get(entity.specId)
      : undefined;
  }

  /** The Legend's animation, made on first sight. */
  private animationOf(entity: EntitySnapshot, sheet: LegendSpriteSheet): LegendAnimation {
    const known = this.animations.get(entity.id);
    if (known !== undefined) {
      return known;
    }
    // ponytail: every Legend gets a full sprite (DEC-378 (1), (2)). Ceiling: about 20 sprite draws
    // a frame (`legendsPerTeam` for each of the two teams, core `config/defaultGameConfig.ts`)
    // and up to 8 sheets in memory (the eight `LEGEND_SPRITE_SHEETS`). Upgrade path, only if
    // in-game performance drops: the player keeps full fidelity and the bots drop a little
    // (DEC-378 (2)); for example, the bots draw at 1x or at a lower frame rate.
    const animation = new LegendAnimation(sheet.atlasId, this.tickRate);
    this.animations.set(entity.id, animation);
    return animation;
  }
}
