import { describe, expect, it } from 'vitest';

import type { PlayableTeam } from '../domain.types';
import type { CapturePointStatus } from '../hud.types';
import { FIGMA_HUD_PLAYER, figmaHudState, TEST_HUD_CATALOGUE } from '../hudFixtures';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { selectObjectives } from './selectObjectives';

function storeWith(team: PlayableTeam | null, points: readonly CapturePointStatus[]) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      hud: TEST_HUD_CATALOGUE,
    }),
  );
  if (team !== null) store.dispatch(matchSetupSlice.actions.setTeam({ seed: 1, playerTeam: team }));
  store.dispatch(matchSlice.actions.capturePointsChanged(points));
  return store;
}

const FIGMA_POINTS = figmaHudState().match.capturePoints;

describe('selectObjectives', () => {
  it('lists the Figma objectives A light, B neutral cathedral, C dark for a Light player', () => {
    expect(selectObjectives(storeWith('light', FIGMA_POINTS).getState())).toEqual([
      {
        pointId: 'capture-point-lane-0',
        kindName: 'Capture Point',
        ownerTeam: 'light',
        allegiance: 'ours',
        captureFraction: 57 / 62,
      },
      {
        pointId: 'cathedral-lane-1',
        kindName: 'Cathedral',
        ownerTeam: 'neutral',
        allegiance: 'neutral',
        captureFraction: 57 / 62,
      },
      {
        pointId: 'capture-point-lane-2',
        kindName: 'Capture Point',
        ownerTeam: 'dark',
        allegiance: 'theirs',
        captureFraction: 57 / 62,
      },
    ]);
  });

  it('turns the allegiance around for a Dark player and keeps the absolute owner', () => {
    const views = selectObjectives(storeWith('dark', FIGMA_POINTS).getState());
    expect(views.map((view) => [view.ownerTeam, view.allegiance])).toEqual([
      ['light', 'theirs'],
      ['neutral', 'neutral'],
      ['dark', 'ours'],
    ]);
  });

  it('sorts by lane, passes an unknown progress through and caps |progress| at 1', () => {
    const point = (pointId: string, laneIndex: number | null, progress: number | null) => ({
      pointId,
      kind: 'capture-point' as const,
      laneIndex,
      ownerTeam: 'neutral' as const,
      progress,
    });
    const views = selectObjectives(
      storeWith('light', [
        point('c', null, -1.5),
        point('b', 1, null),
        point('a', 0, 0.25),
      ]).getState(),
    );
    expect(views.map((view) => [view.pointId, view.captureFraction])).toEqual([
      ['a', 0.25],
      ['b', null],
      ['c', 1],
    ]);
  });

  it('leaves out a kind the catalogue does not list, and is empty without a team', () => {
    const camp: CapturePointStatus = {
      pointId: 'camp-0',
      kind: 'camp',
      laneIndex: 0,
      ownerTeam: 'neutral',
      progress: null,
    };
    expect(selectObjectives(storeWith('light', [camp]).getState())).toEqual([]);
    expect(selectObjectives(storeWith(null, FIGMA_POINTS).getState())).toEqual([]);
  });

  it('returns the same list after a clock tick and after a HUD publish', () => {
    const store = storeWith('light', FIGMA_POINTS);
    const before = selectObjectives(store.getState());
    store.dispatch(matchSlice.actions.clockChanged({ tick: 30, seconds: 1 }));
    store.dispatch(hudSlice.actions.hudStateChanged(FIGMA_HUD_PLAYER));
    expect(selectObjectives(store.getState())).toBe(before);
  });
});
