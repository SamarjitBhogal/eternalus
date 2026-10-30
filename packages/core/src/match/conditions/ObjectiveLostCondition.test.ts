import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../../combat/DamagePipeline';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { WinObjective } from '../../components/WinObjective';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { DeathSystem } from '../../systems/DeathSystem';
import { GameState } from '../../state/GameState';
import { NullLogger } from '../../diagnostics/NullLogger';
import type { Team } from '../../teams/teams.types';
import type { DirectorContext } from '../DirectorContext.types';
import { ObjectiveLostCondition } from './ObjectiveLostCondition';

/** A test entity with health and a team, and a win objective when asked. */
class Banner extends Entity {
  public readonly kind = 'banner';
  public readonly family = 'test';

  protected installComponents(): void {
    // `addBanner` adds the components.
  }
}

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const condition = new ObjectiveLostCondition(state);
  const damage = new DamagePipeline();
  const context: DirectorContext = { state, enterPhase: () => undefined };
  let next = 0;
  const addBanner = (team: Team, isObjective = true): Entity => {
    next += 1;
    const banner = new Banner(`entity-${String(next)}`, 'banner');
    banner.addComponent(new Health(10));
    banner.addComponent(new TeamMembership(team));
    if (isObjective) {
      banner.addComponent(new WinObjective());
    }
    state.entities.add(banner);
    return banner;
  };
  /** Kills `banner` through the damage pipeline, as a hit would. */
  const kill = (banner: Entity): void => {
    damage.apply(state, banner.id, 10, {
      attackerId: null,
      kind: 'environment',
      definitionId: 'test',
    });
  };
  /** Runs `DeathSystem` (which removes and retires the dead), then the check, as a tick does. */
  const endTick = () => {
    new DeathSystem().update({ state, logger: new NullLogger() });
    return condition.check(context);
  };
  /** The check alone: no `DeathSystem`, so a dead entity stays in the store. */
  const check = () => condition.check(context);
  const addToStore = (entity: Entity): void => {
    state.entities.add(entity);
  };
  return { addBanner, kill, endTick, check, addToStore };
};

describe('ObjectiveLostCondition', () => {
  it.each<['light' | 'dark', 'light' | 'dark']>([
    ['light', 'dark'],
    ['dark', 'light'],
  ])("gives the win to the other side when %s's last objective dies", (loser, winner) => {
    const { addBanner, kill, endTick } = setUp();
    addBanner(winner);
    kill(addBanner(loser));

    expect(endTick()).toEqual({ winner, condition: 'objective-lost' });
  });

  it('gives no verdict while the team has another live objective', () => {
    const { addBanner, kill, endTick } = setUp();
    const first = addBanner('light');
    addBanner('light');

    kill(first);

    expect(endTick()).toBeNull();
  });

  it("calls a draw when both sides' last objectives die on one tick", () => {
    const { addBanner, kill, endTick } = setUp();
    const light = addBanner('light');
    const dark = addBanner('dark');

    kill(dark);
    kill(light);

    expect(endTick()).toEqual({ winner: null, condition: 'objective-lost' });
  });

  it('ignores a death without WinObjective, and the death of a neutral objective', () => {
    const { addBanner, kill, endTick } = setUp();
    kill(addBanner('light', false));
    kill(addBanner('neutral'));

    expect(endTick()).toBeNull();
  });

  it('drains its records on every check, so a death is judged only on its own tick', () => {
    const { addBanner, kill, endTick } = setUp();
    const first = addBanner('light');
    const second = addBanner('light');
    kill(first);
    expect(endTick()).toBeNull();

    // Removed without a death event: the recorded first death must not be judged again.
    second.getComponent(Health).applyDamage(10);

    expect(endTick()).toBeNull();
  });

  it('ignores a dead objective still in the store: the other team wins', () => {
    const { addBanner, kill, check } = setUp();
    addBanner('dark');
    const other = addBanner('light');
    other.getComponent(Health).applyDamage(10);
    kill(addBanner('light'));

    expect(check()).toEqual({ winner: 'dark', condition: 'objective-lost' });
  });

  it('counts an objective with no Health as alive: no verdict', () => {
    const { addBanner, kill, check, addToStore } = setUp();
    const healthless = new Banner('entity-90', 'banner');
    healthless.addComponent(new TeamMembership('light'));
    healthless.addComponent(new WinObjective());
    const dying = addBanner('light');
    addToStore(healthless);
    kill(dying);

    expect(check()).toBeNull();
  });
});
