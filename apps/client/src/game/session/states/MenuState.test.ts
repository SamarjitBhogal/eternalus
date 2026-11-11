import { describe, expect, it } from 'vitest';

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
});
