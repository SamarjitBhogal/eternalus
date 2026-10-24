import { useId, type ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectAllyTiles } from '../../bridge/selectors/selectAllyTiles';
import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { AllyRoster } from '../components/AllyRoster';
import { GlowButton } from '../components/GlowButton';
import { InfoPanel } from '../components/InfoPanel';
import { KeyPrompt } from '../components/KeyPrompt';
import { STRINGS } from '../strings';
import { LegendSelectCardRow } from './LegendSelectCardRow';
import { LegendSelectRatingBar } from './LegendSelectRatingBar';
import styles from './LegendSelectStep.module.css';
import { useLegendSelectStep } from './useLegendSelectStep';

const { characterSelect: text } = STRINGS;

/**
 * The panel's role line (57:35): "<title>  ·  <role>"; with no role, the title alone under a
 * Legend name, and nothing when the panel title already is the sub-class title (CD-13).
 */
function roleLine(legend: LegendCardView): string | null {
  if (legend.roleLabel !== null) return text.detailLine(legend.subClassName, legend.roleLabel);
  return legend.legendName === null ? null : legend.subClassName;
}

/**
 * The Legend step of character select (58:271): the breadcrumb, the shown Legend's panel and
 * rating bars, the Legend cards, LOCK IN, Back (`pause-menu`, F7) and the allied roster; `null`
 * on the class step. A pick emits `select-class {classId, specId}`, LOCK IN `confirm-selection`
 * (only while `canLockIn`), Back `clear-class-selection`. Paint order (§5.15): the picked
 * Legend's row plate is the section's first child, so everything Figma draws above 61:3 paints
 * above it; LOCK IN takes its chrome plate only while the row plate is drawn (FID-R4-01).
 */
export function LegendSelectStep(): ReactElement | null {
  const model = useLegendSelectStep();
  const tiles = useAppSelector(selectAllyTiles);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const headingId = useId();
  if (model === null) return null;
  const { view, shown, actions, rowPlate } = model;
  return (
    <section className={styles.step} aria-labelledby={headingId}>
      {rowPlate !== null && (
        <img
          className={styles.rowPlate}
          src={rowPlate.url}
          style={rowPlate.box}
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
        />
      )}
      <h2 id={headingId} className={styles.breadcrumb}>
        {text.legendBreadcrumb(view.classDisplayName)}
      </h2>
      {shown !== null && (
        <>
          <InfoPanel
            layout="legend"
            title={shown.legendName ?? shown.subClassName}
            subtitle={roleLine(shown)}
            subtitleAccentToken={shown.accentToken}
            description={shown.description}
            detailsHeader={text.legendDetailsHeader}
            rows={shown.details}
          />
          <div className={styles.ratings}>
            {shown.ratings.map(({ axis, value }) => (
              <LegendSelectRatingBar key={axis} label={text.ratingAxes[axis]} value={value} />
            ))}
          </div>
        </>
      )}
      <LegendSelectCardRow
        labelledBy={headingId}
        legends={view.legends}
        tabbableIndex={model.tabbableIndex}
        isRowPlateShown={rowPlate !== null}
        onPick={actions.pick}
        onPreview={model.onPreview}
        onCardKeyDown={model.onCardKeyDown}
      />
      <GlowButton
        label={text.lockIn}
        onPress={actions.lockIn}
        skin="lock-in"
        isDisabled={!view.canLockIn}
        disabledHint={text.lockInHint}
        chromeAssetId={model.lockInChromeAssetId}
      />
      <KeyPrompt action="pause-menu" label={text.back} onPress={actions.back} skin="legend-back" />
      {team !== null && (
        <AllyRoster
          tiles={tiles}
          layout="legend-step"
          label={text.rosterLabel(text.teamNames[team])}
        />
      )}
    </section>
  );
}
