import { describe, expect, it } from 'vitest';

import type { KitRow } from '../../bridge/catalogue.types';
import { HUD_BINDINGS, settingsWith } from '../hud/hudTestSupport';
import { renderWithStore } from '../testStore';
import { InfoPanelKit } from './InfoPanelKit';
import styles from './InfoPanelKit.module.css';

const BLADE_RUNNER: KitRow = {
  slot: 'ability-1',
  abilityId: 'blade-runner',
  displayName: 'Blade Runner',
  description: 'Dash forward at incredible speed.',
  cost: { kind: 'aether', amount: 35 },
  cooldownSeconds: 12,
  isAvailable: true,
};

const render = (row: KitRow): string =>
  renderWithStore(<InfoPanelKit row={row} />, { settings: settingsWith(HUD_BINDINGS) });

describe('InfoPanelKit', () => {
  it('shows the key, the aether cost, the cooldown and the description', () => {
    const html = render(BLADE_RUNNER);

    expect(html).toContain('<kbd');
    expect(html).toContain('>1</kbd>');
    expect(html).toContain('<span>35 aether</span>');
    expect(html).toContain('<span>12 s cooldown</span>');
    expect(html).toContain('Dash forward at incredible speed.');
    expect(html).not.toContain('Not yet available');
    expect(html).toContain('data-available="true"');
  });

  it('shows the key the ability is bound to now', () => {
    const html = renderWithStore(<InfoPanelKit row={{ ...BLADE_RUNNER, slot: 'ability-4' }} />, {
      settings: settingsWith(HUD_BINDINGS),
    });

    expect(html).toContain('>4</kbd>');
  });

  it('shows a charge-based ultimate as a charge meter, never as 0 aether or a 0 s cooldown', () => {
    const html = render({
      ...BLADE_RUNNER,
      slot: 'ability-4',
      cost: { kind: 'charge' },
      cooldownSeconds: null,
    });

    expect(html).toContain('<span>Charge meter</span>');
    expect(html).not.toContain('aether');
    expect(html).not.toContain('cooldown');
  });

  it('shows an ability not built yet as "Not yet available", dimmed, in place of its cost', () => {
    const html = render({ ...BLADE_RUNNER, isAvailable: false });

    expect(html).toContain('<span>Not yet available</span>');
    expect(html).not.toContain('35 aether');
    expect(html.match(/data-available="false"/g)).toHaveLength(2);
    expect(html).toContain(String(styles.meta));
  });
});
