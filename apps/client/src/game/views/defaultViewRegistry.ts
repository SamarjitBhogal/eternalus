import { CapturePointView } from './CapturePointView';
import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { StructureView } from './StructureView';
import { ViewRegistry } from './ViewRegistry';
import type { EntityView } from './EntityView.types';
import { AbilityFieldView } from './AbilityFieldView';
import { AbilityBarrierView } from './AbilityBarrierView';
import { BladeView } from './BladeView';

/**
 * The registry with every shipped entity view (02 §4: `default<Registry>.ts` exporting
 * `createDefault<Registry>()`). The one place a view is registered.
 *
 * @param onUnknownKind - Told once per kind drawn with the default view.
 */
export const createDefaultViewRegistry = (
  onUnknownKind?: (kind: string) => void,
  legend?: EntityView,
  seconds: () => number = () => 0,
): ViewRegistry => {
  const registry = new ViewRegistry(new DefaultEntityView(), onUnknownKind);
  registry.registerFamily('legend', new LegendView());
  for (const kind of ['warrior', 'sentinel', 'magus']) {
    if (legend !== undefined) registry.registerKind(kind, legend);
  }
  registry.registerFamily('mob', new MobView());
  registry.registerFamily('structure', new StructureView());
  registry.registerKind('capture-point', new CapturePointView());
  registry.registerKind('ability-field', new AbilityFieldView(seconds));
  registry.registerKind('obstacle', new AbilityBarrierView());
  registry.registerKind('projectile', new BladeView());
  return registry;
};
