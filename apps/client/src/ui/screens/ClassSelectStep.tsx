import { useId, type ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import type { ClassPanel } from '../../bridge/selectors/selectClassPanel';
import { selectAllyTiles } from '../../bridge/selectors/selectAllyTiles';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { AllyRoster } from '../components/AllyRoster';
import { GlowButton } from '../components/GlowButton';
import { InfoPanel } from '../components/InfoPanel';
import { KeyPrompt } from '../components/KeyPrompt';
import { STRINGS } from '../strings';
import type { SelectionStepProps } from './characterSelect.types';
import { ClassSelectCardRow } from './ClassSelectCardRow';
import { ClassSelectLegendStrip } from './ClassSelectLegendStrip';
import styles from './ClassSelectStep.module.css';
import { useClassSelectStep } from './useClassSelectStep';
import { useViewDetails } from './useViewDetails';
import { ViewDetailsScreen } from './ViewDetailsScreen';

const { characterSelect: text } = STRINGS;

/** The shown class's title, role line, description and rows: the step's panel and View Details'. */
const panelText = (panel: ClassPanel) =>
  ({
    title: panel.card.displayName,
    subtitle: panel.card.tagline,
    subtitleAccentToken: panel.card.accentToken,
    description: panel.description,
    rows: panel.details,
  }) as const;

/**
 * The class step of character select, primary layout (62:125): "Choose Your Class", the class
 * cards, the shown class's panel and Legends strip, Select Class and the allied roster. Picks are
 * local; only Select Class emits (`select-class { classId }`, HC-F1). V View Details (DEC-103)
 * opens the shown class's details full screen (`ViewDetailsScreen`): the same panel and Legends
 * strip in 145:2's places, each row labelled; the step is inert meanwhile. Reading and tab order:
 * the cards (one tab stop), then View Details, then Select Class. Paint order (Figma's layer
 * order, reference 15 §2): the card row is lifted above everything else by its own module; this
 * section creates no stacking context.
 */
export function ClassSelectStep({ preferredClassId }: SelectionStepProps): ReactElement {
  const model = useClassSelectStep(preferredClassId);
  const tiles = useAppSelector(selectAllyTiles);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
  /** Select Class's chrome plate, for every pick (CD-16); `null` = live CSS. */
  const chromeAssetId = useAppSelector(contentSlice.selectors.selectSelectClassChromeAssetId);
  const headingId = useId();
  const panelId = useId();
  const details = useViewDetails();
  const { panel, picked, actions } = model;
  return (
    <>
      <section className={styles.step} aria-labelledby={headingId} inert={details.isOpen}>
        <h2 id={headingId} className={styles.chooseTitle}>
          {text.chooseClass}
        </h2>
        <ClassSelectCardRow
          labelledBy={headingId}
          describedBy={panelId}
          cards={model.cards}
          allyCounts={model.allyCounts}
          pickedClassId={model.local.pickedClassId}
          previewClassId={model.local.previewClassId}
          tabbableIndex={model.tabbableIndex}
          autoFocusClassId={preferredClassId}
          rowPlate={model.rowPlate}
          onPick={actions.pick}
          onPreview={actions.preview}
          onCardKeyDown={model.onCardKeyDown}
        />
        {panel !== undefined && (
          <>
            <InfoPanel
              id={panelId}
              layout="class"
              detailsHeader={text.classDetailsHeader}
              {...panelText(panel)}
            />
            <ClassSelectLegendStrip items={panel.legendStrip} />
            <KeyPrompt
              action="view-details"
              label={text.viewDetails}
              onPress={details.open}
              skin="class-view-details"
            />
          </>
        )}
        <GlowButton
          label={text.selectClass}
          onPress={actions.selectPicked}
          skin="select-class"
          isDisabled={picked === undefined}
          disabledHint={text.selectClassHint}
          chromeAssetId={chromeAssetId}
        />
        {team !== null && (
          <AllyRoster
            tiles={tiles}
            layout="class-step"
            label={text.rosterLabel(teamNames[team])}
            playerSigilAssetId={picked?.art.sigil ?? null}
          />
        )}
      </section>
      {panel !== undefined && (
        <ViewDetailsScreen isOpen={details.isOpen} onClose={details.close}>
          <InfoPanel
            layout="class-details"
            detailsHeader={null}
            rowLabels={text.detailLabels}
            {...panelText(panel)}
          />
          <ClassSelectLegendStrip items={panel.legendStrip} placement="view-details" />
        </ViewDetailsScreen>
      )}
    </>
  );
}
