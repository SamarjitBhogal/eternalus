import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'core',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Tests must be deterministic; never depend on wall-clock time or order.
    sequence: { shuffle: true, seed: 20260926 },
    restoreMocks: true,
    // Whole-match simulation tests take 1-5 s locally and several times that on shared CI
    // runners under coverage; Vitest's 5 s default made them fail on runner speed alone.
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/content/**'],
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
