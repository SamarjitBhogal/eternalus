import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'core',
    include: ['src/**/*.test.{ts,js}'],
    environment: 'node',
    // Tests must be deterministic; never depend on wall-clock time or order.
    sequence: { shuffle: true, seed: 20260926 },
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,js}'],
      exclude: ['src/**/*.test.{ts,js}', 'src/index.ts', 'src/content/**'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
