import { CapturePointView } from './CapturePointView';
import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { MinionView } from './MinionView';
import { StructureView } from './StructureView';
import { ViewRegistry } from './ViewRegistry';
import type { EntityView } from './EntityView.types';
import { StaffBoltView } from './StaffBoltView';
import { SpellAreaView } from './SpellAreaView';

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
  registry.registerKind('projectile', new StaffBoltView());
  registry.registerKind('effect-zone', new SpellAreaView(seconds));
  registry.registerFamily('legend', legend ?? new LegendView());
  registry.registerFamily('mob', new MobView());
  registry.registerKind('light-mob', new MinionView('light'));
  registry.registerKind('medium-mob', new MinionView('medium'));
  registry.registerKind('heavy-mob', new MinionView('heavy'));
  registry.registerFamily('structure', new StructureView());
  registry.registerKind('capture-point', new CapturePointView());
  return registry;
};
