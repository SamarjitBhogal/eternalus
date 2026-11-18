import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { selectSelectableClasses } from '../../bridge/selectors/selectSelectableClasses';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import { LoadoutRadioGroup } from './LoadoutRadioGroup';
import styles from './LoadoutScreen.module.css';
import { useLoadoutDraft } from './useLoadoutDraft';

/**
 * Loadouts (08, 14 §1): pick a class, then its primary weapon, and save it to the profile. The
 * slots that wait for the Phase 4 loadout model are listed but disabled, so the design is visible.
 */
export function LoadoutScreen(): ReactElement {
  const classes = useAppSelector(selectSelectableClasses);
  const draft = useLoadoutDraft(classes);
  const pickedClass = classes.find((card) => card.classId === draft.classId);
  const startWeapon = pickedClass?.hud?.weapon?.displayName ?? null;
  return (
    <ScreenFrame>
      <Panel title={STRINGS.loadouts.title}>
        <LoadoutRadioGroup
          label={STRINGS.loadouts.classGroup}
          choices={classes.map((card) => ({ id: card.classId, label: card.displayName }))}
          pickedId={draft.classId}
          onPick={draft.pickClass}
          autoFocusPicked
        />
        {pickedClass !== undefined && <p className={styles.note}>{pickedClass.blurb}</p>}
        <h3>{STRINGS.loadouts.weaponGroup}</h3>
        {draft.options === null ? (
          <p className={styles.note}>
            {STRINGS.loadouts.weaponsUnavailable}
            {startWeapon !== null && ` ${STRINGS.loadouts.startsWith} ${startWeapon}.`}
          </p>
        ) : (
          <LoadoutRadioGroup
            label={STRINGS.loadouts.weaponGroup}
            choices={draft.options.weapons.map((weapon) => ({
              id: weapon.id,
              label: weapon.displayName,
            }))}
            pickedId={draft.weaponId}
            onPick={draft.pickWeapon}
          />
        )}
        {draft.wasRepaired && (
          <p role="status" className={styles.note}>
            {STRINGS.loadouts.repaired}
          </p>
        )}
        <h3>{STRINGS.loadouts.pendingTitle}</h3>
        <ul className={styles.pending}>
          {STRINGS.loadouts.pendingSlots.map((slot) => (
            <li key={slot} aria-disabled="true">
              {slot}: {STRINGS.loadouts.pendingNote}
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <Button onClick={draft.save} isDisabled={!draft.isDirty}>
            {STRINGS.loadouts.save}
          </Button>
          <Button
            onClick={() => {
              emitIntent({ kind: 'navigate', route: 'home' });
            }}
          >
            {STRINGS.back}
          </Button>
        </div>
      </Panel>
    </ScreenFrame>
  );
}
