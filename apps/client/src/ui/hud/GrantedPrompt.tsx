import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectGrantedPrompt } from '../../bridge/selectors/selectGrantedPrompt';
import { KeyGlyph } from '../components/KeyGlyph';
import { STRINGS } from '../strings';
import styles from './GrantedPrompt.module.css';

/**
 * The prompt for the ability a status grants (HC-Q61 (3), DEC-283): the key bound to the `granted`
 * action beside the ability's name from the catalogue ("Space  Fury Dash"). It shows while the
 * Legend holds a granted ability (Fury) and renders nothing otherwise. The key is the live binding
 * (`KeyGlyph`), never a literal.
 */
export function GrantedPrompt(): ReactElement | null {
  const name = useAppSelector(selectGrantedPrompt);
  if (name === null) return null;
  return (
    <div role="status" aria-label={STRINGS.hud.grantedPrompt} className={styles.prompt}>
      <KeyGlyph action="granted" appearance="hud" />
      <span className={styles.name}>{name}</span>
    </div>
  );
}
