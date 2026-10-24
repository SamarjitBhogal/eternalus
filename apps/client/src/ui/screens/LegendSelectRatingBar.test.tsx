import { describe, expect, it } from 'vitest';

import { accessibleNames, renderWithStore } from '../testStore';
import { LegendSelectRatingBar } from './LegendSelectRatingBar';
import styles from './LegendSelectRatingBar.module.css';

const attribute = (html: string, name: string): string | undefined =>
  new RegExp(`${name}="([^"]*)"`).exec(html)?.[1];

describe('LegendSelectRatingBar', () => {
  it.each([
    [152 / 395, '38', '38.48101265822785%'],
    [333 / 395, '84', '84.30379746835443%'],
    [201 / 395, '51', '50.8860759493671%'],
  ])('rates %f as a meter at %s with a fill of %s', (value, now, width) => {
    const html = renderWithStore(<LegendSelectRatingBar label="Damage" value={value} />);

    expect(attribute(html, 'role')).toBe('meter');
    expect(attribute(html, 'aria-valuenow')).toBe(now);
    expect(attribute(html, 'aria-valuemin')).toBe('0');
    expect(attribute(html, 'aria-valuemax')).toBe('100');
    expect(html).toContain(`class="${String(styles.fill)}" style="width:${width}"`);
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Damage']);
  });

  it('shows an unrated Legend as the empty track, an image named "No data yet" (I-87)', () => {
    const html = renderWithStore(<LegendSelectRatingBar label="Support" value={null} />);

    expect(attribute(html, 'role')).toBe('img');
    expect(html).not.toContain('aria-value');
    expect(html).not.toContain(String(styles.fill));
    expect(html).toContain(`class="${String(styles.track)}" aria-hidden="true"`);
    expect(accessibleNames(html, '[role=img]')).toEqual(['Support: No data yet']);
  });
});
