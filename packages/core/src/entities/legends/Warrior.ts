import { Legend } from '../Legend';
import { UnitComponentInstaller } from '../UnitComponentInstaller';

/** The Warrior Legend class (formerly Assault). No class-specific behaviour yet. */
export class Warrior extends Legend {
  public readonly kind = 'warrior';

  /** Installs the unit components from its definition. */
  protected installComponents(context: unknown): void {
    new UnitComponentInstaller(this).install(context);
  }
}
