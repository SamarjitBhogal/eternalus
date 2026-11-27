import type { EntityView } from './EntityView.types';
import { CapturePointView } from './CapturePointView';
import { CathedralGemView } from './CathedralGemView';
import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { MinionView } from './MinionView';
import { StructureView } from './StructureView';
import { ViewRegistry } from './ViewRegistry';

/**
 * The registry with every shipped entity view (02 §4: `default<Registry>.ts` exporting
 * `createDefault<Registry>()`). The one place a view is registered.
 *
 * @param onUnknownKind - Told once per kind drawn with the default view.
 */
export const createDefaultViewRegistry = (
  onUnknownKind?: (kind: string) => void,
  legend?: EntityView,
): ViewRegistry => {
  const registry = new ViewRegistry(new DefaultEntityView(), onUnknownKind);
  registry.registerFamily('legend', legend ?? new LegendView());
  registry.registerFamily('mob', new MobView());
  registry.registerKind('light-mob', new MinionView('light'));
  registry.registerKind('medium-mob', new MinionView('medium'));
  registry.registerKind('heavy-mob', new MinionView('heavy'));
  registry.registerFamily('structure', new StructureView());
  registry.registerKind('capture-point', new CapturePointView());
  registry.registerKind('cathedral-gem', new CathedralGemView());
  return registry;
};
