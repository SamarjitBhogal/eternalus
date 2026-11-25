import { type ReactElement, useId, useState } from 'react';

import type { PlayableTeam } from '../../bridge/domain.types';
import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { selectSelectableClasses } from '../../bridge/selectors/selectSelectableClasses';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './DeveloperMenu.module.css';

/**
 * The developer menu's "Legends" section (13 §4, FR-097, DEC-293): Add emits one
 * `dev-spawn-legend` of the picked selectable class for `team`; Remove Legend emits one
 * `dev-remove-legend` for the typed id (core refuses the human's Legend outside sim mode).
 */
export function DeveloperLegends({ team }: { readonly team: PlayableTeam }): ReactElement {
  const classes = useAppSelector(selectSelectableClasses);
  const [classId, setClassId] = useState(classes[0]?.classId ?? '');
  const [legendId, setLegendId] = useState('');
  const ids = { legendClass: useId(), legend: useId() };
  const labels = STRINGS.developerMenu;
  return (
    <fieldset className={styles.group}>
      <legend>{labels.legends}</legend>
      <div className={styles.field}>
        <label htmlFor={ids.legendClass}>{labels.legendClass}</label>
        <select
          id={ids.legendClass}
          value={classId}
          onChange={(event) => {
            setClassId(event.currentTarget.value);
          }}
        >
          {classes.map((card) => (
            <option key={card.classId} value={card.classId}>
              {card.displayName}
            </option>
          ))}
        </select>
      </div>
      <Button
        isDisabled={classId === ''}
        onClick={() => {
          emitIntent({
            kind: 'dev-command',
            command: { type: 'dev-spawn-legend', team, definitionId: classId },
          });
        }}
      >
        {labels.add}
      </Button>
      <div className={styles.field}>
        <label htmlFor={ids.legend}>{labels.legendToRemove}</label>
        <input
          id={ids.legend}
          type="text"
          value={legendId}
          onChange={(event) => {
            setLegendId(event.currentTarget.value.trim());
          }}
        />
      </div>
      <Button
        isDisabled={legendId === ''}
        onClick={() => {
          emitIntent({
            kind: 'dev-command',
            command: { type: 'dev-remove-legend', entityId: legendId },
          });
        }}
      >
        {labels.removeLegend}
      </Button>
    </fieldset>
  );
}
