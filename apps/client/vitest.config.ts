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
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node',
      sequence: { shuffle: true, seed: 20260926 },
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: {
          lines: 45,
          branches: 50,
          functions: 45,
          statements: 45,
        },
      },
    },
  }),
);
