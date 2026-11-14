import type { EntitySnapshot } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { SpriteRef } from '../engine/render/Renderer.types';
import { LegendView } from './LegendView';
import type { EntityDrawState } from './EntityView.types';
import { drawLegendCast } from './drawLegendCast';
import { drawCombatCast } from './drawCombatCast';
import type { LegendCastFrame } from '../LegendAnimation.types';
import { COMBAT_SPELL_PALETTES } from './combatSpellPalettes';

/** Draws the selected Legend atlas while preserving the fallback and minimap contract. */
export class LegendSpriteView extends LegendView {
  /** Receives presentation frames and a world size; no asset URLs or simulation access. */
  public constructor(
    private readonly frameOf: (entity: EntitySnapshot) => SpriteRef | null,
    private readonly size: number,
    private readonly effectsOf: () => readonly LegendCastFrame[] = () => [],
  ) {
    super();
  }
  /** Keeps allegiance visible beneath the sprite, even when subclass artwork has similar colours. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const frame = this.frameOf(state.entity);
    if (frame === null) {
      super.draw(state, renderer);
      return;
    }
    renderer.drawWorldGlyph(
      { shape: 'ring', size: this.size * 0.55 },
      state.position,
      state.entity.team === 'dark' ? '#bc7cff' : '#76e5ff',
    );
    drawLegendCast(frame, state.position, this.size, renderer);
    const effects = this.effectsOf();
    for (const effect of effects) drawCombatCast(effect, state.position, this.size, renderer);
    const current = effects.at(-1);
    const isMeteor =
      current?.row === 9 && COMBAT_SPELL_PALETTES[current.atlasId]?.isSentinel === true;
    const lift =
      isMeteor && current.progress < 0.4
        ? Math.sin((current.progress / 0.4) * Math.PI) * this.size * 0.65
        : 0;
    // Repacked combat cells share a 119/128 ground baseline; Magus retains its own layout.
    const groundOffset = COMBAT_SPELL_PALETTES[frame.atlasId] === undefined ? 0.35 : 9 / 128;
    if (
      !renderer.drawSprite(
        frame,
        { x: state.position.x, y: state.position.y + this.size * groundOffset - lift },
        this.size,
      )
    )
      super.draw(state, renderer);
  }
}
