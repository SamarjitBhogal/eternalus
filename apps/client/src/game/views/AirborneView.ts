import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import { AIRBORNE_SHADOW_COLOR } from './AirborneView.constants';
import type { EntityDrawState, EntityView } from './EntityView.types';

/**
 * Draws a jumping entity (DEC-390): a shadow on the ground at its position, then the wrapped view
 * raised by its height (interpolated by `EntityLayer.show`, like the position). Its health bar top
 * (`visualTopOf`) rises by the same height. On the ground and on the mini map the wrapped view
 * draws unchanged.
 */
export class AirborneView implements EntityView {
  private readonly inner: EntityView;

  /** `inner` draws the entity; this view only adds the shadow and the lift. */
  public constructor(inner: EntityView) {
    this.inner = inner;
  }

  /** The wrapped view's mini map layer (0 when it has none). */
  public get minimapLayer(): number {
    return this.inner.minimapLayer ?? 0;
  }

  /** Draws the shadow and the raised entity. */
  public draw(state: EntityDrawState, renderer: Renderer): void {
    const height = state.height ?? 0;
    if (height <= 0) {
      this.inner.draw(state, renderer);
      return;
    }
    renderer.drawWorldGlyph(
      { shape: 'dot', size: this.visualRadiusOf(state.entity) * 2 },
      state.position,
      AIRBORNE_SHADOW_COLOR,
    );
    const raised = { x: state.position.x, y: state.position.y - height };
    this.inner.draw({ ...state, position: raised }, renderer);
  }

  /** The wrapped view's top, else the artwork radius, raised by the frame's jump height. */
  public visualTopOf(state: EntityDrawState): number {
    const top = this.inner.visualTopOf?.(state) ?? this.visualRadiusOf(state.entity);
    return top + Math.max(state.height ?? 0, 0);
  }

  /** Draws the wrapped view's marker at the ground position. */
  public drawMinimap(state: EntityDrawState, renderer: Renderer): void {
    this.inner.drawMinimap(state, renderer);
  }

  /** The wrapped view's artwork radius, else the entity's own radius. */
  public visualRadiusOf(entity: EntitySnapshot): number {
    return this.inner.visualRadiusOf?.(entity) ?? entity.transform?.radius ?? 0;
  }
}
