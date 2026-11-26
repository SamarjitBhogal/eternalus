import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { loadWeapons } from './content/weapons/loadWeapons';
import { RAPTOR_TALONS } from './content/weapons/raptorTalons';
import { WEAPONS } from './content/weapons/weaponCatalogue';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { recordReplay, runReplay } from './diagnostics/replay';
import { Simulation } from './Simulation';
import type { Replay, ReplaySetup } from './Simulation.types';
import type { Vec2 } from './utils/geometry.types';

const SETUP: ReplaySetup = {
  config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
  seed: 5,
};
const WARRIOR = 'entity-1';
const FRONT = 'entity-2';
const BEHIND = 'entity-3';
/** The aim is held from tick 1 to this tick: two Raptor Talons swings (0.7 s apart), not three. */
const RELEASE_TICK = 30;
const TICKS = 90;

const createMatch = ({ config, seed }: ReplaySetup): Simulation =>
  new Simulation({ config, seed, logger: new NullLogger(), debug: TEST_DEBUG_CONFIG });

const spawn = (kind: string, definitionId: string, x: number, team: 'light' | 'dark'): Command => ({
  type: 'dev-spawn',
  kind,
  definitionId,
  team,
  at: { x, y: 0 },
  count: 1,
});

/**
 * A Warrior (`entity-1`) with a dark training dummy 2 m east (`entity-2`) and 2 m west
 * (`entity-3`). The player holds `attack-aim` towards `aim` from tick 1, and lets go at
 * `RELEASE_TICK` (`aim: null`).
 */
const holdAim =
  (aim: Vec2) =>
  (tick: number): readonly Command[] => {
    if (tick === 0) {
      return [
        spawn('warrior', 'warrior', 0, 'light'),
        spawn('light-mob', 'training-dummy', 2, 'dark'),
        spawn('light-mob', 'training-dummy', -2, 'dark'),
      ];
    }
    if (tick === 1) return [{ type: 'attack-aim', actorId: WARRIOR, aim }];
    if (tick === RELEASE_TICK) return [{ type: 'attack-aim', actorId: WARRIOR, aim: null }];
    return [];
  };

const play = (live: Simulation, aim: Vec2): Replay =>
  recordReplay(SETUP, { ticks: TICKS, checkpointEvery: 10, commandsFor: holdAim(aim) }, () => live);

describe('Simulation: aimed attacks (DEC-184, DEC-319)', () => {
  it('sweeps the body in front of the aim with no target, spares the one behind, and stops on release', () => {
    // Talons without bleed (DEC-374 W5): bleed would kill the front dummy. This test checks the
    // sweep, not bleed.
    const noBleed = loadWeapons(
      SETUP.config.tickRate,
      WEAPONS.all().map((weapon) =>
        weapon.id === RAPTOR_TALONS.id
          ? { ...weapon, attacks: weapon.attacks.map((attack) => ({ ...attack, onHit: [] })) }
          : weapon,
      ),
    );
    const live = new Simulation({
      config: SETUP.config,
      seed: SETUP.seed,
      logger: new NullLogger(),
      debug: TEST_DEBUG_CONFIG,
      weapons: noBleed,
    });
    const hits: { readonly tick: number; readonly targetId: string }[] = [];
    live.on('damage-applied', ({ targetId, source }) => {
      if (source.attackerId === WARRIOR) hits.push({ tick: live.tick, targetId });
    });

    play(live, { x: 5, y: 0 });

    expect(hits.length).toBe(2);
    expect(hits.every(({ targetId }) => targetId === FRONT)).toBe(true);
    expect(hits.every(({ tick }) => tick <= RELEASE_TICK)).toBe(true);
    const health = (id: string) => live.snapshot().entities.find((e) => e.id === id)?.health;
    expect(health(BEHIND)?.current).toBe(health(BEHIND)?.max);
    expect(health(FRONT)?.current).toBeLessThan(health(FRONT)?.max ?? 0);
  });

  it('replays the aimed attack the same after a JSON round trip', () => {
    const live = createMatch(SETUP);
    const recorded = play(live, { x: 5, y: 0 });

    const parsed = JSON.parse(JSON.stringify(recorded)) as Replay;

    expect(recorded.commands.map(({ command }) => command.type)).toContain('attack-aim');
    expect(runReplay(parsed, createMatch)).toEqual({
      firstDivergence: null,
      finalHash: live.hash(),
    });
  });

  it('is deterministic: the same aim twice gives the same hash, the other way a different one', () => {
    const hashAfter = (aim: Vec2): number => {
      const live = createMatch(SETUP);
      play(live, aim);
      return live.hash();
    };

    expect(hashAfter({ x: 5, y: 0 })).toBe(hashAfter({ x: 5, y: 0 }));
    expect(hashAfter({ x: -5, y: 0 })).not.toBe(hashAfter({ x: 5, y: 0 }));
  });
});
