import type { ReactElement } from 'react';

import styles from './GameCanvas.module.css';

/** The canvas the game will render into. */
export function GameCanvas(): ReactElement {
  return <canvas className={styles.canvas} />;
}
