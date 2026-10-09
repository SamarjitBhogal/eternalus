import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { renderWithStore } from '../testStore';
import { SettingsScreenControls } from './SettingsScreenControls';

const BINDINGS: readonly Binding[] = [
  {
    action: 'move-up',
    chords: [
      { device: 'keyboard', code: 'KeyW', label: 'W' },
      { device: 'keyboard', code: 'ArrowUp', label: '↑' },
    ],
  },
  { action: 'gadget-1', chords: [{ device: 'mouse', code: '3', label: 'Mouse 4' }] },
  { action: 'interact', chords: [] },
];

function render(): string {
  return renderWithStore(<SettingsScreenControls />, {
    settings: { ...settingsSlice.getInitialState(), bindings: BINDINGS },
  });
}

describe('SettingsScreenControls', () => {
  it('lists every bound action with all of its chords', () => {
    const html = render();

    expect(html).toMatch(/Move up<\/span><span[^>]*><kbd[^>]*>W<\/kbd><kbd[^>]*>↑<\/kbd>/);
    expect(html).toMatch(/Gadget 1<\/span><span[^>]*><kbd[^>]*>Mouse 4<\/kbd>/);
  });

  it('shows a dash for an action with no chord', () => {
    expect(render()).toMatch(/Interact<\/span><span[^>]*>—<\/span>/);
  });

  it('offers a named reset for every action and a reset for all', () => {
    const html = render();

    expect(html).toContain('aria-label="Reset Move up to default"');
    expect(html).toContain('aria-label="Reset Interact to default"');
    expect(html).toContain('>Reset all to defaults</button>');
  });

  it('marks the resets so a click on them is not captured as a mouse binding', () => {
    expect(render().match(/data-capture-exempt="true"/g)).toHaveLength(BINDINGS.length + 1);
  });

  it('shows no capture dialog until an input has been captured', () => {
    expect(render()).not.toContain('role="alertdialog"');
  });
});
