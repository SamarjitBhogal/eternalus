import type { ReactElement } from 'react';

import type { PlayableTeam } from '../../bridge/domain.types';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { STRINGS } from '../strings';
import styles from './TeamBadge.module.css';

/**
 * The player's team, top right on both selection steps (reference 14 §2, CD-06): the team name in
 * Cinzel, read out as a sentence. Nothing before the session has assigned a team.
 */
export function TeamBadge({ team }: { readonly team: PlayableTeam | null }): ReactElement | null {
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
  if (team === null) return null;
  const name = teamNames[team];
  return (
    <p className={styles.badge}>
      <span className={styles.name} aria-hidden="true">
        {name}
      </span>
      <span className={styles.srOnly}>{STRINGS.characterSelect.teamBadge(name)}</span>
    </p>
  );
}
