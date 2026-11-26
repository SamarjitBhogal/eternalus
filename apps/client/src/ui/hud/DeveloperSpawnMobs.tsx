import { type ReactElement, useId, useState } from 'react';

import type { DeveloperMenuState } from '../../bridge/developerMenu.types';
import type { PlayableTeam } from '../../bridge/domain.types';
import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import { DEFAULT_HORDE_COUNT } from './DeveloperMenu.constants';
import styles from './DeveloperMenu.module.css';

/** The props of `DeveloperSpawnMobs`: the menu's team and the structures a horde can start at. */
type DeveloperSpawnMobsProps = Pick<DeveloperMenuState, 'origins'> & {
  readonly team: PlayableTeam;
};

/**
 * The developer menu's "Spawn mobs" section (13 §4, FR-098): a lane minion of the display
 * catalogue, a count and an origin structure; Spawn emits one `dev-spawn-mobs` for `team`.
 */
export function DeveloperSpawnMobs({ team, origins }: DeveloperSpawnMobsProps): ReactElement {
  const mobs = useAppSelector(contentSlice.selectors.selectLaneMinions);
  const [mobId, setMobId] = useState(mobs[0]?.id ?? '');
  const [count, setCount] = useState(DEFAULT_HORDE_COUNT);
  const [originId, setOriginId] = useState(origins[0]?.id ?? '');
  const ids = { mob: useId(), count: useId(), origin: useId() };
  const labels = STRINGS.developerMenu;
  return (
    <fieldset className={styles.group}>
      <legend>{labels.spawnMobs}</legend>
      <div className={styles.field}>
        <label htmlFor={ids.mob}>{labels.mob}</label>
        <select
          id={ids.mob}
          value={mobId}
          onChange={(event) => {
            setMobId(event.currentTarget.value);
          }}
        >
          {mobs.map(({ id, displayName }) => (
            <option key={id} value={id}>
              {displayName}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor={ids.count}>{labels.count}</label>
        <input
          id={ids.count}
          type="number"
          min={1}
          value={count}
          onChange={(event) => {
            setCount(Number(event.currentTarget.value));
          }}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={ids.origin}>{labels.origin}</label>
        <select
          id={ids.origin}
          value={originId}
          onChange={(event) => {
            setOriginId(event.currentTarget.value);
          }}
        >
          {origins.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Button
        isDisabled={mobId === '' || originId === '' || !Number.isInteger(count) || count < 1}
        onClick={() => {
          emitIntent({
            kind: 'dev-command',
            command: {
              type: 'dev-spawn-mobs',
              team,
              definitionId: mobId,
              count,
              origin: { kind: 'structure', structureId: originId },
            },
          });
        }}
      >
        {labels.spawn}
      </Button>
    </fieldset>
  );
}
