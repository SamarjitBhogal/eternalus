import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

/**
 * Coverage thresholds follow a ratchet: they may only go up.
 * See docs/process/guardrails.md#2-coverage-ratchet.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'client',
      include: ['src/**/*.test.{ts,tsx}', 'vite.config.test.ts'],
      environment: 'node',
      sequence: { shuffle: true, seed: 20260926 },
      restoreMocks: true,
      // Vitest blanks every CSS import it does not process, `?raw` included; tests that read a
      // stylesheet's text (`global.css?raw`, a module's `?raw`) get it. Plain imports are unchanged.
      css: { include: [/\.css\?raw$/] },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: {
          lines: 55,
          branches: 55,
          functions: 55,
          statements: 55,
        },
      },
    },
  }),
);
