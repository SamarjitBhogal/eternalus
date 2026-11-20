import { describe, expect, it } from 'vitest';

import { casterState } from '../../abilities/__fixtures__/casterState';
import { Abilities } from '../../components/Abilities';
import type { Command } from '../Command.types';
import { CastAbilityHandler } from './CastAbilityHandler';

const CAST: Command<'cast-ability'> = {
  type: 'cast-ability',
  actorId: 'entity-1',
  slot: 'ability-1',
  aim: { point: { x: 3, y: 4 }, targetId: null },
};

describe('CastAbilityHandler', () => {
  it('queues the cast on the caster’s slot when the check passes', () => {
    const { state, factory, caster } = casterState();
    const handler = new CastAbilityHandler({ blockedBy: () => null });

    expect(handler.handle(CAST, { state, factory })).toBeNull();
    expect(caster.getComponent(Abilities).slot('ability-1')?.pendingCast).toEqual(CAST.aim);
  });

  it('returns the check’s reason and queues nothing when it fails', () => {
    const { state, factory, caster } = casterState();
    const handler = new CastAbilityHandler({ blockedBy: () => 'on-cooldown' });

    expect(handler.handle(CAST, { state, factory })).toBe('on-cooldown');
    expect(caster.getComponent(Abilities).hasPendingCast).toBe(false);
  });

  it('refuses as empty-slot when the actor has no ability bar, even if the check passed', () => {
    const { state, factory } = casterState();
    const handler = new CastAbilityHandler({ blockedBy: () => null });

    expect(handler.handle({ ...CAST, actorId: 'entity-404' }, { state, factory })).toBe(
      'empty-slot',
    );
  });
});
