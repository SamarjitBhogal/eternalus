import { type ReactElement, useId, useState } from 'react';

import type { DevCommand } from '../../bridge/developerMenu.types';
import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import styles from './DeveloperMatchTools.module.css';
import menuStyles from './DeveloperMenu.module.css';

const send = (command: DevCommand): void => {
  emitIntent({ kind: 'dev-command', command });
};

/** The developer controls for the local player, battlefield and result screen. */
export function DeveloperMatchTools(): ReactElement {
  const xId = useId();
  const yId = useId();
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [isConfirmingDestruction, setIsConfirmingDestruction] = useState(false);
  const labels = STRINGS.developerMenu;
  const point = { x: Number(x), y: Number(y) };
  const hasPoint = x !== '' && y !== '' && Number.isFinite(point.x) && Number.isFinite(point.y);

  return (
    <fieldset className={menuStyles.group}>
      <legend>{labels.matchTools}</legend>
      <div className={menuStyles.field}>
        <label htmlFor={xId}>{labels.worldX}</label>
        <input
          id={xId}
          type="number"
          step="any"
          value={x}
          onChange={(event) => {
            setX(event.currentTarget.value);
          }}
        />
        <label htmlFor={yId}>{labels.worldY}</label>
        <input
          id={yId}
          type="number"
          step="any"
          value={y}
          onChange={(event) => {
            setY(event.currentTarget.value);
          }}
        />
      </div>
      <div className={styles.actions}>
        <Button
          isDisabled={!hasPoint}
          onClick={() => {
            send({ type: 'dev-teleport', to: point });
          }}
        >
          {labels.teleport}
        </Button>
        <Button
          isDisabled={!hasPoint}
          onClick={() => {
            send({
              type: 'dev-spawn',
              kind: 'heavy-mob',
              definitionId: 'corner-boss',
              team: 'neutral',
              at: point,
              count: 1,
            });
          }}
        >
          {labels.spawnBoss}
        </Button>
        <Button
          onClick={() => {
            send({ type: 'dev-level-up' });
          }}
        >
          {labels.levelUp}
        </Button>
        <Button
          onClick={() => {
            if (isConfirmingDestruction) send({ type: 'dev-destroy-buildings' });
            setIsConfirmingDestruction(!isConfirmingDestruction);
          }}
        >
          {isConfirmingDestruction ? labels.confirmDestruction : labels.destroyBuildings}
        </Button>
        {isConfirmingDestruction && (
          <Button
            onClick={() => {
              setIsConfirmingDestruction(false);
            }}
          >
            {labels.cancelDestruction}
          </Button>
        )}
        <Button
          onClick={() => {
            send({ type: 'dev-end-match', outcome: 'win' });
          }}
        >
          {labels.win}
        </Button>
        <Button
          onClick={() => {
            send({ type: 'dev-end-match', outcome: 'lose' });
          }}
        >
          {labels.lose}
        </Button>
      </div>
    </fieldset>
  );
}
