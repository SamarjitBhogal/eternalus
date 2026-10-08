import { Mob } from '../Mob';
import { UnitComponentInstaller } from '../UnitComponentInstaller';

/** A light mob (also the training dummy). Real mob behaviour belongs to SCRUM-59. */
export class LightMob extends Mob {
  public readonly kind = 'light-mob';

  /** Installs the unit components from its definition. */
  protected installComponents(context: unknown): void {
    new UnitComponentInstaller(this).install(context);
  }
}
