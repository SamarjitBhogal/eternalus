import { Legend } from '../Legend';
import { UnitComponentInstaller } from '../UnitComponentInstaller';

/** The Sentinel Legend class. No class-specific behaviour yet. */
export class Sentinel extends Legend {
  public readonly kind = 'sentinel';

  /** Installs the unit components from its definition. */
  protected installComponents(context: unknown): void {
    new UnitComponentInstaller(this).install(context);
  }
}
