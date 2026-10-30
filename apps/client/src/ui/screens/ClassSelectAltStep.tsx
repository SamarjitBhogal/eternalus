import type { ReactElement } from 'react';

import { isSelectableClass } from '../../bridge/selectionRules';
import { AssetImage } from '../components/AssetImage';
import { GlowButton } from '../components/GlowButton';
import { InfoPanel } from '../components/InfoPanel';
import { KeyPrompt } from '../components/KeyPrompt';
import { STRINGS } from '../strings';
import type { SelectionStepProps } from './characterSelect.types';
import { ClassDetailsScreen } from './ClassDetailsScreen';
import { ClassSelectAltArrow } from './ClassSelectAltArrow';
import styles from './ClassSelectAltStep.module.css';
import { useClassSelectStep } from './useClassSelectStep';
import { useViewDetails } from './useViewDetails';

const { characterSelect: text } = STRINGS;

/**
 * The class step, alternate layout (62:70; DEC-52, chosen by `classSelectLayout`): the shown
 * class's full-figure model between the vignettes, its panel with the layout's own copy and
 * icons (`layoutOverrides.alternate`), previous / next arrows over the available classes (CD-10),
 * "V View Details" at 62:84's place, which opens the class's details full screen as in the primary
 * layout (`ClassDetailsScreen`; the step is inert meanwhile), and Select Class, which selects the
 * shown class (`select-class`; DEC-109: View Details never selects). The title is live (`polite`):
 * the arrows change the panel without moving the focus. A class with no model shows its card art
 * in the model box (CD-13). After Back, View Details takes the focus (CD-11); on first entry
 * nothing is focused.
 */
export function ClassSelectAltStep({ preferredClassId }: SelectionStepProps): ReactElement {
  const { panel, actions } = useClassSelectStep(preferredClassId);
  const details = useViewDetails();
  const modelId = panel?.card.art.model ?? null;
  return (
    <>
      <section className={styles.step} aria-label={text.chooseClass} inert={details.isOpen}>
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
          action="view-details"
          label={text.viewDetails}
          onPress={details.open}
          skin="view-details"
          isAutoFocused={preferredClassId !== null}
        />
        {/* DEC-109. Recommendation: at the primary layout's place (788, 908), which 62:70 leaves
            empty; live CSS chrome, since the plate's group loads with the primary layout only. */}
        <GlowButton
          label={text.selectClass}
          onPress={actions.selectShown}
          skin="select-class"
          isDisabled={panel === undefined || !isSelectableClass(panel.card)}
          disabledHint={text.selectClassHint}
          chromeAssetId={null}
        />
      </section>
      {panel !== undefined && (
        <ClassDetailsScreen panel={panel} isOpen={details.isOpen} onClose={details.close} />
      )}
    </>
  );
}
