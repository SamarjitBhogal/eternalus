import { useId, type ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectAllyTiles } from '../../bridge/selectors/selectAllyTiles';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { AllyRoster } from '../components/AllyRoster';
import { GlowButton } from '../components/GlowButton';
import { KeyPrompt } from '../components/KeyPrompt';
import { STRINGS } from '../strings';
import { LegendDetailsPanel } from './LegendDetailsPanel';
import { LegendSelectCardRow } from './LegendSelectCardRow';
import styles from './LegendSelectStep.module.css';
import { useLegendSelectStep } from './useLegendSelectStep';

const { characterSelect: text } = STRINGS;

/**
 * The Legend step of character select (58:271): the breadcrumb, the shown Legend's panel and
 * rating bars (`LegendDetailsPanel`), the Legend cards, LOCK IN, Back (`pause-menu`, HC-F7) and the allied roster; `null`
 * on the class step. A pick emits `select-class {classId, specId}`, LOCK IN `confirm-selection`
 * (only while `canLockIn`), Back `clear-class-selection`. Paint order (Figma's layer order,
 * reference 15 §2): the picked Legend's row plate is the section's first child, so everything
 * Figma draws above 61:3 paints above it; LOCK IN takes its chrome plate only while the row plate
 * is drawn (CD-16).
 */
export function LegendSelectStep(): ReactElement | null {
  const model = useLegendSelectStep();
  const tiles = useAppSelector(selectAllyTiles);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
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
      {shown !== null && <LegendDetailsPanel legend={shown} />}
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
      {/* DEC-60: Esc (Back) shows on the Legend step only: never on the class step, and the
          locked view drops it. */}
      <KeyPrompt action="pause-menu" label={text.back} onPress={actions.back} skin="legend-back" />
      {team !== null && (
        <AllyRoster tiles={tiles} layout="legend-step" label={text.rosterLabel(teamNames[team])} />
      )}
    </section>
  );
}
