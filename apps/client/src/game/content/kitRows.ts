import type { AbilityDisplay, LegendDefinition } from '@eternalus/core';

import type { DetailRow, DetailSlot, KitRow } from '../../bridge/catalogue.types';
import type { DetailIcons } from './CataloguePresentation.types';

/** The abilities a Legend equips (core's `AbilityKit`, which core does not export by name). */
type Kit = LegendDefinition['defaultKit'];

/** The kit row's bar slot for each position of a kit: abilities 1 to 3, then the ultimate. */
const KIT_SLOTS: readonly KitRow['slot'][] = ['ability-1', 'ability-2', 'ability-3', 'ability-4'];

/** Panel order of a Legend's rows (DEC-65): the ultimate on top, then abilities 1 to 3. */
const DETAIL_ORDER: readonly { readonly slot: DetailSlot; readonly kitSlot: KitRow['slot'] }[] = [
  { slot: 'ultimate', kitSlot: 'ability-4' },
  { slot: 'ability-1', kitSlot: 'ability-1' },
  { slot: 'ability-2', kitSlot: 'ability-2' },
  { slot: 'ability-3', kitSlot: 'ability-3' },
];

/**
 * The kit's four rows, abilities 1 to 3 and then the ultimate, from the ability catalogue. An
 * ultimate costs charge, not aether (its content cost and cooldown are 0 because the meter gates
 * it, DEC-202); every other ability costs its aether. An ability with no effects is not available.
 * @throws Error naming the id when the kit names an ability the catalogue lacks.
 */
export function kitRows(kit: Kit, abilities: readonly AbilityDisplay[]): readonly KitRow[] {
  const ids = [...kit.abilities, kit.ultimate];
  return ids.map((abilityId, index): KitRow => {
    const ability = abilities.find(({ id }) => id === abilityId);
    if (ability === undefined) {
      throw new Error(`kitRows: kit names ability "${abilityId}" the catalogue lacks`);
    }
    const isUltimate = ability.slot === 'ultimate';
    return {
      slot: KIT_SLOTS[index] ?? 'ability-4',
      abilityId,
      displayName: ability.displayName,
      description: ability.description,
      cost: isUltimate ? { kind: 'charge' } : { kind: 'aether', amount: ability.aetherCost },
      cooldownSeconds: isUltimate ? null : ability.cooldownSeconds,
      isAvailable: ability.isAvailable,
    };
  });
}

/** A Legend's detail rows in panel order: the kit's names and details over the presentation's icons. */
export function kitDetailRows(rows: readonly KitRow[], icons: DetailIcons): readonly DetailRow[] {
  return DETAIL_ORDER.flatMap(({ slot, kitSlot }) => {
    const kit = rows.find((row) => row.slot === kitSlot);
    return kit === undefined
      ? []
      : [{ slot, displayName: kit.displayName, iconAssetId: icons[slot] ?? null, kit }];
  });
}
