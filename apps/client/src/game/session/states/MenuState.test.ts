import { describe, expect, it } from 'vitest';

import { filledRostersFixture } from '../../__fixtures__/filledRosters';
import { FakeSessionContext } from '../../FakeSessionContext';
import { MenuState } from './MenuState';

describe('MenuState', () => {
  it("releases the match's assets once, drops the setup and shows the home route", () => {
    const context = new FakeSessionContext();
    const routes: string[] = [];
    context.bus.on('menu-route', ({ route }) => routes.push(route));

    new MenuState().enter(context);

    expect(context.calls.releaseAssets).toEqual([['match']]);
    expect(context.calls.clearMatchSetup).toHaveLength(1);
    expect(routes).toEqual(['home']);
  });

  it('also releases the sprite sheet group of every Legend in the match, before it drops the setup', () => {
    const context = new FakeSessionContext();
    context.lockedRosters = filledRostersFixture({ player: 'oracle', enemies: ['knight'] });

    new MenuState().enter(context);

    expect(context.calls.releaseAssets).toEqual([['match'], ['atlas-oracle'], ['atlas-knight']]);
    expect(context.order.indexOf('releaseAssets')).toBeLessThan(
      context.order.indexOf('clearMatchSetup'),
    );
  });

  it('joins the Duel queue on start-duel and shows the waiting screen', () => {
    const context = new FakeSessionContext();
    const routes: string[] = [];
    context.bus.on('menu-route', ({ route }) => routes.push(route));

    new MenuState().handleIntent({ kind: 'start-duel', name: 'Ana' }, context);

    expect(context.calls.joinDuelQueue).toEqual([['Ana']]);
    expect(routes).toEqual(['duel-queue']);
    expect(context.calls.transition).toEqual([]);
  });

  it('leaves the Duel queue on cancel-duel and shows home again', () => {
    const context = new FakeSessionContext();
    const routes: string[] = [];
    context.bus.on('menu-route', ({ route }) => routes.push(route));

    new MenuState().handleIntent({ kind: 'cancel-duel' }, context);

    expect(context.calls.leaveDuelQueue).toHaveLength(1);
    expect(routes).toEqual(['home']);
  });
});
