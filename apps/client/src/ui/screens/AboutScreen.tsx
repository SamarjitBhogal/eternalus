import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';

/** Credits and licences. Placeholder until credits are generated from the asset manifest. */
export function AboutScreen(): ReactElement {
  return (
    <ScreenFrame>
      <Panel title={STRINGS.about.title}>
        <p>{STRINGS.about.credits}</p>
        <h3>{STRINGS.about.licencesTitle}</h3>
        <ul>
          {STRINGS.about.licences.map((licence) => (
            <li key={licence}>{licence}</li>
          ))}
        </ul>
        <Button
          autoFocus
          onClick={() => {
            emitIntent({ kind: 'navigate', route: 'home' });
          }}
        >
          {STRINGS.back}
        </Button>
      </Panel>
    </ScreenFrame>
  );
}
