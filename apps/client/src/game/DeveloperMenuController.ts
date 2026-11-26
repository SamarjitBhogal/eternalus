import type { MapDefinition, Simulation } from '@eternalus/core';

import type { DeveloperMenuOption } from '../bridge/developerMenu.types';
import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';

/** What the controller is built from (`Match` passes its own parts). */
type DeveloperMenuControllerDeps = {
  /** Enables the developer menu and its commands (`?dev=1`). */
  readonly isEnabled: boolean;
  /** The local development HUD can request the boss without opening the menu. */
  readonly isBossShortcutEnabled?: boolean;
  readonly simulation: Pick<Simulation, 'enqueueCommand'>;
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly map: Pick<MapDefinition, 'features'>;
};

/**
 * The game side of the developer menu (13 §4): whether it is open, the `developer-menu` state the
 * UI shows, and the one path from the menu's `dev-command` intent to `Simulation.enqueueCommand`
 * (core validates it and logs it for the replay). While the menu is not enabled it forwards no
 * menu command, does not open and publishes nothing. The local development boss shortcut
 * can be enabled independently.
 */
export class DeveloperMenuController {
  private isOpen = false;

  private readonly stopListening: () => void;

  /** Starts listening for `dev-command` intents; `destroy()` stops. */
  public constructor(private readonly deps: DeveloperMenuControllerDeps) {
    this.stopListening = deps.bus.on('ui-intent', (intent) => {
      if (
        intent.kind === 'dev-command' &&
        (intent.command.type === 'dev-spawn-boss'
          ? deps.isBossShortcutEnabled === true
          : deps.isEnabled)
      ) {
        deps.simulation.enqueueCommand(intent.command);
      }
    });
  }

  /** Publishes the menu's state: whether it is open, and its origin picker; nothing while disabled. */
  public publish(): void {
    const { bus, map, isEnabled } = this.deps;
    if (!isEnabled) return;
    bus.emit('developer-menu', {
      isOpen: this.isOpen,
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
