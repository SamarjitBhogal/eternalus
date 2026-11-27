import { Combat } from '../../components/Combat';
import { TurretState } from '../../components/TurretState';
import type { StructureDefinition } from '../../content/structures/structures.types';
import { SpawnContextReader } from '../SpawnContextReader';
import { Structure } from './Structure';

/**
 * A wall turret on a Stronghold's wall ring (architecture 07 §1, §5): `Structure` + `TurretState`
 * + `Combat`. Its definition names the `TurretController`, which picks its target and ammo and
 * aims ahead of a moving target, and the ammo it carries. It stands on its pylon map object,
 * which has its own health and takes the turret with it when it falls (DEC-388).
 */
export class Turret extends Structure {
  /** Always `'turret'`. */
  public readonly kind = 'turret';

  /**
   * Installs the structure components, then a `TurretState` with the ammo its definition names
   * (from the spawn context's ammo source) and a `Combat` loaded with the first one's attack. A
   * turret has no weapon (`weaponId` null).
   *
   * @throws Error when the context has no ammo source, the definition names no ammo, or an ammo
   *   it names is unknown.
   */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);
    const reader = new SpawnContextReader(this);
    const source = reader.ammo(context);
    if (source === null) {
      throw new Error(`Turret "${this.id}" needs an ammo source to load its ammo.`);
    }
    const { definition } = reader.positioned<StructureDefinition>(context);
    const ammo = (definition.ammo ?? []).map((id) => {
      if (!source.has(id)) {
        throw new Error(`Turret "${this.id}": unknown ammo "${id}".`);
      }
      return source.get(id);
    });
    const state = new TurretState(ammo);
    this.addComponent(state);
    this.addComponent(new Combat({ basic: state.loaded.attack }, null));
  }
}
