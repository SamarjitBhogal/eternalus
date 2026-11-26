import { CapturePointView } from './CapturePointView';
import { ColossusView } from './ColossusView';
import { CathedralGemView } from './CathedralGemView';
import { DefaultEntityView } from './DefaultEntityView';
import { LegendView } from './LegendView';
import { MobView } from './MobView';
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
  image?: (id: string) => HTMLImageElement | undefined,
): ViewRegistry => {
  const registry = new ViewRegistry(new DefaultEntityView(), onUnknownKind);
  registry.registerFamily('legend', new LegendView());
  registry.registerFamily('mob', new MobView());
  registry.registerFamily('structure', new StructureView());
  registry.registerKind('capture-point', new CapturePointView());
  if (image !== undefined) registry.registerDefinition('cathedral-boss', new ColossusView(image));
  registry.registerKind('cathedral-gem', new CathedralGemView());
  return registry;
};
