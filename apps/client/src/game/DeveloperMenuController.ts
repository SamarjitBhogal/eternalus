import type { MapDefinition, Simulation } from '@eternalus/core';

import type { DeveloperMenuOption } from '../bridge/developerMenu.types';
import type { BridgeEventMap } from '../bridge/events';
import type { TypedEventBus } from '../bridge/TypedEventBus';
import { SIM_MODE_CONTROLLER_IDS } from './DeveloperMenuController.constants';

/** What the controller is built from (`Match` passes its own parts). */
type DeveloperMenuControllerDeps = {
  /** `?dev=1`: without it the key and every `dev-command` are ignored. */
  readonly isEnabled: boolean;
  readonly simulation: Pick<Simulation, 'enqueueCommand'>;
  readonly bus: TypedEventBus<BridgeEventMap>;
  readonly map: Pick<MapDefinition, 'features'>;
  /** The human's Legend now (it changes in sim mode); `null` when there is none. */
  readonly humanLegendId: () => string | null;
  /** Called when Follow picks a Legend: the camera goes back to following (`MatchCamera`). */
  readonly onFollow?: () => void;
};

/**
 * The game side of the developer menu (13 §4): whether it is open, the `developer-menu` state the
 * UI shows, and the one path from the menu's `dev-command` intent to `Simulation.enqueueCommand`
 * (core validates it and logs it for the replay). Sim mode's Follow is client-only (13 §4
 * spectate, no `Command`): with no human seated, the camera follows the Legend it names. While the
 * menu is not enabled it forwards no command, follows nothing, does not open and publishes nothing.
 */
export class DeveloperMenuController {
  private isOpen = false;

  /** The Legend sim mode's Follow names, or `null`. */
  private followed: string | null = null;

  private readonly stopListening: () => void;

  /** Starts listening for `dev-command` intents; `destroy()` stops. */
  public constructor(private readonly deps: DeveloperMenuControllerDeps) {
    this.stopListening = deps.bus.on('ui-intent', (intent) => {
      if (!deps.isEnabled) return;
      if (intent.kind === 'dev-command') {
        deps.simulation.enqueueCommand(intent.command);
      } else if (intent.kind === 'dev-follow') {
        this.followed = intent.legendId;
        if (intent.legendId !== null) deps.onFollow?.();
        this.publish();
      }
    });
  }

  /**
   * The Legend the camera follows: Follow's, while no human is seated (the human's Legend comes
   * first); `null` otherwise.
   */
  public get followedLegendId(): string | null {
    return this.deps.humanLegendId() === null ? this.followed : null;
  }

  /** Publishes the menu's state: whether it is open, and its origin picker; nothing while disabled. */
  public publish(): void {
    const { bus, map, isEnabled, humanLegendId } = this.deps;
    if (!isEnabled) return;
    bus.emit('developer-menu', {
      isOpen: this.isOpen,
      humanLegendId: humanLegendId(),
      followedLegendId: this.followed,
      controllerIds: SIM_MODE_CONTROLLER_IDS,
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
