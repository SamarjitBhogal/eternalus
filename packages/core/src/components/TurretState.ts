import type { TurretAmmoDefinition } from '../content/structures/turrets.types';

/**
 * A turret's equipment (architecture 07 §5 `TurretState`): the ammo it carries, loaded and best
 * first (its definition's `ammo` order, so the first whose `preferredAgainst` fits a target is the
 * one for it), and the id of the ammo it has loaded. Loading an ammo changes only this record; the
 * `switch-ammo` command loads it through `EntityStore.loadTurretAmmo`, which also equips the ammo's
 * attack on the turret's `Combat`. Manual control (`TurretControl`) joins when it is built.
 */
export class TurretState {
  private loadedValue: TurretAmmoDefinition;

  /**
   * Starts with the first ammo loaded.
   *
   * @param ammo - The ammo it carries, best first; at least one.
   * @throws Error when `ammo` is empty: a turret with no ammo cannot fire.
   */
  public constructor(public readonly ammo: readonly TurretAmmoDefinition[]) {
    const first = ammo[0];
    if (first === undefined) {
      throw new Error('A turret needs at least one ammo.');
    }
    this.loadedValue = first;
  }

  /** The ammo it has loaded. */
  public get loaded(): TurretAmmoDefinition {
    return this.loadedValue;
  }

  /** The id of the ammo it has loaded. */
  public get loadedId(): string {
    return this.loadedValue.id;
  }

  /**
   * Loads the ammo `ammoId`.
   *
   * @returns The ammo now loaded, or `undefined`, changing nothing, when it does not carry it.
   */
  public load(ammoId: string): TurretAmmoDefinition | undefined {
    const ammo = this.ammo.find(({ id }) => id === ammoId);
    if (ammo !== undefined) {
      this.loadedValue = ammo;
    }
    return ammo;
  }
}
