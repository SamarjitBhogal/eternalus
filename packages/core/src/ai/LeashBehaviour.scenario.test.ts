import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { CombatSystem } from '../systems/CombatSystem';
import { engagingOn, setUp } from './__fixtures__/minionControllerSetup';

/*
 * The owner's HC-Q77 note, end to end: "Player do attack and hit enemy. Enemy hurt. Enemy fight
 * back. Nearby enemy help attacking enemy do attack if nearby enemy not already defending self or
 * attacking someone else." The real `CombatSystem` lands the player's aimed sweep, and the real
 * `MinionController` decides (DEC-322 (2), DEC-326 (2)).
 */

/**
 * A light horde (minions at 50, 56 and 63) and a dark Warrior at 57: 7 from the minion at 50 and
 * 6 from the one at 63, past their 5.4 reach and inside their 8.625 call for help.
 */
const scene = () => {
  const fixture = setUp();
  const self = fixture.add('light', 50);
  const idle = fixture.add('light', 63);
  const mate = fixture.add('light', 56);
  const player = fixture.add('dark', 57, 20, 'warrior', 'warrior');
  fixture.state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds: [self, idle, mate],
    progress: 40,
  });
  const combat = new CombatSystem({
    damage: new DamagePipeline(),
    factory: new EntityFactory(
      createDefaultEntityRegistry(),
      loadDefaultContent(30),
      undefined,
      loadWeapons(30),
    ),
  });
  /** The player clicks once, aimed at `point`: one sweep, then the button is released. */
  const click = (point: { readonly x: number; readonly y: number }) => {
    fixture.state.entities.setAttackAim(player, point);
    combat.update({ state: fixture.state, logger: new NullLogger() });
    fixture.state.entities.setAttackAim(player, null);
  };
  return { ...fixture, self, idle, mate, player, click };
};

describe('LeashBehaviour scenarios: the AI sees aimed hits, and a busy minion finishes its fight', () => {
  it('a player aims and hits a minion: its idle horde-mate answers, with no lock on the player (DEC-322 (2))', () => {
    const { state, decide, self, mate, player, click } = scene();
    const mateHealth = (): number => state.entities.healthFractionOf(mate) ?? 1;
    expect(decide(self).commands).toEqual([]);

    click({ x: 56, y: 20 });

    expect(mateHealth()).toBeLessThan(1);
    expect(state.entities.attackTargetOf(player)).toBeNull();
    expect(decide(self).commands).toEqual([
      { type: 'attack-target', actorId: self, targetId: player },
    ]);
  });

  it('a minion fighting a minion ignores a call for help; an idle one answers (DEC-326 (2))', () => {
    const { state, add, decide, self, idle, mate } = scene();
    const target = add('dark', 45); // in the reach of the minion at 50 only
    // An enemy minion hitting a horde-mate outranks the minion it fights (11 §4.3).
    const attacker = add('dark', 58);
    state.entities.setAttackTarget(attacker, mate);

    const busy = decide(self, engagingOn(target));
    expect(busy.commands).toEqual([]);
    expect(busy.memory).toMatchObject({ fsm: 'engaging', targetId: target });
    expect(decide(idle).commands).toEqual([
      { type: 'attack-target', actorId: idle, targetId: attacker },
    ]);
  });
});
