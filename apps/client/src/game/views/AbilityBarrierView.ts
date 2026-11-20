import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';
import { DefaultEntityView } from './DefaultEntityView';
import { ABILITY_ART as A } from './AbilityFieldView.constants';

/** Draws temporary shields at their exact blocking outline, retaining the ordinary obstacle fallback. */
export class AbilityBarrierView extends DefaultEntityView {
  /** The visible shape is the simulation's polygon, never an approximate circle. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    if (state.entity.area === null) {
      super.draw(state, renderer);
      return;
    }
    for (const polygon of state.entity.area) {
      const first = polygon[0];
      if (first === undefined) continue;
      renderer.fillPolygon(polygon, A.wallFill);
      renderer.strokePath(
        [...polygon, first],
        state.entity.team === 'dark' ? A.dark : A.light,
        A.coreWidth,
      );
    }
  }
}
