import type { ScoringOptions } from '../content/match/scoring.types';
import { CaptureHoldRule } from './rules/CaptureHoldRule';
import { CheckpointRule } from './rules/CheckpointRule';
import { LegendDeathRule } from './rules/LegendDeathRule';
import { LegendHitRule } from './rules/LegendHitRule';
import { MobDeathRule } from './rules/MobDeathRule';
import { StructureDestroyedRule } from './rules/StructureDestroyedRule';
import { StructureHitRule } from './rules/StructureHitRule';
import type { ScoringRules } from './ScoringRule.types';

/**
 * The scoring rules (architecture 12 §5): the only file that names them. Each rule takes its
 * points and its times from `options` by constructor, in ticks as `loadScoring` loaded them
 * (DEC-287), so the factory converts nothing. A new scored family, event or per-tick score is a
 * rule file and one line here; the listeners subscribe when `Scoring` is built, and the tick
 * scorers fold in list order.
 */
export const createDefaultScoringRules = ({
  weights,
  bossIds,
  assistWindowTicks,
  minuteTicks,
}: ScoringOptions): ScoringRules => ({
  hits: { legend: new LegendHitRule(), structure: new StructureHitRule() },
  deaths: {
    legend: new LegendDeathRule(weights, assistWindowTicks),
    mob: new MobDeathRule(weights.minionKill, bossIds),
  },
  listeners: [
    new StructureDestroyedRule(weights.structureDestroyed),
    new CheckpointRule(weights.captureCheckpoint),
  ],
  tickScorers: [new CaptureHoldRule(weights.holdPerMinute, minuteTicks)],
});
