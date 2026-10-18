import { describe, expect, it } from 'vitest';

import { spyContext } from '../../testSessionDeps';
import { MenuState } from './MenuState';

describe('MenuState', () => {
  it("releases the match's assets once, drops the setup and shows the home route", () => {
    const context = spyContext();
    const routes: string[] = [];
    context.bus.on('menu-route', ({ route }) => routes.push(route));

    new MenuState().enter(context);

    expect(context.releaseAssets.mock.calls).toEqual([['match']]);
    expect(context.clearMatchSetup).toHaveBeenCalledTimes(1);
    expect(routes).toEqual(['home']);
  });
});
