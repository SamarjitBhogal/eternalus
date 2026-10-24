import { type ComponentType, type ReactElement, useState } from 'react';

import type { ClassSelectLayout } from '../../bridge/catalogue.types';
import type { LegendClassId } from '../../bridge/domain.types';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { Countdown } from '../components/Countdown';
import { ScreenFrame } from '../components/ScreenFrame';
import { SelectionBanner } from '../components/SelectionBanner';
import { SelectionDefs } from '../components/SelectionDefs';
import { SelectionStage, type VignetteEdge } from '../components/SelectionStage';
import { TeamBadge } from '../components/TeamBadge';
import { STRINGS } from '../strings';
import type { SelectionStep, SelectionStepProps } from './characterSelect.types';
import { ClassSelectAltStep } from './ClassSelectAltStep';
import { ClassSelectStep } from './ClassSelectStep';
import { rememberedClassId } from './classStepState';
import { LegendSelectStep } from './LegendSelectStep';

/** Which component draws the class step (O5: a content switch, never a player setting). */
const CLASS_STEP_LAYOUTS: Readonly<Record<ClassSelectLayout, ComponentType<SelectionStepProps>>> = {
  primary: ClassSelectStep,
  alternate: ClassSelectAltStep,
};

/** The class step in the catalogue's layout. */
function ClassStep(props: SelectionStepProps): ReactElement {
  const layout = useAppSelector(contentSlice.selectors.selectClassSelectLayout);
  const Layout = CLASS_STEP_LAYOUTS[layout];
  return <Layout {...props} />;
}

/** Which component draws each step of the phase (F1). */
const SELECTION_STEPS: Readonly<Record<SelectionStep, ComponentType<SelectionStepProps>>> = {
  class: ClassStep,
  legend: LegendSelectStep,
};

/** Vignettes per step: 62:125 and 62:70 darken both edges, 58:271 only the bottom. */
const STEP_VIGNETTES: Readonly<Record<SelectionStep, readonly VignetteEdge[]>> = {
  class: ['top', 'bottom'],
  legend: ['bottom'],
};

/** The session's countdown; the only reader of the 1 Hz value, so the steps never re-render on it. */
function SessionCountdown(): ReactElement {
  const seconds = useAppSelector(matchSetupSlice.selectors.selectCountdownSeconds);
  return <Countdown remainingSeconds={seconds} />;
}

/**
 * Character select (13 §2, reference 14 §2): the shell of both steps on one scaled artboard.
 * The step follows the session (the class step until a class is selected, F1); the shared SVG
 * defs come first, the banner, countdown and team badge after the step. It remembers the last
 * selected class, so Back from the Legend step returns to it, picked and focused (CD-11). Takes
 * no props: it never renders the game viewport `App` passes every screen.
 */
export function CharacterSelectScreen(): ReactElement {
  const { classId } = useAppSelector(matchSetupSlice.selectors.selectSelection);
  const team = useAppSelector(matchSetupSlice.selectors.selectPlayerTeam);
  const bannerAssetId = useAppSelector(contentSlice.selectors.selectSelectionBannerAssetId);
  const [lastClassId, setLastClassId] = useState<LegendClassId | null>(classId);
  const preferredClassId = rememberedClassId(lastClassId, classId);
  if (preferredClassId !== lastClassId) setLastClassId(preferredClassId);
  const step: SelectionStep = classId === null ? 'class' : 'legend';
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
