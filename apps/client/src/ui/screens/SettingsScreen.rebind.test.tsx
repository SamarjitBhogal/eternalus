import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { NullLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { createAppStore } from '../../bridge/store';
import { MemoryStorageAdapter } from '../../data/persistence/MemoryStorageAdapter';
import { PersistenceController } from '../../data/persistence/PersistenceController';
import { InputMapper } from '../../game/input/InputMapper';
import { INPUT_ACTIONS } from '../../game/input/keybindings';
import { SettingsController } from '../../game/settings/SettingsController';
import { Prompt } from '../components/Prompt';
import { captureKey, type CapturedKey } from './bindingCapture';

// The requirements doc's acceptance test (architecture 13 §8): "press Enter on W, press Up
// Arrow, then press Enter to save", and every prompt follows with no code change.

function press(code: string, key: string): CapturedKey {
  return { code, key, repeat: false, ctrlKey: false, metaKey: false, isExemptTarget: false };
}

const noAim = { screenToWorld: () => ({ x: 0, y: 0 }) };

function held(keys: string[]): { keys: Set<string>; mouseButtons: Set<number>; pointer: null } {
  return { keys: new Set(keys), mouseButtons: new Set(), pointer: null };
}

describe('rebinding move-up from W to ArrowUp', () => {
  it('updates every prompt, the input mapping and the saved settings', async () => {
    const store = createAppStore();
    const stopMirroring = eventBus.on('settings', (settings) =>
      store.dispatch(settingsSlice.actions.settingsChanged(settings)),
    );
    const adapter = new MemoryStorageAdapter();
    const persistence = new PersistenceController({
      adapter,
      knownActions: new Set(INPUT_ACTIONS),
      now: () => 0,
      warn: () => undefined,
    });
    await persistence.open();
    const controller = new SettingsController({
      bus: eventBus,
      persistence,
      logger: new NullLogger(),
      isApplePlatform: false,
    });
    await controller.start();
    const mapper = new InputMapper(store.getState().settings.bindings);
    const render = (): string =>
      renderToStaticMarkup(
        <Provider store={store}>
          <Prompt template="Move with {action:move-up}" />
        </Provider>,
      );
    const before = render();

    // Enter on the move-up row starts listening; ArrowUp is captured; Enter saves.
    const captured = captureKey(
      { step: 'listening', action: 'move-up' },
      press('ArrowUp', 'ArrowUp'),
    );
    const saved = captureKey(captured.state, press('Enter', 'Enter'));
    if (saved.intent !== null) {
      eventBus.emit('ui-intent', saved.intent);
    }
    mapper.setBindings(store.getState().settings.bindings);
    const reloaded = await persistence.loadSettings();
    controller.destroy();
    stopMirroring();

    expect(before).toContain('>W<');
    expect(render()).toContain('>↑<');
    expect(mapper.toIntent(mapper.resolve(held(['ArrowUp'])), noAim).move).toEqual({ x: 0, y: -1 });
    expect(mapper.resolve(held(['KeyW'])).held.size).toBe(0);
    expect(reloaded?.bindings.find((binding) => binding.action === 'move-up')?.chords).toEqual([
      { device: 'keyboard', code: 'ArrowUp', label: '↑' },
    ]);
  });
});
