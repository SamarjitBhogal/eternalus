import type { ReactElement } from 'react';

import { emitIntent } from '../../bridge/eventBus';
import { useAppSelector } from '../../bridge/hooks';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { Button } from '../components/Button';
import { Panel } from '../components/Panel';
import { ScreenFrame } from '../components/ScreenFrame';
import { STRINGS } from '../strings';
import styles from './AboutScreen.module.css';

/**
 * Credits and licences: the art and font credits generated from the asset manifest (13 §3
 * `selectCredits`; each with its licence text, which ships in the bundle as OFL and MIT require,
 * and its files' provenance), then the software licences.
 */
export function AboutScreen(): ReactElement {
  const credits = useAppSelector(assetsSlice.selectors.selectCredits);
  return (
    <ScreenFrame>
      <Panel title={STRINGS.about.title}>
        <p>{STRINGS.about.credits}</p>
        {credits.length > 0 && (
          <>
            <h3>{STRINGS.about.assetCreditsTitle}</h3>
            <ul>
              {credits.map((credit) => (
                <li key={credit.licenceId}>
                  <strong>{credit.work}</strong> ({credit.licenceName}). {credit.notice}
                  <details>
                    <summary>{STRINGS.about.creditDetails}</summary>
                    {credit.licenceText !== null && (
                      <p className={styles.licenceText}>{credit.licenceText}</p>
                    )}
                    <ul>
                      {credit.assets.map((asset) => (
                        <li key={asset.assetId}>
                          <code>{asset.assetId}</code>: {asset.source}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </>
        )}
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
