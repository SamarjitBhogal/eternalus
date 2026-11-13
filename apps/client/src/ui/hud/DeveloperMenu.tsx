import { type ReactElement, useId, useState } from 'react';

import type { DeveloperMenuState } from '../../bridge/developerMenu.types';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { developerMenuSlice } from '../../bridge/slices/developerMenuSlice';
import type { PlayableTeam } from '../../bridge/domain.types';
import { Button } from '../components/Button';
import { STRINGS } from '../strings';
import { DEFAULT_HORDE_COUNT } from './DeveloperMenu.constants';
import styles from './DeveloperMenu.module.css';

const TEAMS: readonly PlayableTeam[] = ['light', 'dark'];

/**
 * The developer menu (13 §4; Architect's Table is the proposed name): spawn a horde of mobs at a
 * map structure and remove an entity by id. Each button emits one `dev-command` intent; `Match`
 * enqueues it as a `Command` and core validates it. It renders nothing unless the session enabled
 * the menu (`?dev=1`) and the `toggle-developer-menu` key opened it, and it knows nothing of the
 * simulation: its pickers arrive in the `developer-menu` state.
 */
export function DeveloperMenu(): ReactElement | null {
  const state = useAppSelector(developerMenuSlice.selectors.selectDeveloperMenu);
  return state.isOpen ? <DeveloperPanel mobs={state.mobs} origins={state.origins} /> : null;
}

/** The open menu; mounted per opening, so its pickers start on the first mob and origin. */
function DeveloperPanel({
  mobs,
  origins,
}: Pick<DeveloperMenuState, 'mobs' | 'origins'>): ReactElement {
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
  const [team, setTeam] = useState<PlayableTeam>('light');
  const [mobId, setMobId] = useState(mobs[0]?.id ?? '');
  const [count, setCount] = useState(DEFAULT_HORDE_COUNT);
  const [originId, setOriginId] = useState(origins[0]?.id ?? '');
  const [entityId, setEntityId] = useState('');
  const ids = { team: useId(), mob: useId(), count: useId(), origin: useId(), entity: useId() };
  const labels = STRINGS.developerMenu;
  return (
    <aside className={styles.menu} aria-label={labels.title}>
      <h2 className={styles.title}>{labels.title}</h2>
      <fieldset className={styles.group}>
        <legend>{labels.spawnMobs}</legend>
        <div className={styles.field}>
          <label htmlFor={ids.team}>{labels.team}</label>
          <select
            id={ids.team}
            value={team}
            onChange={(event) => {
              setTeam(event.currentTarget.value === 'dark' ? 'dark' : 'light');
            }}
          >
            {TEAMS.map((value) => (
              <option key={value} value={value}>
                {teamNames[value]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={ids.mob}>{labels.mob}</label>
          <select
            id={ids.mob}
            value={mobId}
            onChange={(event) => {
              setMobId(event.currentTarget.value);
            }}
          >
            {mobs.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
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
      <fieldset className={styles.group}>
        <legend>{labels.removeEntity}</legend>
        <div className={styles.field}>
          <label htmlFor={ids.entity}>{labels.entityId}</label>
          <input
            id={ids.entity}
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
    </aside>
  );
}
