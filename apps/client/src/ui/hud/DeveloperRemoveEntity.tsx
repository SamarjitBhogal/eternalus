import { type ReactElement, useId, useState } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './DeveloperMenu.module.css';

/**
 * The developer menu's "Remove entity" section (13 §4): an entity id; Remove emits one
 * `dev-remove-entity`. Core refuses the Legend a human plays (`human-legend`).
 */
export function DeveloperRemoveEntity(): ReactElement {
  const [entityId, setEntityId] = useState('');
  const entityFieldId = useId();
  const labels = STRINGS.developerMenu;
  return (
    <fieldset className={styles.group}>
      <legend>{labels.removeEntity}</legend>
      <div className={styles.field}>
        <label htmlFor={entityFieldId}>{labels.entityId}</label>
        <input
          id={entityFieldId}
          type="text"
          value={entityId}
          onChange={(event) => {
            setEntityId(event.currentTarget.value.trim());
          }}
        />
      </div>
      <Button
        isDisabled={entityId === ''}
        onClick={() => {
          emitIntent({ kind: 'dev-command', command: { type: 'dev-remove-entity', entityId } });
        }}
      >
        {labels.remove}
      </Button>
    </fieldset>
  );
}
