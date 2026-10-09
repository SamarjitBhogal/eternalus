import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../../bridge/events';
import type { SettingsSliceState } from '../../bridge/slices/settingsSlice';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { MemoryStorageAdapter } from '../../data/persistence/MemoryStorageAdapter';
import { PersistenceController } from '../../data/persistence/PersistenceController';
import { INPUT_ACTIONS, PRESETS } from './keybindings';
import { SettingsController } from './SettingsController';

const UP_ARROW = { device: 'keyboard', code: 'ArrowUp', label: '↑' } as const;

async function started(adapter = new MemoryStorageAdapter()): Promise<{
  bus: TypedEventBus<BridgeEventMap>;
  controller: SettingsController;
  published: SettingsSliceState[];
}> {
  const persistence = new PersistenceController({
    adapter,
    knownActions: new Set(INPUT_ACTIONS),
    now: () => 0,
  });
  await persistence.open();
  const bus = new TypedEventBus<BridgeEventMap>();
  const published: SettingsSliceState[] = [];
  bus.on('settings', (settings) => published.push(settings));
  const controller = new SettingsController({ bus, persistence });
  await controller.start();
  return { bus, controller, published };
}

function moveUpChords(settings: SettingsSliceState | undefined): unknown {
  return settings?.bindings.find((binding) => binding.action === 'move-up')?.chords;
}

describe('SettingsController', () => {
  it('publishes the default settings at start when nothing is saved', async () => {
    const { published } = await started();

    expect(published).toHaveLength(1);
    expect(published[0]?.bindings).toEqual(PRESETS.wasd);
  });

  it('publishes a rebinding and keeps it for the next session', async () => {
    // Storage runs transactions in order, so the second session's load sees the save.
    const adapter = new MemoryStorageAdapter();
    const first = await started(adapter);

    first.bus.emit('ui-intent', {
      kind: 'update-binding',
      action: 'move-up',
      chord: UP_ARROW,
      onConflict: 'swap',
    });
    const second = await started(adapter);

    expect(moveUpChords(first.published.at(-1))).toEqual([UP_ARROW]);
    expect(moveUpChords(second.published[0])).toEqual([UP_ARROW]);
  });

  it('applies audio, video and accessibility changes', async () => {
    const { bus, published } = await started();

    bus.emit('ui-intent', { kind: 'update-settings', patch: { audio: { master: 0.3 } } });

    expect(published.at(-1)?.audio.master).toBe(0.3);
  });

  it('ignores intents that are not about settings', async () => {
    const { bus, published } = await started();

    bus.emit('ui-intent', { kind: 'start-match' });

    expect(published).toHaveLength(1);
  });

  it('stops listening when destroyed', async () => {
    const { bus, controller } = await started();
    const before = bus.listenerCount();

    controller.destroy();

    expect(bus.listenerCount()).toBe(before - 1);
  });
});
