import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { accessibleNames } from '../testStore';
import { StatusBar } from './StatusBar';
import styles from './StatusBar.module.css';

describe('StatusBar', () => {
  it('fills to the value and is a meter', () => {
    const html = renderToStaticMarkup(<StatusBar label="Stronghold" fraction={0.5} />);
    expect(html).toContain('style="--status-bar-fill:50%"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Stronghold']);
  });

  it('is a hatched image "No data yet" without a value', () => {
    const html = renderToStaticMarkup(
      <StatusBar label="Stronghold" fraction={null} className="place" />,
    );
    expect(html).toContain(`class="${String(styles.bar)} ${String(styles.noData)} place"`);
    expect(html).not.toContain('--status-bar-fill');
    expect(html).not.toContain('aria-valuenow');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Stronghold: No data yet']);
  });
});
