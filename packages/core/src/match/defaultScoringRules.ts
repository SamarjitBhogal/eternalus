import type { ScoringOptions } from '../content/match/scoring.types';
import { TickRate } from '../utils/TickRate';
import { CaptureHoldRule } from './rules/CaptureHoldRule';
import { CheckpointRule } from './rules/CheckpointRule';
import { LegendDeathRule } from './rules/LegendDeathRule';
import { LegendHitRule } from './rules/LegendHitRule';
import { MobDeathRule } from './rules/MobDeathRule';
import { StructureDestroyedRule } from './rules/StructureDestroyedRule';
import { StructureHitRule } from './rules/StructureHitRule';
import type { ScoringRules } from './ScoringRule.types';

/** Seconds in a minute: hold points come per full minute of held time (DEC-214 (A2)). */
const SECONDS_PER_MINUTE = 60;

/**
 * The scoring rules (architecture 12 §5): the only file that names them. Each rule takes its
 * points from `options` (`content/match/scoring.ts`) by constructor, and its times in ticks at
 * `tickRate`. A new scored family, event or per-tick score is a rule file and one line here; the
 * listeners subscribe when `Scoring` is built, and the tick scorers fold in list order.
 */
export const createDefaultScoringRules = (
  { weights, assistWindowSeconds }: ScoringOptions,
  tickRate: number,
): ScoringRules => {
  const ticks = new TickRate(tickRate);
  return {
    hits: { legend: new LegendHitRule(), structure: new StructureHitRule() },
    deaths: {
      legend: new LegendDeathRule(weights, ticks.toTicks(assistWindowSeconds)),
      mob: new MobDeathRule(weights.minionKill),
    },
    listeners: [
      new StructureDestroyedRule(weights.structureDestroyed),
      new CheckpointRule(weights.captureCheckpoint),
    ],
    tickScorers: [new CaptureHoldRule(weights.holdPerMinute, ticks.toTicks(SECONDS_PER_MINUTE))],
  };
};
