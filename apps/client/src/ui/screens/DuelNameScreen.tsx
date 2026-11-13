import { type ReactElement, useState } from 'react';

import { MAX_PLAYER_NAME_LENGTH, PLAYER_NAME_PATTERN } from '../../bridge/domain.types';
import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import styles from './DuelNameScreen.module.css';

/**
 * The online Duel's first screen (ADR 0016): the player types a name and joins the queue with it.
 * The name travels in the join message; the server shows it to the opponent. Find opponent is
 * disabled until the name passes the same rule the server checks.
 */
export function DuelNameScreen(): ReactElement {
  const [name, setName] = useState<string>(STRINGS.duelName.defaultName);
  const isValid = PLAYER_NAME_PATTERN.test(name);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.duelName.title}>
        <label className={styles.field}>
          {STRINGS.duelName.nameLabel}
          <input
            className={styles.input}
            value={name}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </label>
        <Button
          isDisabled={!isValid}
          onClick={() => {
            emitIntent({ kind: 'start-duel', name });
          }}
        >
          {STRINGS.duelName.find}
        </Button>{' '}
        <Button
          onClick={() => {
            emitIntent({ kind: 'navigate', route: 'home' });
          }}
        >
          {STRINGS.duelName.back}
        </Button>
      </Panel>
    </ScreenFrame>
  );
}
