import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AbilitySlotFrame } from './AbilitySlotFrame';
import styles from './AbilitySlotFrame.module.css';

describe('AbilitySlotFrame', () => {
  it('draws the Courage frame at its exact 86.6326 px with a 1 px grey stroke', () => {
    const html = renderToStaticMarkup(
      <AbilitySlotFrame slot="gadget-1" look="idle" cooldownFraction={null} />,
    );
    expect(html).toContain('viewBox="0 0 86.6326 86.6326"');
    expect(html).toContain(
      `<rect class="${String(styles.stroke)}" x="0.5" y="0.5" width="85.6326" height="85.6326" stroke-width="1"></rect>`,
    );
    expect(html).not.toMatch(/<filter|<linearGradient/);
  });

  it('cuts the whole-box gradient to the remaining cooldown from the bottom', () => {
    const html = renderToStaticMarkup(
      <AbilitySlotFrame slot="ability-1" look="cooldown" cooldownFraction={0.5} />,
    );
    expect(html).toMatch(/gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="0"/);
    expect(html).toMatch(/<rect x="0" y="35" width="70" height="35" fill="url\(#[^)]+cooldown\)">/);
  });

  it('draws the ready fill, the glows of the frame shape and the bright stroke above them', () => {
    const html = renderToStaticMarkup(
      <AbilitySlotFrame slot="gadget-2" look="ready" cooldownFraction={null} />,
    );
    const order = [styles.readyFill, 'filter="url(', styles.strokeReady].map((marker) =>
      html.indexOf(String(marker)),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain(`<feFlood class="${String(styles.glowFlood)}"></feFlood>`);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });
});
