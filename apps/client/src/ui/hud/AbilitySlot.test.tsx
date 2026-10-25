import { describe, expect, it } from 'vitest';

import type { HudSlotId } from '../../bridge/Binding.types';
import type { AbilitySlotStatus } from '../../bridge/hud.types';
import { FIGMA_HUD_PLAYER, figmaHudState } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { SLOT_FRAMES } from './AbilitySlotFrame.constants';
import { AbilitySlot } from './AbilitySlot';
import styles from './AbilitySlot.module.css';
import frameStyles from './AbilitySlotFrame.module.css';
import css from './AbilitySlot.module.css?raw';
import {
  cssRule,
  FIGMA_MATCH_SETUP,
  withHudSetup,
  MOUSE_4,
  settingsWith,
  withBinding,
} from './hudTestSupport';

const SLOTS = Object.keys(SLOT_FRAMES) as HudSlotId[];

/** The Figma HUD with `slot`'s runtime entry replaced by `changes` (or removed for `null`). */
function render(slot: HudSlotId, changes: Partial<AbilitySlotStatus> | null = {}) {
  const store = withHudSetup(figmaHudState());
  const slots = FIGMA_HUD_PLAYER.slots.flatMap((entry) => {
    if (entry.slot !== slot) return [entry];
    return changes === null ? [] : [{ ...entry, ...changes }];
  });
  return renderWithStore(<AbilitySlot slot={slot} appearance="ability" />, {
    ...store,
    hud: { player: { ...FIGMA_HUD_PLAYER, slots }, announcements: [] },
  });
}

const names = (html: string) => accessibleNames(html, '[role=group]');

describe('AbilitySlot', () => {
  it('fills the whole box red while a cooldown has just started (OD-9, the Figma state)', () => {
    const html = render('ability-1');
    expect(html).toContain('data-look="cooldown"');
    expect(html).toMatch(/<rect x="0" y="0" width="70" height="70" fill="url\(#[^)]+\)"/);
    expect(html).toContain(`<stop offset="0" class="${String(frameStyles.shadeStrong)}"></stop>`);
    expect(names(html)).toEqual(['Ability 1, Cooling down']);
  });

  it('cuts the red fill to the share of the cooldown still to run, from the bottom', () => {
    const html = render('ability-2', { cooldownRemainingTicks: 75, cooldownTicks: 300 });
    expect(html).toContain('<rect x="0" y="52.5" width="70" height="17.5"');
  });

  it('draws the gold-glow look when ready, with the ultimate frame and its 1.5 px stroke', () => {
    const html = renderWithStore(
      <AbilitySlot slot="ability-4" appearance="ultimate" />,
      withHudSetup(figmaHudState()),
    );
    expect(html).toContain('data-look="ready"');
    expect(html).toMatch(
      /<rect width="83.5146" height="83.5146" filter="url\(#[^)]+glow\)"><\/rect>/,
    );
    expect(html).toContain('stdDeviation="4.25"');
    expect(html).toContain('viewBox="0 0 83.5146 83.5146"');
    expect(html).toContain(
      `<rect class="${String(frameStyles.strokeReady)}" x="0.75" y="0.75" width="82.0146" height="82.0146" stroke-width="1.5"></rect>`,
    );
    expect(html).not.toContain('<linearGradient');
    expect(names(html)).toEqual(['Ultimate, ready']);
  });

  it('shows the class kit icon and the bound key, and no seconds numeral (I-30)', () => {
    const html = render('ability-3');
    expect(html).toContain('src="/assets/test/icon-placeholder-aperture.webp"');
    expect(html).toMatch(/<kbd[^>]*>3<\/kbd>/);
    expect(html.replace(/<[^>]+>/g, '')).toBe('3');
  });

  it('follows a rebinding of its action', () => {
    const html = renderWithStore(<AbilitySlot slot="gadget-1" appearance="gadget" />, {
      ...withHudSetup(figmaHudState()),
      settings: settingsWith(withBinding('gadget-1', MOUSE_4)),
    });
    expect(html).toMatch(/<kbd[^>]*>Mouse 4<\/kbd>/);
  });

  it('hatches a slot with no runtime entry and names it "No data yet"', () => {
    const html = render('ability-1', null);
    expect(html).toContain('data-look="no-data"');
    expect(html).toContain(`class="${String(styles.hatch)}"`);
    expect(names(html)).toEqual(['Ability 1, No data yet']);
  });

  it('dims a blocked slot and names the reason (never colour alone)', () => {
    const html = render('ability-1', {
      cooldownRemainingTicks: 0,
      blockedBy: 'not-enough-aether',
    });
    expect(html).toContain('data-look="idle"');
    expect(html).toContain(String(styles.isBlocked));
    expect(names(html)).toEqual(['Ability 1, Not enough aether']);
  });

  it('draws no icon for a kit slot without art and says it is empty', () => {
    const html = renderWithStore(<AbilitySlot slot="gadget-1" appearance="gadget" />, {
      ...withHudSetup(figmaHudState()),
      matchSetup: { ...FIGMA_MATCH_SETUP, selection: { classId: 'sentinel', specId: null } },
    });
    expect(html).not.toContain('<img');
    expect(names(html)).toEqual(['Gadget 1: empty, Cooling down']);
  });

  it.each(SLOTS)('gives %s a box of its frame size in its module CSS', (slot) => {
    const size = `calc(${String(SLOT_FRAMES[slot].size)} * var(--hud-u))`;
    const declarations = cssRule(css, `.slot[data-slot='${slot}']`);
    expect(declarations).toContain(`width: ${size}`);
    expect(declarations).toContain(`height: ${size}`);
  });
});
