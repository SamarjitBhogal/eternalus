import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';

import type { BridgeEventMap, CountdownKind } from './events';
import { assetsSlice } from './slices/assetsSlice';
import { contentSlice } from './slices/contentSlice';
import { hudSlice } from './slices/hudSlice';
import { loadingSlice } from './slices/loadingSlice';
import { matchSetupSlice } from './slices/matchSetupSlice';
import { matchSlice } from './slices/matchSlice';
import { sessionSlice } from './slices/sessionSlice';
import { settingsSlice } from './slices/settingsSlice';
import type { AppDispatch } from './store';
import type { TypedEventBus } from './TypedEventBus';

const setup = matchSetupSlice.actions;
const match = matchSlice.actions;

/** Where each session countdown's remaining time is kept (a new kind is one entry). */
const COUNTDOWN_ACTIONS: Readonly<Record<CountdownKind, ActionCreatorWithPayload<number>>> = {
  select: setup.setCountdown,
  reveal: setup.setReveal,
  results: setup.setResultsCountdown,
};

/**
 * Copies every game → UI event into its slice: the only path from the bus to the store.
 * @returns A function that unsubscribes every handler.
 */
export function connectBusToStore(
  bus: TypedEventBus<BridgeEventMap>,
  dispatch: AppDispatch,
): () => void {
  const unsubscribers = [
    bus.on('session-phase', (event) => dispatch(sessionSlice.actions.phaseChanged(event))),
    bus.on('menu-route', ({ route }) => dispatch(sessionSlice.actions.routeChanged(route))),
    bus.on('overlay', ({ overlay }) => dispatch(sessionSlice.actions.overlayChanged(overlay))),
    bus.on('content-catalogue', (catalogue) =>
      dispatch(contentSlice.actions.catalogueLoaded(catalogue)),
    ),
    bus.on('loading-progress', (progress) =>
      dispatch(loadingSlice.actions.progressChanged(progress)),
    ),
    bus.on('asset-urls', (event) => dispatch(assetsSlice.actions.groupUrlsChanged(event))),
    bus.on('credits', ({ entries }) => dispatch(assetsSlice.actions.creditsLoaded(entries))),
    // Every published setup starts clean: no selection, countdowns, HUD or match state left over.
    bus.on('match-setup', (draft) => {
      dispatch(setup.reset());
      dispatch(hudSlice.actions.reset());
      dispatch(match.reset());
      if (draft === null) return;
      dispatch(setup.setTeam({ seed: draft.seed, playerTeam: draft.playerTeam }));
      dispatch(setup.setRosters({ allies: draft.allies, enemies: draft.enemies }));
    }),
    bus.on('class-selection', (selection) => dispatch(setup.select(selection))),
    bus.on('selection-locked', (rosters) => dispatch(setup.lockIn(rosters))),
    bus.on('countdown', ({ kind, remainingMs }) => dispatch(COUNTDOWN_ACTIONS[kind](remainingMs))),
    bus.on('match-clock', (clock) => dispatch(match.clockChanged(clock))),
    bus.on('match-ended', (event) => dispatch(match.ended(event))),
    bus.on('hud-state', ({ player }) => dispatch(hudSlice.actions.hudStateChanged(player))),
    bus.on('structure-state', ({ structures }) => dispatch(match.structuresChanged(structures))),
    bus.on('capture-state', ({ points }) => dispatch(match.capturePointsChanged(points))),
    bus.on('announcement', (line) => dispatch(hudSlice.actions.announced(line))),
    bus.on('settings', (settings) => dispatch(settingsSlice.actions.settingsChanged(settings))),
  ];
  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}
