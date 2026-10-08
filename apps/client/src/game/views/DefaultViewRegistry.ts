import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { ViewRegistry } from './ViewRegistry';

/** The registry with every shipped entity view. This is the one place a view is registered. */
export class DefaultViewRegistry extends ViewRegistry {
  /**
   * Creates the registry.
   *
   * @param onUnknownKind - Told once per kind drawn with the default view.
   */
  public constructor(onUnknownKind?: (kind: string) => void) {
    super(new DefaultEntityView(), onUnknownKind);
    this.registerFamily('legend', new LegendView());
  }
}
