import type { AuthoredAbilityWith, AuthoredStep } from '../abilities/AbilityDefinition.types';
import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { ContentRule } from './ContentValidator.types';

/** The effect kind that puts a spec's second weapon in hand (`SwapWeaponEffect`). */
const SWAP_WEAPON_KIND = 'swap-weapon';

/**
 * A Legend spec's second weapon (05 §12 `secondaryWeaponId`, DEC-303) names a loaded weapon, and
 * the spec has one exactly when one of its artifacts swaps weapons: a swap with no second weapon
 * does nothing, and a second weapon with no swap is never in hand. A typo fails at load (04 §5).
 */
export class SecondaryWeaponRule implements ContentRule<LegendSpecDefinition> {
  /**
   * @param weapons - The weapons a second weapon may name.
   * @param abilities - The abilities as authored, to find an artifact's effect steps.
   */
  public constructor(
    private readonly weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has'>,
    private readonly abilities: Pick<
      ContentCatalogue<AuthoredAbilityWith<AuthoredStep>>,
      'has' | 'get'
    >,
  ) {}

  /** Flags an unknown second weapon, a swap with no second weapon and a second weapon with no swap. */
  public check({ secondaryWeaponId, artifacts }: LegendSpecDefinition): readonly string[] {
    const swaps = artifacts.filter(
      (id): id is string =>
        id !== null &&
        this.abilities.has(id) &&
        this.abilities.get(id).effects.some(({ kind }) => kind === SWAP_WEAPON_KIND),
    );
    if (secondaryWeaponId === null) {
      return swaps.map((id) => `artifacts "${id}" swaps weapons, but secondaryWeaponId is null`);
    }
    return [
      ...(this.weapons.has(secondaryWeaponId)
        ? []
        : [`secondaryWeaponId "${secondaryWeaponId}" names no weapon`]),
      ...(swaps.length > 0
        ? []
        : [`secondaryWeaponId "${secondaryWeaponId}" is never in hand: no artifact swaps weapons`]),
    ];
  }
}
