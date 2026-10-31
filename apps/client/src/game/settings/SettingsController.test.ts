import { MemoryLogger, NullLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { BridgeEventMap } from '../../bridge/events';
import type { SettingsSliceState } from '../../bridge/slices/settingsSlice';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { MemoryStorageAdapter } from '../../data/persistence/MemoryStorageAdapter';
import { PersistenceController } from '../../data/persistence/PersistenceController';
import { INPUT_ACTIONS, PRESETS, type SavedBinding } from '../input/keybindings';
import { SettingsController } from './SettingsController';

const UP_ARROW = { device: 'keyboard', code: 'ArrowUp', label: '↑' } as const;

async function started(
  adapter = new MemoryStorageAdapter(),
  isApplePlatform = false,
): Promise<{
  bus: TypedEventBus<BridgeEventMap>;
  controller: SettingsController;
  persistence: PersistenceController;
  published: SettingsSliceState[];
}> {
  const persistence = new PersistenceController({
    adapter,
    knownActions: new Set(INPUT_ACTIONS),
    now: () => 0,
    warn: () => undefined,
  });
  await persistence.open();
  const bus = new TypedEventBus<BridgeEventMap>();
  const published: SettingsSliceState[] = [];
  bus.on('settings', (settings) => published.push(settings));
  const controller = new SettingsController({
    bus,
    persistence,
    logger: new NullLogger(),
    isApplePlatform,
  });
  await controller.start();
  return { bus, controller, persistence, published };
}

function moveUpChords(settings: SettingsSliceState | undefined): unknown {
  return settings?.bindings.find((binding) => binding.action === 'move-up')?.chords;
}

function developerCameraLabels(bindings: readonly SavedBinding[] | null | undefined): unknown {
  return bindings
    ?.find((binding) => binding.action === 'toggle-developer-camera')
    ?.chords.map((chord) => chord.label);
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

  it('exposes no bindings before start, then the published ones, then a rebinding', async () => {
    const persistence = new PersistenceController({
      adapter: new MemoryStorageAdapter(),
      knownActions: new Set(INPUT_ACTIONS),
      now: () => 0,
      warn: () => undefined,
    });
    await persistence.open();
    const bus = new TypedEventBus<BridgeEventMap>();
    const controller = new SettingsController({
      bus,
      persistence,
      logger: new NullLogger(),
      isApplePlatform: false,
    });
    expect(controller.bindings).toBeNull();

    await controller.start();
    expect(controller.bindings).toEqual(PRESETS.wasd);

    bus.emit('ui-intent', {
      kind: 'update-binding',
      action: 'move-up',
      chord: UP_ARROW,
      onConflict: 'swap',
    });
    expect(controller.bindings?.find((binding) => binding.action === 'move-up')?.chords).toEqual([
      UP_ARROW,
    ]);
  });

  it.each([
    ['an Apple device', true, ['Cmd+Shift+F3', 'Ctrl+Shift+F3']],
    ['any other device', false, ['Ctrl+Shift+F3', 'Cmd+Shift+F3']],
  ])(
    'lists the developer camera chord of %s first, at start and after a reset (DEC-118)',
    async (_platform, isApplePlatform, labels) => {
      const { bus, controller, persistence, published } = await started(
        new MemoryStorageAdapter(),
        isApplePlatform,
      );

      bus.emit('ui-intent', { kind: 'reset-bindings', action: null });

      expect(developerCameraLabels(published[0]?.bindings)).toEqual(labels);
      expect(developerCameraLabels(published.at(-1)?.bindings)).toEqual(labels);
      expect(developerCameraLabels(controller.bindings)).toEqual(labels);
      expect(developerCameraLabels((await persistence.loadSettings())?.bindings)).toEqual(labels);
    },
  );

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

  it('starts from defaults and warns when storage cannot be read', async () => {
    const bus = new TypedEventBus<BridgeEventMap>();
    const logger = new MemoryLogger();
    const published: SettingsSliceState[] = [];
    bus.on('settings', (settings) => published.push(settings));
    const failing = {
      loadSettings: () => Promise.reject(new Error('storage is not open')),
      saveSettings: () => Promise.reject(new Error('storage is not open')),
    };

    await new SettingsController({
      bus,
      persistence: failing,
      logger,
      isApplePlatform: false,
    }).start();
    bus.emit('ui-intent', { kind: 'reset-bindings', action: null });
    await Promise.resolve(); // let the rejected save be reported

    expect(published[0]?.bindings).toEqual(PRESETS.wasd);
    expect(logger.records.map((record) => [record.severityText, record.body])).toEqual([
      ['WARN', 'settings could not be loaded; using defaults'],
      ['ERROR', 'settings could not be saved'],
    ]);
  });

  it('stops listening when destroyed', async () => {
    const { bus, controller } = await started();
    const before = bus.listenerCount();

    controller.destroy();

    expect(bus.listenerCount()).toBe(before - 1);
  });
});
