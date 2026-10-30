import type { ComponentType, ReactElement } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { ScreenFrame } from '../components/ScreenFrame';
import { SelectionBanner } from '../components/SelectionBanner';
import { SelectionDefs } from '../components/SelectionDefs';
import { SelectionStage, type VignetteEdge } from '../components/SelectionStage';
import { TeamBadge } from '../components/TeamBadge';
import { STRINGS } from '../strings';
import type { SelectionStep, SelectionStepProps } from './characterSelect.types';
import { ClassStep } from './ClassStep';
import { LegendSelectStep } from './LegendSelectStep';
import { LockedSelectStep } from './LockedSelectStep';
import { SessionCountdown } from './SessionCountdown';
import { useRememberedClassId } from './useRememberedClassId';

/** Which component draws each step of the phase (HC-F1; the locked view, DEC-60). */
const SELECTION_STEPS: Readonly<Record<SelectionStep, ComponentType<SelectionStepProps>>> = {
  class: ClassStep,
  legend: LegendSelectStep,
  locked: LockedSelectStep,
};

/**
 * Vignettes per step: 62:125 and 62:70 darken both edges, 58:271 only the bottom. The locked view
 * keeps the Legend step's (DEC-60: LOCK IN "keeps the user on their selected character screen").
 */
const STEP_VIGNETTES: Readonly<Record<SelectionStep, readonly VignetteEdge[]>> = {
  class: ['top', 'bottom'],
  legend: ['bottom'],
  locked: ['bottom'],
};

/**
 * Character select (13 §2, reference 14 §2): the shell of its steps on one scaled artboard.
 * The step follows the session (the class step until a class is selected, HC-F1; the locked view
 * from LOCK IN until the countdown ends, DEC-60); the shared SVG
 * defs come first, the banner, countdown and team badge after the step. It remembers the last
 * selected class, so Back from the Legend step returns to it, picked and focused (CD-11). Takes
 * no props: it never renders the game viewport `App` passes every screen.
 */
export function CharacterSelectScreen(): ReactElement {
  const { classId } = useAppSelector(matchSetupSlice.selectors.selectSelection);
  const isLockedIn = useAppSelector(matchSetupSlice.selectors.selectIsLockedIn);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const bannerAssetId = useAppSelector(contentSlice.selectors.selectSelectionBannerAssetId);
  const preferredClassId = useRememberedClassId(classId);
  const step: SelectionStep = isLockedIn ? 'locked' : classId === null ? 'class' : 'legend';
  const Step = SELECTION_STEPS[step];
  return (
    <ScreenFrame team={team ?? 'neutral'} layout="stage">
      <SelectionStage vignettes={STEP_VIGNETTES[step]}>
        <SelectionDefs />
        <Step preferredClassId={preferredClassId} />
        <SelectionBanner
          title={STRINGS.characterSelect.bannerTitle}
          bannerAssetId={bannerAssetId}
        />
        <SessionCountdown />
        <TeamBadge team={team} />
      </SelectionStage>
    </ScreenFrame>
  );
}
