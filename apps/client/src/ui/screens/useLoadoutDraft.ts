import { useState } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import type { LegendClassCard } from '../../bridge/catalogue.types';
import { isSelectableSpec } from '../../bridge/selectionRules';
import { loadoutsSlice } from '../../bridge/slices/loadoutsSlice';

const { selectChosenWeaponId, selectLegendOptions, selectWasRepaired } = loadoutsSlice.selectors;

/**
 * The Loadout screen's state: which class and which of its Legends is open, and the weapon picked
 * but not yet saved. A loadout belongs to the Legend (`specId`, DEC-354 (1)); the class only
 * narrows the Legends offered, and opening a class opens the Legend last picked in it, else its
 * first available one. The saved weapon and the choices come from the store; `autoBuild` picks the
 * Legend's auto-build (core `autoBuildLoadout`, published as `defaultWeaponId`) and `save` sends
 * the pick to the game.
 */
export function useLoadoutDraft(classes: readonly LegendClassCard[]) {
  const [pickedClassId, setPickedClassId] = useState(classes[0]?.classId ?? null);
  const [pickedSpecIds, setPickedSpecIds] = useState<Readonly<Record<string, string>>>({});
  const [unsavedWeapons, setUnsavedWeapons] = useState<Readonly<Record<string, string>>>({});
  const classId = pickedClassId ?? '';
  const legends =
    classes.find((card) => card.classId === pickedClassId)?.specs.filter(isSelectableSpec) ?? [];
  const pickedSpecId = pickedSpecIds[classId] ?? legends[0]?.specId ?? null;
  const specId = pickedSpecId ?? '';
  const options = useAppSelector((state) => selectLegendOptions(state, specId));
  const savedWeaponId = useAppSelector((state) => selectChosenWeaponId(state, specId));
  const wasRepaired = useAppSelector((state) => selectWasRepaired(state, specId));
  const weaponId = unsavedWeapons[specId] ?? savedWeaponId;
  const isDirty = weaponId !== null && weaponId !== savedWeaponId;
  const pickWeapon = (id: string): void => {
    setUnsavedWeapons((previous) => ({ ...previous, [specId]: id }));
  };
  return {
    classId: pickedClassId,
    /** The picked class's Legends a player can pick (status `available`), in catalogue order. */
    legends,
    specId: pickedSpecId,
    options,
    weaponId,
    wasRepaired,
    isDirty,
    /** True when the pick already is the auto-build, or there is nothing to build from. */
    isAutoBuilt: options === null || weaponId === options.defaultWeaponId,
    pickClass: setPickedClassId,
    pickLegend: (id: string): void => {
      setPickedSpecIds((previous) => ({ ...previous, [classId]: id }));
    },
    pickWeapon,
    autoBuild: (): void => {
      if (options !== null) pickWeapon(options.defaultWeaponId);
    },
    save: (): void => {
      if (pickedSpecId === null || weaponId === null || !isDirty) return;
      emitIntent({ kind: 'save-loadout', specId: pickedSpecId, primaryWeaponId: weaponId });
      setUnsavedWeapons((previous) =>
        Object.fromEntries(Object.entries(previous).filter(([id]) => id !== specId)),
      );
    },
  };
}
