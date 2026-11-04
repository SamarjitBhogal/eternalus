import type { ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { selectAllyTiles } from '../../bridge/selectors/selectAllyTiles';
import { selectLegendStepView } from '../../bridge/selectors/selectLegendStepView';
import { selectSelectedClassCard } from '../../bridge/selectors/selectSelectedClassCard';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { AllyRoster } from '../components/AllyRoster';
import { AssetImage } from '../components/AssetImage';
import { STRINGS } from '../strings';
import { LegendDetailsPanel } from './LegendDetailsPanel';
import styles from './LockedSelectStep.module.css';

const { characterSelect: text } = STRINGS;

/**
 * The locked view of character select, from LOCK IN until the countdown ends (DEC-60): the locked
 * Legend's details on the left (`LegendDetailsPanel`, its title taking the focus LOCK IN had), the
 * Legend standing in the centre with no frame, and the allied roster, bots' Legends filled, on the
 * right; the shell keeps the banner and the countdown above. No cards, breadcrumb, LOCK IN or Back
 * (Esc): their actions are gone with them. The figure is the Legend's card art, else the class
 * model, else the class card art (no full-figure Legend art exists yet). `null` before a class
 * is picked. The layout is not in the owner's Figma (DEC-60's recorder's note).
 */
export function LockedSelectStep(): ReactElement | null {
  const view = useAppSelector(selectLegendStepView);
  const classCard = useAppSelector(selectSelectedClassCard);
  const tiles = useAppSelector(selectAllyTiles);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const teamNames = useAppSelector(contentSlice.selectors.selectTeamNames);
  if (view === null || classCard === undefined) return null;
  const legend = view.legends.find((candidate) => candidate.isPicked);
  const figure = legend?.cardArtAssetId ?? classCard.art.model ?? classCard.art.card;
  return (
    <section className={styles.step}>
      {legend !== undefined && <LegendDetailsPanel legend={legend} shouldFocusTitle />}
      <AssetImage assetId={figure} className={styles.figure} />
      {team !== null && (
        <AllyRoster tiles={tiles} layout="legend-step" label={text.rosterLabel(teamNames[team])} />
      )}
    </section>
  );
}
