import type { HeldWeapon } from './Loadout.types';

/**
 * The weapons a Legend holds (architecture 04 §3 `Loadout`, its weapon part; 05 §12
 * `primaryWeaponId` and `secondaryWeaponId`): each one's attacks, loaded at spawn, and which one
 * is in its hand. The primary weapon is in hand at spawn. A gadget with a `swap-weapon` step swaps
 * them (DEC-303: the Zealot's talons and bow). Nothing resets the weapon in hand yet (`INBOX.md`
 * HC-Q84, open). The kit and the artifacts are on `Abilities`.
 */
export class Loadout {
  private isSecondaryInHandValue = false;

  /**
   * @param primary - The class's default weapon (`defaultLoadout.primaryWeaponId`).
   * @param secondary - The spec's second weapon (`secondaryWeaponId`), or `null` for none.
   */
  public constructor(
    private readonly primary: HeldWeapon,
    private readonly secondary: HeldWeapon | null,
  ) {}

  /** Whether the second weapon is in hand. */
  public get isSecondaryInHand(): boolean {
    return this.isSecondaryInHandValue;
  }

  /** The weapon in hand. */
  public get inHand(): HeldWeapon {
    return this.isSecondaryInHandValue && this.secondary !== null ? this.secondary : this.primary;
  }

  /**
   * Puts the other weapon in hand.
   *
   * @returns The weapon now in hand, or `null`, changing nothing, when there is no second weapon.
   */
  public swap(): HeldWeapon | null {
    if (this.secondary === null) {
      return null;
    }
    this.isSecondaryInHandValue = !this.isSecondaryInHandValue;
    return this.inHand;
  }
}
