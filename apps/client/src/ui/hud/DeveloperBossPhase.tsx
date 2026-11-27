import { type ReactElement, useId, useState } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './DeveloperMenu.module.css';

type BossPhase = keyof typeof STRINGS.developerMenu.bossPhases;

const isBossPhase = (value: string): value is BossPhase =>
  Object.keys(STRINGS.developerMenu.bossPhases).includes(value);

/**
 * The developer menu's "Boss phase" section (13 §4, DEC-417): a boss's entity id and a phase; Set
 * phase emits one `dev-set-boss-phase`. Core refuses an entity that is not a living boss.
 */
export function DeveloperBossPhase(): ReactElement {
  const [bossId, setBossId] = useState('');
  const [phase, setPhase] = useState<BossPhase>('hurt');
  const ids = { boss: useId(), phase: useId() };
  const labels = STRINGS.developerMenu;
  return (
    <fieldset className={styles.group}>
      <legend>{labels.bossPhase}</legend>
      <div className={styles.field}>
        <label htmlFor={ids.boss}>{labels.bossId}</label>
        <input
          id={ids.boss}
          type="text"
          value={bossId}
          onChange={(event) => {
            setBossId(event.currentTarget.value.trim());
          }}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={ids.phase}>{labels.phase}</label>
        <select
          id={ids.phase}
          value={phase}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (isBossPhase(value)) {
              setPhase(value);
            }
          }}
        >
          {Object.entries(labels.bossPhases).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Button
        isDisabled={bossId === ''}
        onClick={() => {
          emitIntent({
            kind: 'dev-command',
            command: { type: 'dev-set-boss-phase', entityId: bossId, phase },
          });
        }}
      >
        {labels.setPhase}
      </Button>
    </fieldset>
  );
}
