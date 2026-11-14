import { Legend } from '../Legend';
import { AbilityRuntime } from '../../components/AbilityRuntime';
import { SENTINEL_PREVIEW_KIT } from '../../content/abilities/sentinelPreviewKit';

/** The Sentinel Legend class. Documented actions are animation previews until their gameplay ships. */
export class Sentinel extends Legend {
  /** Always `'sentinel'`. */
  public readonly kind = 'sentinel';
  /** Exposes documented actions as previews while their gameplay is unfinished. */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    this.addComponent(new AbilityRuntime(SENTINEL_PREVIEW_KIT));
  }
}
