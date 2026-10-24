import type { ReactElement } from 'react';

import { AssetImage } from '../components/AssetImage';
import { InfoPanel } from '../components/InfoPanel';
import { KeyPrompt } from '../components/KeyPrompt';
import { STRINGS } from '../strings';
import type { SelectionStepProps } from './characterSelect.types';
import { ClassSelectAltArrow } from './ClassSelectAltArrow';
import styles from './ClassSelectAltStep.module.css';
import { useClassSelectStep } from './useClassSelectStep';

const { characterSelect: text } = STRINGS;

/**
 * The class step, alternate layout (62:70; O5, chosen by `classSelectLayout`): the shown class's
 * full-figure model between the vignettes, its panel with the layout's own copy and icons
 * (`layoutOverrides.alternate`), previous / next arrows over the available classes (CD-10) and
 * "C View Details" (`gadget-2`, F7), which selects the shown class (`select-class`). The title is
 * live (`polite`): the arrows change the panel without moving the focus (TAP-17). A class with no
 * model shows its card art in the model box (CD-13).
 */
export function ClassSelectAltStep({ preferredClassId }: SelectionStepProps): ReactElement {
  const { panel, actions } = useClassSelectStep(preferredClassId);
  const modelId = panel?.card.art.model ?? null;
  return (
    <section className={styles.step} aria-label={text.chooseClass}>
      <AssetImage assetId={modelId} className={styles.model} />
      <AssetImage
        assetId={modelId === null ? (panel?.card.art.card ?? null) : null}
        className={styles.modelStandIn}
      />
      <ClassSelectAltArrow
        direction="previous"
        onPress={() => {
          actions.cycle(-1);
        }}
      />
      <ClassSelectAltArrow
        direction="next"
        onPress={() => {
          actions.cycle(1);
        }}
      />
      {panel !== undefined && (
        <InfoPanel
          layout="class-alternate"
          title={panel.card.displayName}
          subtitle={null}
          subtitleAccentToken={panel.card.accentToken}
          description={panel.description}
          detailsHeader={text.classAlternateDetailsHeader}
          rows={panel.details}
          titleLive="polite"
        />
      )}
      <KeyPrompt
        action="gadget-2"
        label={text.viewDetails}
        onPress={actions.selectShown}
        skin="view-details"
      />
    </section>
  );
}
