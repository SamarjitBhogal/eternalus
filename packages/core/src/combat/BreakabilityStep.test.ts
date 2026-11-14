import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { BreakabilityStep } from './BreakabilityStep';

const hit = (targetId: string) => ({
  targetId,
  amount: 10,
  source: { attackerId: null, kind: 'weapon', definitionId: 'sword' } as const,
});

describe('BreakabilityStep', () => {
  it('blocks a hit on an unbreakable target and passes one on a breakable target', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), STRUCTURE_DEFINITIONS);
    const gate = factory.create('gate', 'gate', { position: { x: 0, y: 0 }, team: 'dark' });
    state.entities.add(gate);
    const step = new BreakabilityStep();

    expect(step.adjust(hit(gate.id), state)).toBe(0);
    gate.getComponent(Collider).setUnbreakable(false);
    expect(step.adjust(hit(gate.id), state)).toBe(10);
    expect(step.adjust(hit('entity-404'), state)).toBe(10);
  });
});
