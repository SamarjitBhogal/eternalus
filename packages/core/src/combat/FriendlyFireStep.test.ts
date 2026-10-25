import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { FriendlyFireStep } from './FriendlyFireStep';

const CONFIG = createDefaultGameConfig();

/** entity-1 light, entity-2 light, entity-3 dark. */
const setUp = (): GameState => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  for (const team of ['light', 'light', 'dark'] as const) {
    state.entities.add(
      factory.create('light-mob', 'training-dummy', { position: { x: 0, y: 0 }, team }),
    );
  }
  return state;
};

const hit = (attackerId: string | null, targetId: string) => ({
  targetId,
  amount: 10,
  source: { attackerId, kind: 'weapon', definitionId: 'sword' } as const,
});

describe('FriendlyFireStep', () => {
  it('blocks a same-team hit and passes an enemy one', () => {
    const state = setUp();
    const step = new FriendlyFireStep();

    expect(step.adjust(hit('entity-1', 'entity-2'), state)).toBe(0);
    expect(step.adjust(hit('entity-1', 'entity-3'), state)).toBe(10);
  });

  it('passes damage with no attacker or against something with no team', () => {
    const state = setUp();
    const step = new FriendlyFireStep();

    expect(step.adjust(hit(null, 'entity-2'), state)).toBe(10);
    expect(step.adjust(hit('entity-1', 'tree-without-team'), state)).toBe(10);
  });
});
