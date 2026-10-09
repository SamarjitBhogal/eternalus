import type { BridgeEventMap } from './events';
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
    // Every published setup starts clean: no selection or countdowns left from a previous one.
    bus.on('match-setup', (draft) => {
      dispatch(setup.reset());
      if (draft === null) return;
      dispatch(setup.setTeam({ seed: draft.seed, playerTeam: draft.playerTeam }));
      dispatch(setup.setRosters({ allies: draft.allies, enemies: draft.enemies }));
    }),
    bus.on('class-selection', (selection) => dispatch(setup.select(selection))),
    bus.on('countdown', ({ kind, remainingMs }) =>
      dispatch(kind === 'select' ? setup.setCountdown(remainingMs) : setup.setReveal(remainingMs)),
    ),
    bus.on('match-clock', (clock) => dispatch(matchSlice.actions.clockChanged(clock))),
    bus.on('hud-state', (hud) => dispatch(hudSlice.actions.hudStateChanged(hud))),
    bus.on('announcement', (line) => dispatch(hudSlice.actions.announced(line))),
    bus.on('settings', (settings) => dispatch(settingsSlice.actions.settingsChanged(settings))),
  ];
  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}
