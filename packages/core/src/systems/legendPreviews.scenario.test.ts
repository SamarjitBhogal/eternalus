import { describe, expect, it } from 'vitest';
import { Simulation } from '../Simulation';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import type { AbilitySlot } from '../commands/Command.types';

function setup(kind: 'warrior' | 'sentinel') {
  const simulation = new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed: 6,
    logger: new NullLogger(),
  });
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind,
    definitionId: kind,
    team: 'light',
    at: { x: 0, y: 0 },
    count: 1,
  });
  simulation.step();
  return simulation;
}

describe('documented melee-class animation previews', () => {
  it.each([
    ['warrior', ['veil', 'blade-runner', 'hamstring', 'fury']],
    ['sentinel', ['shield-wall', 'sunder', 'colossus-roar', 'meteor-fall']],
  ] as const)(
    'previews every %s slot without effects or costs, with deterministic commands',
    (kind, expected) => {
      const a = setup(kind),
        b = setup(kind);
      const before = a.snapshot().entities[0];
      const previews: string[] = [],
        casts: string[] = [];
      a.on('ability-previewed', ({ abilityId }) => previews.push(abilityId));
      a.on('ability-cast', ({ abilityId }) => casts.push(abilityId));
      for (const slot of [
        'ability-1',
        'ability-2',
        'ability-3',
        'ability-4',
      ] as const satisfies readonly AbilitySlot[]) {
        for (const sim of [a, b]) {
          sim.enqueueCommand({
            type: 'cast-ability',
            actorId: 'entity-1',
            slot,
            aim: { point: { x: 10, y: 10 }, targetId: null },
          });
          sim.step();
        }
        expect(a.hash()).toBe(b.hash());
      }
      expect(previews).toEqual(expected);
      expect(casts).toEqual([]);
      expect(a.snapshot().entities).toEqual([before]);
    },
  );
});
