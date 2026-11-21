import { useState } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import type { LegendClassCard } from '../../bridge/catalogue.types';
import { loadoutsSlice } from '../../bridge/slices/loadoutsSlice';

const { selectChosenWeaponId, selectClassOptions, selectWasRepaired } = loadoutsSlice.selectors;

/**
 * The Loadout screen's state: which class is open and the weapon picked but not yet saved. The saved
 * weapon and the choices come from the store; `autoBuild` picks the class's auto-build (core
 * `autoBuildLoadout`, published as `defaultWeaponId`) and `save` sends the pick to the game.
 */
export function useLoadoutDraft(classes: readonly LegendClassCard[]) {
  const [pickedClassId, setPickedClassId] = useState(classes[0]?.classId ?? null);
  const [unsavedWeapons, setUnsavedWeapons] = useState<Readonly<Record<string, string>>>({});
  const classId = pickedClassId ?? '';
  const options = useAppSelector((state) => selectClassOptions(state, classId));
  const savedWeaponId = useAppSelector((state) => selectChosenWeaponId(state, classId));
  const wasRepaired = useAppSelector((state) => selectWasRepaired(state, classId));
  const weaponId = unsavedWeapons[classId] ?? savedWeaponId;
  const isDirty = weaponId !== null && weaponId !== savedWeaponId;
  const pickWeapon = (id: string): void => {
    setUnsavedWeapons((previous) => ({ ...previous, [classId]: id }));
  };
  return {
    classId: pickedClassId,
    options,
    weaponId,
    wasRepaired,
    isDirty,
    /** True when the pick already is the auto-build, or there is nothing to build from. */
    isAutoBuilt: options === null || weaponId === options.defaultWeaponId,
    pickClass: setPickedClassId,
    pickWeapon,
    autoBuild: (): void => {
      if (options !== null) pickWeapon(options.defaultWeaponId);
    },
    save: (): void => {
      if (pickedClassId === null || weaponId === null || !isDirty) return;
      emitIntent({ kind: 'save-loadout', classId: pickedClassId, primaryWeaponId: weaponId });
      setUnsavedWeapons((previous) =>
        Object.fromEntries(Object.entries(previous).filter(([id]) => id !== classId)),
      );
    },
  };
}
