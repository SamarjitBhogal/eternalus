import { AbilityRuntime } from '../../components/AbilityRuntime';
import { MAGUS_KIT } from '../../content/abilities/magusKit';
import { Legend } from '../Legend';

/** The Magus Legend class with the shared, content-defined starter kit. */
export class Magus extends Legend {
  /** Always `'magus'`. */
  public readonly kind = 'magus';
  /** Adds the authored shared Magus starter kit. */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    this.addComponent(new AbilityRuntime(MAGUS_KIT));
  }
}
