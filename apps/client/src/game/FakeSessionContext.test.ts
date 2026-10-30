import { describe, expect, it } from 'vitest';

import { ASSET_LICENCES } from '../data/resources/assetLicences';
import { ASSET_MANIFEST } from '../data/resources/AssetManifest';
import { describeCredits } from '../data/resources/describeCredits';
import { firstAvailableSpecId, shippedCatalogue } from './content/__fixtures__/shippedCatalogue';
import { FakeRunningMatch } from './FakeRunningMatch';
import { FakeSessionContext } from './FakeSessionContext';
import { FakeViewportCanvas } from './FakeViewportCanvas';
import type { MatchViewport } from './MatchViewport.types';

const VIEWPORT: MatchViewport = {
  canvas: new FakeViewportCanvas(),
  chrome: {
    onInteriorChanged: () => undefined,
    setLeaveInterior: () => undefined,
    setOverview: () => undefined,
  },
  isExplorerShown: false,
};
const ON_CRASH = (): void => undefined;

describe('FakeSessionContext', () => {
  it('carries a real bus and clock, the shipped catalogue and the shipped credits', () => {
    const context = new FakeSessionContext();
    const routes: string[] = [];
    context.bus.on('menu-route', ({ route }) => routes.push(route));

    context.bus.emit('menu-route', { route: 'home' });

    expect(routes).toEqual(['home']);
    expect(context.clock.now()).toBe(0);
    expect(context.catalogue).toEqual(shippedCatalogue().load());
    expect(context.credits).toEqual(describeCredits(ASSET_MANIFEST.assets, ASSET_LICENCES));
  });

  it('records every call with exactly the arguments it was given, and the call order', () => {
    const context = new FakeSessionContext();
    const error = new Error('no 2D canvas');
    const crash = { error: new Error('step failed'), tick: 12 };

    context.transition('menu');
    context.transition('menu', 'load-failed');
    context.newMatchSetup();
    context.repeatMatchSetup();
    context.clearMatchSetup();
    context.lockIn();
    context.prepareWorld();
    context.dropWorld();
    context.abortMatch(error);
    context.endCrashedMatch(crash);
    context.releaseAssets('match');

    expect(context.calls).toEqual({
      transition: [['menu'], ['menu', 'load-failed']],
      newMatchSetup: [[]],
      repeatMatchSetup: [[]],
      clearMatchSetup: [[]],
      selection: [],
      recordSelection: [],
      lockIn: [[]],
      prepareWorld: [[]],
      createMatch: [],
      dropWorld: [[]],
      abortMatch: [[error]],
      endCrashedMatch: [[crash]],
      loadAssets: [],
      releaseAssets: [['match']],
    });
    expect(context.calls.transition[0]).toHaveLength(1);
    expect(context.order).toEqual([
      'transition',
      'transition',
      'newMatchSetup',
      'repeatMatchSetup',
      'clearMatchSetup',
      'lockIn',
      'prepareWorld',
      'dropWorld',
      'abortMatch',
      'endCrashedMatch',
      'releaseAssets',
    ]);
  });

  it("writes the call order into a test's own log when given one", () => {
    const log: string[] = ['before'];
    const context = new FakeSessionContext(log);

    context.releaseAssets('match');

    expect(log).toEqual(['before', 'releaseAssets']);
    expect(context.order).toBe(log);
  });

  it('hands back the callbacks of each load and records each cancel by load index', () => {
    const context = new FakeSessionContext();
    const onReady = (): void => undefined;
    const onFailed = (): void => undefined;

    context.loadAssets(['boot'], onReady, onFailed);
    const cancelSecond = context.loadAssets(['match'], onReady, onFailed);
    cancelSecond();
    cancelSecond();

    expect(context.calls.loadAssets).toEqual([
      [['boot'], onReady, onFailed],
      [['match'], onReady, onFailed],
    ]);
    expect(context.calls.loadAssets[0]?.[1]).toBe(onReady);
    expect(context.cancelledLoads).toEqual([1, 1]);
  });

  it('answers selection() with the last recorded pick, null before any', () => {
    const context = new FakeSessionContext();
    const before = context.selection();

    const pick = { classId: 'sentinel', specId: firstAvailableSpecId('sentinel') };

    context.recordSelection(pick);
    const picked = context.selection();
    context.recordSelection(null);

    expect({ before, picked, after: context.selection() }).toEqual({
      before: null,
      picked: pick,
      after: null,
    });
    expect(context.calls.recordSelection).toEqual([[pick], [null]]);
  });

  it('builds a new FakeRunningMatch per createMatch and keeps each in order', () => {
    const context = new FakeSessionContext();

    const first = context.createMatch(VIEWPORT, ON_CRASH);
    const second = context.createMatch(VIEWPORT, ON_CRASH);

    expect(first).toBeInstanceOf(FakeRunningMatch);
    expect(second).not.toBe(first);
    expect(context.matches).toEqual([first, second]);
    expect(context.matches[1]).toBe(second);
    expect(context.calls.createMatch).toEqual([
      [VIEWPORT, ON_CRASH],
      [VIEWPORT, ON_CRASH],
    ]);
  });

  it('throws the given errors from createMatch and prepareWorld, after recording the call', () => {
    const context = new FakeSessionContext();
    const matchError = new Error('no 2D canvas');
    const worldError = new Error('no stronghold');
    context.createMatchError = matchError;
    context.prepareWorldError = worldError;

    expect(() => context.createMatch(VIEWPORT, ON_CRASH)).toThrow(matchError);
    expect(() => {
      context.prepareWorld();
    }).toThrow(worldError);
    expect(context.matches).toEqual([]);
    expect(context.order).toEqual(['createMatch', 'prepareWorld']);
  });
});
