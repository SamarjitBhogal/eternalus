import { Legend } from '../Legend';
import { AbilityRuntime } from '../../components/AbilityRuntime';
import { WARRIOR_PREVIEW_KIT } from '../../content/abilities/warriorPreviewKit';

/** The Warrior Legend class (formerly Assault). Documented actions are animation previews until their gameplay ships. */
export class Warrior extends Legend {
  /** Always `'warrior'`. */
  public readonly kind = 'warrior';
  /** Exposes documented actions as previews while their gameplay is unfinished. */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    this.addComponent(new AbilityRuntime(WARRIOR_PREVIEW_KIT));
  }
}
