import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import { AIRBORNE_SHADOW_COLOR } from './AirborneView.constants';
import type { EntityDrawState, EntityView } from './EntityView.types';

/**
 * Draws a jumping entity (DEC-390): a shadow on the ground at its position, then the wrapped view
 * raised by its height (interpolated by `EntityLayer.show`, like the position), so its health bar
 * rises too. On the ground and on the mini map the wrapped view draws unchanged.
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

  /** Draws the shadow and the raised entity; returns the entity's top above the ground. */
  public draw(state: EntityDrawState, renderer: Renderer): number | undefined {
    const height = state.height ?? 0;
    if (height <= 0) return this.inner.draw(state, renderer);
    const radius = this.visualRadiusOf(state.entity);
    renderer.drawWorldGlyph(
      { shape: 'dot', size: radius * 2 },
      state.position,
      AIRBORNE_SHADOW_COLOR,
    );
    const raised = { x: state.position.x, y: state.position.y - height };
    return (this.inner.draw({ ...state, position: raised }, renderer) ?? radius) + height;
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
