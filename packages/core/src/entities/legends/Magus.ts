import { Legend } from '../Legend';
import { UnitComponentInstaller } from '../UnitComponentInstaller';

/** The Magus Legend class. No class-specific behaviour yet (Revive arrives with abilities). */
export class Magus extends Legend {
  public readonly kind = 'magus';

  /** Installs the unit components from its definition. */
  protected installComponents(context: unknown): void {
    new UnitComponentInstaller(this).install(context);
  }
}
