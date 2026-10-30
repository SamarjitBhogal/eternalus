import type { MatchPhaseRegistry } from './MatchPhaseState.types';
import { CountdownPhase } from './phases/CountdownPhase';
import { DefeatPhase } from './phases/DefeatPhase';
import { EarlyGamePhase } from './phases/EarlyGamePhase';
import { EndGamePhase } from './phases/EndGamePhase';
import { MidGamePhase } from './phases/MidGamePhase';
import { QuarterMarkPhase } from './phases/QuarterMarkPhase';
import { VictoryPhase } from './phases/VictoryPhase';

/** The phase registry: one line per phase, the only place that names the phase classes (12 §2). */
export const createDefaultMatchPhases = (): MatchPhaseRegistry => ({
  countdown: new CountdownPhase(),
  'early-game': new EarlyGamePhase(),
  'quarter-mark': new QuarterMarkPhase(),
  'mid-game': new MidGamePhase(),
  'end-game': new EndGamePhase(),
  victory: new VictoryPhase(),
  defeat: new DefeatPhase(),
});
