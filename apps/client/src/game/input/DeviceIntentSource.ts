import type { InputIntent } from '@eternalus/core';

import type { InputDevice, MutableInputSnapshot } from '../engine/input/InputDevice.types';
import type { IntentSource } from '../Match.types';
import type { InputMapper } from './InputMapper';

/**
 * The player's intent from real devices: each tick it merges what every device holds into one
 * snapshot and maps it through the bindings (architecture 09 §3). `Match` reads it like any other
 * `IntentSource`, so it never knows which devices exist.
 */
export class DeviceIntentSource implements IntentSource {
  private readonly snapshot: MutableInputSnapshot = { keys: new Set(), keyLabels: new Map() };

  /** Creates a source over attached devices and the mapper holding the current bindings. */
  public constructor(
    private readonly devices: readonly InputDevice[],
    private readonly mapper: InputMapper,
  ) {}

  /** The intent for this tick. */
  public read(): InputIntent {
    this.snapshot.keys.clear();
    this.snapshot.keyLabels.clear();
    for (const device of this.devices) {
      device.writeInto(this.snapshot);
    }
    return this.mapper.toIntent(this.mapper.resolve(this.snapshot));
  }

  /** Releases everything every device holds (focus lost: no key-up will arrive). */
  public releaseAll(): void {
    for (const device of this.devices) {
      device.releaseAll();
    }
  }
}
