import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';

/**
 * The online Duel's waiting screen (ADR 0016): the player is in the queue until the server pairs
 * them with another player, when the session leaves the menu for the match; Cancel leaves the queue.
 */
export function DuelQueueScreen(): ReactElement {
  return (
    <ScreenFrame>
      <Panel title={STRINGS.duelQueue.title}>
        <p role="status">{STRINGS.duelQueue.searching}</p>
        <Button
          autoFocus
          onClick={() => {
            emitIntent({ kind: 'cancel-duel' });
          }}
        >
          {STRINGS.duelQueue.cancel}
        </Button>
      </Panel>
    </ScreenFrame>
  );
}
