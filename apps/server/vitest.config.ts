import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'server',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Tests must be deterministic; never depend on wall-clock time or order.
    sequence: { shuffle: true, seed: 20261110 },
    restoreMocks: true,
    // The `CoreDuelSimulationFactory` tests build a whole Duel map and took up to 5.1 s on the
    // ubuntu CI runner under coverage, and Vitest's 5 s default failed them on runner speed
    // alone (DEC-325); core's and client's `testTimeout` is the same 60 s for the same reason.
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.fixture.ts',
        'src/**/Fake*.ts',
        'src/main.ts',
        'src/bots/main.ts',
        'src/bots/WebSocketBotLinkFactory.ts',
      ],
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
