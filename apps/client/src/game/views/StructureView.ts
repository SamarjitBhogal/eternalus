import type { EntityView } from './EntityView.types';

/**
 * The structures' view: draws nothing, because `MapView` already paints every building from the
 * map's features. Health bars and destroyed looks arrive with the structure views (Phase 2 sprint
 * 2.8); registering it keeps structures off the default disc and its warning.
 */
export class StructureView implements EntityView {
  /** Draws nothing; the map layer shows the building. */
  public draw(): void {
    // ponytail: the map draws structures until sprint 2.8 gives them health bars.
  }
}
