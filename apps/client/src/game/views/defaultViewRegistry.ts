import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { MinionView } from './MinionView';
import { ViewRegistry } from './ViewRegistry';
import type { EntityView } from './EntityView.types';

/**
 * The registry with every shipped entity view (02 §4: `default<Registry>.ts` exporting
 * `createDefault<Registry>()`). The one place a view is registered.
 *
 * @param onUnknownKind - Told once per kind drawn with the default view.
 */
export const createDefaultViewRegistry = (
  onUnknownKind?: (kind: string) => void,
  legendView: EntityView = new LegendView(),
): ViewRegistry => {
  const registry = new ViewRegistry(new DefaultEntityView(), onUnknownKind);
  registry.registerFamily('legend', legendView);
  registry.registerFamily('mob', new MobView());
  registry.registerKind('light-mob', new MinionView('light'));
  registry.registerKind('medium-mob', new MinionView('medium'));
  registry.registerKind('heavy-mob', new MinionView('heavy'));
  return registry;
};
