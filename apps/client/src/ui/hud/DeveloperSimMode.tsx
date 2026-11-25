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
 * the camera follow the typed Legend and Stop following ends it (client-only `dev-follow`, no
 * `Command`).
 */
export function DeveloperSimMode({
  humanLegendId,
  followedLegendId,
  controllerIds,
}: Pick<DeveloperMenuState, 'humanLegendId' | 'followedLegendId' | 'controllerIds'>): ReactElement {
  const [controlId, setControlId] = useState('');
  const controlFieldId = useId();
  const labels = STRINGS.developerMenu;
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
      <Button
        isDisabled={humanLegendId !== null || controlId === ''}
        onClick={() => {
          emitIntent({ kind: 'dev-follow', legendId: controlId });
        }}
      >
        {labels.follow}
      </Button>
      <Button
        isDisabled={humanLegendId !== null || followedLegendId === null}
        onClick={() => {
          emitIntent({ kind: 'dev-follow', legendId: null });
        }}
      >
        {labels.stopFollowing}
      </Button>
    </fieldset>
  );
}
