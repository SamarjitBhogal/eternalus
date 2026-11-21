import { type Loadout, makeLogRecord, validateLoadout } from '@eternalus/core';

import type { UiIntent } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { LoadoutControllerDeps, SavedLoadout } from './LoadoutController.types';
import { resolveSavedLoadouts } from './loadoutState';

/**
 * The one writer of saved loadouts. Loads the profile's loadouts at start, repairing every slot
 * that breaks the loadout rules with the auto-build and logging it (08, core `repairLoadout`),
 * publishes them with the choices each class offers, then turns each `save-loadout` intent that
 * passes `validateLoadout` into a published change and a save; a refused one is logged with every
 * problem. A failed load or save is reported, never thrown.
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
    const { saved, repairs } = resolveSavedLoadouts(this.deps.content, records);
    for (const [classId, slots] of repairs) {
      this.report('WARN', 'a saved loadout broke the loadout rules; auto-build repaired it', {
        classId,
        slots: slots.join(', '),
      });
    }
    this.publish({ options: this.deps.options, saved, repaired: [...repairs.keys()] });
    this.stopListening = this.deps.bus.on('ui-intent', this.onIntent);
  }

  /**
   * The loadout saved for `classId` (already repaired), or `null` when none is saved: the match
   * then spawns the class default. `SessionController` reads it when it builds a match.
   */
  public loadoutOf(classId: string): Loadout | null {
    const primaryWeaponId = this.state.saved[classId];
    return primaryWeaponId === undefined ? null : { classId, primaryWeaponId };
  }

  /** Stops handling intents. */
  public destroy(): void {
    this.stopListening?.();
    this.stopListening = null;
  }

  private readonly onIntent = (intent: UiIntent): void => {
    if (intent.kind !== 'save-loadout') return;
    const { classId, primaryWeaponId } = intent;
    const problems = validateLoadout({ classId, primaryWeaponId }, this.deps.content);
    if (problems.length > 0) {
      this.report('WARN', 'a loadout was not saved: it breaks the loadout rules', {
        classId,
        primaryWeaponId,
        problems: problems.map(({ message }) => message).join('; '),
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
