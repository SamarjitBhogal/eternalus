import type { EntityView } from './EntityView.types';
import { CapturePointView } from './CapturePointView';
import { CathedralGemView } from './CathedralGemView';
import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
import { MinionView } from './MinionView';
import { ProjectileView } from './ProjectileView';
import { StructureView } from './StructureView';
import { ViewRegistry } from './ViewRegistry';

/**
 * The registry with every shipped entity view (02 §4: `default<Registry>.ts` exporting
 * `createDefault<Registry>()`). The one place a view is registered. Obstacles use the default
 * view on purpose: it draws a body's outline (a placed Shield Wall); map objects are scenery.
 *
 * @param onUnknownKind - Told once per kind drawn with the default view.
 * @param legend - The view for Legends, in place of the default `LegendView` (the sprite view).
 */
export const createDefaultViewRegistry = (
  onUnknownKind?: (kind: string) => void,
  legend?: EntityView,
): ViewRegistry => {
  const defaultView = new DefaultEntityView();
  const registry = new ViewRegistry(defaultView, onUnknownKind);
  registry.registerFamily('obstacle', defaultView);
  registry.registerFamily('legend', legend ?? new LegendView());
  registry.registerFamily('mob', new MobView());
  registry.registerKind('light-mob', new MinionView('light'));
  registry.registerKind('medium-mob', new MinionView('medium'));
  registry.registerKind('heavy-mob', new MinionView('heavy'));
  registry.registerFamily('structure', new StructureView());
  registry.registerFamily('projectile', new ProjectileView());
  registry.registerKind('capture-point', new CapturePointView());
  registry.registerKind('cathedral-gem', new CathedralGemView());
  return registry;
};
