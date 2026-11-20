import { makeLogRecord } from '@eternalus/core';

import type { UiIntent } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { LoadoutControllerDeps, SavedLoadout } from './LoadoutController.types';
import { resolveSavedLoadouts } from './loadoutState';

/**
 * The one writer of saved loadouts. Loads the profile's loadouts at start, repairing any weapon
 * content no longer has (08), publishes them with the choices each class offers, then turns each
 * `save-loadout` intent into a published change and a save. A failed load or save is reported,
 * never thrown.
 */
export class LoadoutController {
  private readonly deps: LoadoutControllerDeps;
  private state: LoadoutsSliceState;
  private stopListening: (() => void) | null = null;

  /** Builds the controller; nothing happens until `start()`. */
  public constructor(deps: LoadoutControllerDeps) {
    this.deps = deps;
    this.state = { options: deps.options, saved: {}, repaired: [] };
  }

  /**
   * Loads and repairs the saved loadouts, publishes them and starts handling intents. If storage
   * cannot be read it logs a warning and starts from the class defaults; it never rejects.
   */
  public async start(): Promise<void> {
    const records = await this.deps.persistence
      .loadLoadouts(Object.keys(this.deps.options))
      .catch((error: unknown) => {
        this.report('WARN', 'loadouts could not be loaded; using the defaults', { error });
        return new Map<string, SavedLoadout>();
      });
    const { saved, repaired } = resolveSavedLoadouts(this.deps.options, records);
    for (const classId of repaired) {
      this.report('WARN', 'a saved weapon no longer exists; using the class default', { classId });
    }
    this.publish({ options: this.deps.options, saved, repaired });
    this.stopListening = this.deps.bus.on('ui-intent', this.onIntent);
  }

  /** Stops handling intents. */
  public destroy(): void {
    this.stopListening?.();
    this.stopListening = null;
  }

  private readonly onIntent = (intent: UiIntent): void => {
    if (intent.kind !== 'save-loadout') return;
    const { classId, primaryWeaponId } = intent;
    const isOffered = this.state.options[classId]?.weapons.some(
      (weapon) => weapon.id === primaryWeaponId,
    );
    if (isOffered !== true) {
      this.report('WARN', 'a loadout was not saved: the class does not offer that weapon', {
        classId,
        primaryWeaponId,
      });
      return;
    }
    this.publish({
      ...this.state,
      saved: { ...this.state.saved, [classId]: primaryWeaponId },
      repaired: this.state.repaired.filter((repairedClass) => repairedClass !== classId),
    });
    this.deps.persistence.saveLoadout(classId, { primaryWeaponId }).catch((error: unknown) => {
      this.report('ERROR', 'a loadout could not be saved', { classId, error });
    });
  };

  private report(
    level: 'WARN' | 'ERROR',
    body: string,
    attributes: Readonly<Record<string, unknown>>,
  ): void {
    const text = Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k, String(v)]));
    this.deps.logger.log(makeLogRecord(level, 'client.loadout', body, { attributes: text }));
  }

  private publish(state: LoadoutsSliceState): void {
    this.state = state;
    this.deps.bus.emit('loadouts', state);
  }
}
