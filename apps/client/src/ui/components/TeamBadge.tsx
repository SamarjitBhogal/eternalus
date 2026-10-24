import type { ReactElement } from 'react';

import type { PlayableTeam } from '../../bridge/domain.types';
import { STRINGS } from '../strings';
import styles from './TeamBadge.module.css';

/**
 * The player's team, top right on both selection steps (reference 14 §2, CD-06): the team name in
 * Cinzel, read out as a sentence. Nothing before the session has assigned a team.
 */
export function TeamBadge({ team }: { readonly team: PlayableTeam | null }): ReactElement | null {
  if (team === null) return null;
  const name = STRINGS.characterSelect.teamNames[team];
  return (
    <p className={styles.badge}>
      <span className={styles.name} aria-hidden="true">
        {name}
      </span>
      <span className={styles.srOnly}>{STRINGS.characterSelect.teamBadge(name)}</span>
    </p>
  );
}
