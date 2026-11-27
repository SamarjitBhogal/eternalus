// @vitest-environment happy-dom
import { expect, it } from 'vitest';

import { SovereignArtwork } from './SovereignArtwork';
import styles from './SovereignArtwork.module.css';

it('places both CSS palettes at the projected positions and removes missing portraits', () => {
  const layer = document.createElement('div');
  const artwork = new SovereignArtwork(layer, { width: 1600, height: 900 });
  artwork.beginFrame();
  artwork.draw('light', false, { x: 400, y: 450 }, 80);
  artwork.draw('dark', true, { x: 1200, y: 450 }, 80);
  artwork.endFrame();
  const light = layer.querySelector<HTMLElement>(
    `.${String(styles.king)}:not(.${String(styles.dark)})`,
  );
  const dark = layer.querySelector<HTMLElement>(`.${String(styles.dark)}`);
  expect(light?.style.left).toBe('25%');
  expect(light?.style.top).toBe('50%');
  expect(light?.style.width).toBe('5%');
  expect(dark?.style.left).toBe('75%');
  expect(dark?.querySelector(`.${String(styles.crown)}`)).not.toBeNull();
  artwork.beginFrame();
  artwork.draw('dark', true, { x: 1000, y: 450 }, 80);
  artwork.endFrame();
  expect(layer.children).toHaveLength(1);
  expect(layer.firstElementChild).toBe(dark);
  artwork.destroy();
  expect(layer.children).toHaveLength(0);
});
