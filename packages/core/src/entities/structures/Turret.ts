import type { StructureDefinition } from '../../content/structures/structures.types';
import { SpawnContextReader } from '../SpawnContextReader';
import { Structure } from './Structure';

/**
 * A wall turret on a Stronghold's wall ring (architecture 07 §1, §5): `Structure` + `TurretState`
 * + `Combat`. Its definition names the `TurretController`, which picks its target and ammo and
 * aims ahead of a moving target, and the ammo it carries (`Structure` installs both, as for a lane
 * tower). It stands on its pylon map object, which has its own health and takes the turret with it
 * when it falls (DEC-388).
 */
export class Turret extends Structure {
  /** Always `'turret'`. */
  public readonly kind = 'turret';

  /**
   * Installs the structure components, which include the ammo parts.
   *
   * @throws Error when the context has no ammo source, the definition names no ammo, or an ammo
   *   it names is unknown.
   */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    const { definition } = new SpawnContextReader(this).positioned<StructureDefinition>(context);
    if (definition.ammo === undefined) {
      throw new Error(`Turret "${this.id}" names no ammo.`);
    }
  }
}
