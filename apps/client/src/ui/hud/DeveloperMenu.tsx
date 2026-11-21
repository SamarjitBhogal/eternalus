import { type ReactElement, useId, useState } from 'react';

import type { DeveloperMenuState } from '../../bridge/developerMenu.types';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { developerMenuSlice } from '../../bridge/slices/developerMenuSlice';
import type { PlayableTeam } from '../../bridge/domain.types';
import { STRINGS } from '../strings';
import { DeveloperLegends } from './DeveloperLegends';
import styles from './DeveloperMenu.module.css';
import { DeveloperRemoveEntity } from './DeveloperRemoveEntity';
import { DeveloperSimMode } from './DeveloperSimMode';
import { DeveloperSpawnMobs } from './DeveloperSpawnMobs';

const TEAMS: readonly PlayableTeam[] = ['light', 'dark'];

/**
 * The developer menu (13 §4; Architect's Table is the proposed name): spawn a horde of mobs at a
 * map structure, add a bot Legend of a class at its team's Stronghold or remove a Legend (the team
 * picker serves both adds), remove an entity by id, and sim mode (take the human off its Legend or
 * put the human on a chosen one, FR-099). Each button emits one `dev-command`
 * intent; `Match` enqueues it as a `Command` and core validates it. It renders nothing unless the
 * session enabled the menu (`?dev=1`) and the `toggle-developer-menu` key opened it, and it knows
 * nothing of the simulation: its pickers arrive in the `developer-menu` state and the display
 * catalogue.
 */
export function DeveloperMenu(): ReactElement | null {
  const state = useAppSelector(developerMenuSlice.selectors.selectDeveloperMenu);
  return state.isOpen ? (
    <DeveloperPanel origins={state.origins} humanLegendId={state.humanLegendId} />
  ) : null;
}

/**
 * The open menu: the team picker its sections share, then one component per section. Mounted per
 * opening, so its pickers start on their first entry.
 */
function DeveloperPanel({
  origins,
  humanLegendId,
}: Pick<DeveloperMenuState, 'origins' | 'humanLegendId'>): ReactElement {
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
  const [team, setTeam] = useState<PlayableTeam>('light');
  const teamId = useId();
  const labels = STRINGS.developerMenu;
  return (
    <aside className={styles.menu} aria-label={labels.title}>
      <h2 className={styles.title}>{labels.title}</h2>
      <div className={styles.field}>
        <label htmlFor={teamId}>{labels.team}</label>
        <select
          id={teamId}
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
      <DeveloperSpawnMobs team={team} origins={origins} />
      <DeveloperLegends team={team} />
      <DeveloperRemoveEntity />
      <DeveloperSimMode humanLegendId={humanLegendId} />
    </aside>
  );
}
