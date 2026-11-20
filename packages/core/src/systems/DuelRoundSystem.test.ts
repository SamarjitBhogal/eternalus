import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Abilities } from '../components/Abilities';
import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { Transform } from '../components/Transform';
import { TeamMembership } from '../components/TeamMembership';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import { Entity } from '../entities/Entity';
import { KillCountCondition } from '../match/conditions/KillCountCondition';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import { DuelRoundSystem } from './DuelRoundSystem';

const STARTS = { light: { x: 10, y: 5 }, dark: { x: 30, y: 5 } };

/** A test Legend or mob: its components are added by the helpers below. */
class Fighter extends Entity {
  public readonly kind = 'fighter';
  public readonly family = 'test';

  protected installComponents(): void {
    // The helpers add the components.
  }
}

const setUp = (killTarget = 10) => {
  const state = new GameState(createDefaultGameConfig(), 1);
  state.match.startDuel(killTarget);
  const damage = new DamagePipeline();
  const applier = new StatusEffectApplier(loadStatusEffects(30, 2));
  const system = new DuelRoundSystem(STARTS, applier);
  let next = 0;
  const add = (team: PlayableTeam | 'neutral', isSeat: boolean): Entity => {
    next += 1;
    const entity = new Fighter(`entity-${String(next)}`, 'fighter');
    entity.addComponent(new Health(10));
    entity.addComponent(new Transform({ x: 99, y: 99 }, 1));
    entity.addComponent(new TeamMembership(team));
    state.entities.add(entity);
    if (isSeat && team !== 'neutral') state.match.seatHuman(entity.id, team);
    return entity;
  };
  const hit = (victim: Entity, attacker: Entity | null): void => {
    damage.apply(state, victim.id, 10, {
      attackerId: attacker?.id ?? null,
      kind: 'weapon',
      definitionId: 'test',
    });
  };
  const run = (): void => {
    system.update({ state, logger: new NullLogger() });
  };
  return { state, applier, add, hit, run };
};

describe('DuelRoundSystem', () => {
  it('counts the kill for the other team and resets both seats to their start points at full health', () => {
    const { state, add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    hit(dark, light);
    light.getComponent(Health).applyDamage(4);

    run();

    expect(state.match.duel?.kills).toEqual({ light: 1, dark: 0 });
    for (const [legend, team] of [
      [light, 'light'],
      [dark, 'dark'],
    ] as const) {
      expect(legend.getComponent(Health).current).toBe(10);
      expect(legend.getComponent(Transform).position).toEqual(STARTS[team]);
    }
  });

  it('counts both kills when both seats die on the same tick', () => {
    const { state, add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    hit(light, dark);
    hit(dark, light);

    run();

    expect(state.match.duel?.kills).toEqual({ light: 1, dark: 1 });
    expect(light.getComponent(Health).isDead).toBe(false);
    expect(dark.getComponent(Health).isDead).toBe(false);
  });

  it("counts a seat Legend's death by a mob for the other team", () => {
    const { state, add, hit, run } = setUp();
    const mob = add('neutral', false);
    const light = add('light', true);
    add('dark', true);
    hit(light, mob);

    run();

    expect(state.match.duel?.kills).toEqual({ light: 0, dark: 1 });
  });

  it('does nothing while both seats live', () => {
    const { state, add, run } = setUp();
    const light = add('light', true);
    add('dark', true);

    run();

    expect(state.match.duel?.kills).toEqual({ light: 0, dark: 0 });
    expect(light.getComponent(Transform).position).toEqual({ x: 99, y: 99 });
  });

  it('drops the attack target of a reset Legend', () => {
    const { add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    light.addComponent(new Combat({ strategy: 'melee', damage: 1, reach: 1, interval: 1 }));
    light.getComponent(Combat).setTarget(dark.id);
    hit(dark, light);

    run();

    expect(light.getComponent(Combat).targetId).toBeNull();
  });

  it('drops the status effects of a reset Legend, so a damage over time cannot kill it next', () => {
    const { add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    const statuses = new StatusEffects();
    statuses.apply(loadStatusEffects(30, 2).get('bleed'), dark.id, 0);
    light.addComponent(statuses);
    hit(dark, light);

    run();

    expect(statuses.active).toHaveLength(0);
  });

  it('ends each status through the applier: one status-expired each, and Fury takes its dash with it', () => {
    const { state, applier, add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    light.addComponent(new StatusEffects());
    const bar = new Abilities({
      abilities: ['blade-runner', 'veil', 'hamstring'],
      ultimate: 'fury',
    });
    light.addComponent(bar);
    applier.apply(state, light.id, 'fury', light.id);
    applier.apply(state, light.id, 'bleed', dark.id);
    const expired: GameEventMap['status-expired'][] = [];
    state.events.on('status-expired', (payload) => expired.push(payload));
    hit(dark, light);

    run();

    expect(bar.slot('granted')?.abilityId).toBeNull();
    expect(expired).toEqual([
      { entityId: light.id, statusId: 'fury', sourceId: light.id },
      { entityId: light.id, statusId: 'bleed', sourceId: dark.id },
    ]);
  });

  it('ends the dash or knock-back of a reset Legend, so it does not slide off its start point', () => {
    const { add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    const movement = new Movement({ maxSpeed: 1, acceleration: 1, mass: 1 });
    movement.push({ x: 6, y: 0 }, 3);
    light.addComponent(movement);
    hit(dark, light);

    run();

    expect(movement.isForced).toBe(false);
  });

  it('drops the steps still to come of a reset Legend’s casts (Fury’s dash after its wind-up)', () => {
    const { add, hit, run } = setUp();
    const light = add('light', true);
    const dark = add('dark', true);
    const bar = new Abilities({
      abilities: ['blade-runner', 'veil', 'hamstring'],
      ultimate: 'fury',
    });
    bar.keepCast({
      abilityId: 'fury-dash',
      slot: 'granted',
      aim: { point: { x: 100, y: 99 }, targetId: null },
      origin: { x: 99, y: 99 },
      casterLevel: 1,
      tick: 0,
      nextStep: 1,
    });
    light.addComponent(bar);
    hit(dark, light);

    run();

    expect(bar.castsInProgress).toEqual([]);
  });

  it('ends in a draw when both teams reach the target on one tick', () => {
    const { state, add, hit, run } = setUp(1);
    const light = add('light', true);
    const dark = add('dark', true);
    hit(light, dark);
    hit(dark, light);

    run();

    expect(new KillCountCondition().check({ state, enterPhase: () => undefined })).toEqual({
      winner: null,
      condition: 'kill-count',
    });
  });
});
