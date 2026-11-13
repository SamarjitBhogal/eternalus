import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'protocol',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Tests must be deterministic; never depend on wall-clock time or order.
    sequence: { shuffle: true, seed: 20261110 },
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85,
      },
    },
  },
});
