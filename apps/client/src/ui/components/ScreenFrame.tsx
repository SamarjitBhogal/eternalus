import type { ReactElement, ReactNode } from 'react';

import type { Team } from '../../bridge/domain.types';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import styles from './ScreenFrame.module.css';
import { ThemedBackground } from './ThemedBackground';

/** A full-screen `<main>` over the content background set of `team`. */
export function ScreenFrame({
  team = 'neutral',
  children,
}: {
  readonly team?: Team;
  readonly children: ReactNode;
}): ReactElement {
  const background = useAppSelector((state) =>
    contentSlice.selectors.selectBackgroundSet(state, team),
  );
  return (
    <main className={styles.screen}>
      <ThemedBackground set={background} />
      <div className={styles.content}>{children}</div>
    </main>
  );
}
