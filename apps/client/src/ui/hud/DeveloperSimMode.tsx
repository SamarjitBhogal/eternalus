import { type ReactElement, useId, useState } from 'react';

import type { DeveloperMenuState } from '../../bridge/developerMenu.types';
import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './DeveloperMenu.module.css';

/**
 * The developer menu's "Sim mode" section (13 §4, FR-099): Remove human hands the human's Legend
 * to the bots (the match runs on with no human); Take control puts the human on the Legend whose
 * id is typed. Each emits one `dev-set-controller`; core validates it. With no human, Follow makes
 * the camera follow the Legend picked from the match's Legends, None releases it (client-only
 * `dev-follow`, no `Command`).
 */
export function DeveloperSimMode({
  humanLegendId,
  followedLegendId,
  legends,
  controllerIds,
}: Pick<
  DeveloperMenuState,
  'humanLegendId' | 'followedLegendId' | 'legends' | 'controllerIds'
>): ReactElement {
  const [controlId, setControlId] = useState('');
  const controlFieldId = useId();
  const followFieldId = useId();
  const labels = STRINGS.developerMenu;
  // A dead or removed Legend leaves the list; keep its option so the select shows what is followed.
  const awayId = legends.some(({ id }) => id === followedLegendId) ? null : followedLegendId;
  return (
    <fieldset className={styles.group}>
      <legend>{labels.simMode}</legend>
      <Button
        isDisabled={humanLegendId === null}
        onClick={() => {
          if (humanLegendId !== null) {
            emitIntent({
              kind: 'dev-command',
              command: {
                type: 'dev-set-controller',
                entityId: humanLegendId,
                controllerId: controllerIds.rover,
              },
            });
          }
        }}
      >
        {labels.removeHuman}
      </Button>
      <div className={styles.field}>
        <label htmlFor={controlFieldId}>{labels.legendId}</label>
        <input
          id={controlFieldId}
          type="text"
          value={controlId}
          onChange={(event) => {
            setControlId(event.currentTarget.value.trim());
          }}
        />
      </div>
      <Button
        isDisabled={controlId === ''}
        onClick={() => {
          emitIntent({
            kind: 'dev-command',
            command: {
              type: 'dev-set-controller',
              entityId: controlId,
              controllerId: controllerIds.player,
            },
          });
        }}
      >
        {labels.takeControl}
      </Button>
      <div className={styles.field}>
        <label htmlFor={followFieldId}>{labels.follow}</label>
        <select
          id={followFieldId}
          disabled={humanLegendId !== null}
          value={followedLegendId ?? ''}
          onChange={(event) => {
            emitIntent({ kind: 'dev-follow', legendId: event.currentTarget.value || null });
          }}
        >
          <option value="">{labels.followNone}</option>
          {awayId !== null && (
            <option value={awayId}>
              {awayId} ({labels.followAway})
            </option>
          )}
          {legends.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
