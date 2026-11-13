import type { MapDefinition, Simulation } from '@eternalus/core';

import type { DeveloperMenuOption } from '../bridge/developerMenu.types';
import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import { DEVELOPER_MOBS } from './DeveloperMenuController.constants';

/** What the controller is built from (`Match` passes its own parts). */
type DeveloperMenuControllerDeps = {
  /** `?dev=1`: without it the key and every `dev-command` are ignored. */
  readonly isEnabled: boolean;
  readonly simulation: Pick<Simulation, 'enqueueCommand'>;
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly map: Pick<MapDefinition, 'features'>;
};

/**
 * The game side of the developer menu (13 §4): whether it is open, the `developer-menu` state the
 * UI shows, and the one path from the menu's `dev-command` intent to `Simulation.enqueueCommand`
 * (core validates it and logs it for the replay). It does nothing while the menu is not enabled.
 */
export class DeveloperMenuController {
  private isOpen = false;

  private readonly stopListening: () => void;

  /** Starts listening for `dev-command` intents; `destroy()` stops. */
  public constructor(private readonly deps: DeveloperMenuControllerDeps) {
    this.stopListening = deps.bus.on('ui-intent', (intent) => {
      if (deps.isEnabled && intent.kind === 'dev-command') {
        deps.simulation.enqueueCommand(intent.command);
      }
    });
  }

  /** Publishes the menu's state: its pickers, whether it is enabled and open. */
  public publish(): void {
    const { bus, map } = this.deps;
    bus.emit('developer-menu', {
      isOpen: this.isOpen,
      mobs: DEVELOPER_MOBS,
      origins: map.features.flatMap(({ id, kind, laneId }): DeveloperMenuOption[] =>
        laneId === undefined ? [] : [{ id, label: `${id} (${kind})` }],
      ),
    });
  }

  /** The `toggle-developer-menu` key: opens or closes the menu; ignored while it is not enabled. */
  public toggle(): void {
    if (!this.deps.isEnabled) return;
    this.isOpen = !this.isOpen;
    this.publish();
  }

  /** Stops listening. */
  public destroy(): void {
    this.stopListening();
  }
}
