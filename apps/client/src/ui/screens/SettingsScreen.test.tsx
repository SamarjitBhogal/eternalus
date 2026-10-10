import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { buttonNames, renderWithStore } from '../testStore';
import { SettingsScreen } from './SettingsScreen';
import { SettingsScreenOptions } from './SettingsScreenOptions';

function render(element: ReactElement): string {
  return renderWithStore(element, {
    settings: {
      ...settingsSlice.getInitialState(),
      bindings: [{ action: 'move-up', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] }],
    },
  });
}

/** Inputs and selects that do not sit right after their `<span>` label inside a `<label>`. */
function unlabelledFields(html: string): string[] {
  return [...html.matchAll(/<(input|select)[^>]*>/g)]
    .filter((match) => !html.slice(0, match.index).trimEnd().endsWith('</span>'))
    .map(([field]) => field);
}

describe('SettingsScreen', () => {
  it('opens on the Controls tab with the four tabs listed', () => {
    const html = render(<SettingsScreen />);

    expect(html).toMatch(/<h2[^>]*>Settings<\/h2>/);
    expect([...html.matchAll(/role="tab"[^>]*>([^<]+)</g)].map(([, label]) => label)).toEqual([
      'Controls',
      'Audio',
      'Video',
      'Accessibility',
    ]);
    expect(html).toMatch(/aria-selected="true"[^>]*>Controls</);
    expect(html).toContain('Move up');
  });

  it('ties the tab panel to the selected tab', () => {
    const html = render(<SettingsScreen />);
    const selectedId = /id="([^"]+)" type="button" role="tab" aria-selected="true"/.exec(html)?.[1];

    expect(selectedId).toBeDefined();
    expect(html).toContain(`role="tabpanel" aria-labelledby="${selectedId ?? ''}"`);
  });

  it('gives every interactive element an accessible name', () => {
    const screens = [
      render(<SettingsScreen />),
      render(<SettingsScreen isOverlay />),
      render(<SettingsScreenOptions tab="audio" />),
      render(<SettingsScreenOptions tab="video" />),
      render(<SettingsScreenOptions tab="accessibility" />),
    ];

    expect(screens.flatMap(buttonNames).filter((name) => name === '')).toEqual([]);
    expect(screens.flatMap(unlabelledFields)).toEqual([]);
  });

  it('is a full screen from the menu and bare content inside the pause overlay', () => {
    const screen = render(<SettingsScreen />);
    const embedded = render(<SettingsScreen isOverlay />);

    expect(screen).toMatch(/^<main/);
    expect(embedded).not.toContain('<main');
    expect(embedded).toContain('role="tablist"');
    expect(buttonNames(embedded)).toContain('Back');
  });
});
