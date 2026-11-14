import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { SCORING } from '../content/match/scoring';
import { createDefaultScoringRules } from './defaultScoringRules';
import { CaptureHoldRule } from './rules/CaptureHoldRule';
import { CheckpointRule } from './rules/CheckpointRule';
import { LegendDeathRule } from './rules/LegendDeathRule';
import { LegendHitRule } from './rules/LegendHitRule';
import { MobDeathRule } from './rules/MobDeathRule';
import { StructureDestroyedRule } from './rules/StructureDestroyedRule';
import { StructureHitRule } from './rules/StructureHitRule';

const rules = createDefaultScoringRules(SCORING, createDefaultGameConfig().tickRate);

describe('createDefaultScoringRules', () => {
  it('scores hits on Legends and structures only', () => {
    expect(Object.keys(rules.hits).sort()).toEqual(['legend', 'structure']);
    expect(rules.hits.legend).toBeInstanceOf(LegendHitRule);
    expect(rules.hits.structure).toBeInstanceOf(StructureHitRule);
  });

  it('scores deaths of Legends and mobs only', () => {
    expect(Object.keys(rules.deaths).sort()).toEqual(['legend', 'mob']);
    expect(rules.deaths.legend).toBeInstanceOf(LegendDeathRule);
    expect(rules.deaths.mob).toBeInstanceOf(MobDeathRule);
  });

  it('listens for fallen structures, then for reached checkpoints', () => {
    expect(rules.listeners).toHaveLength(2);
    expect(rules.listeners[0]).toBeInstanceOf(StructureDestroyedRule);
    expect(rules.listeners[1]).toBeInstanceOf(CheckpointRule);
  });

  it('scores held capture points each tick', () => {
    expect(rules.tickScorers).toHaveLength(1);
    expect(rules.tickScorers[0]).toBeInstanceOf(CaptureHoldRule);
  });
});
