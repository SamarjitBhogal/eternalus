// @ts-check
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/** core must never draw from an unseeded RNG. */
const NO_MATH_RANDOM = {
  object: 'Math',
  property: 'random',
  message: 'core must be deterministic: use a seeded RNG.',
};

/** Transcendental Math differs between engines; core reaches it through one file (ADR 0012). */
const NO_TRANSCENDENTAL_MATH = ['sin', 'cos', 'atan2', 'exp', 'pow'].map((property) => ({
  object: 'Math',
  property,
  message: 'core must be deterministic: use utils/deterministicMath.ts (ADR 0012).',
}));

export default defineConfig(
  // Flat config ignores .gitignore; each worktree is linted by its own hooks and CI (ADR 0014).
  // eternalus-agent-work/ is agents' untracked scratch (probes, logs), not source (DEC-179).
  globalIgnores([
    '**/dist/',
    '**/coverage/',
    '.worktrees/',
    '.claude/worktrees/',
    'eternalus-agent-work/',
  ]),

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },

  {
    files: ['apps/client/src/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },

  {
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react-dom',
            'react-redux',
            '@reduxjs/*',
            '@eternalus/client',
            '@eternalus/server',
            '@eternalus/protocol',
          ],
        },
      ],
      'no-restricted-properties': ['error', NO_MATH_RANDOM, ...NO_TRANSCENDENTAL_MATH],
    },
  },

  {
    // The wire types import only core's types (ADR 0016 point 6).
    files: ['packages/protocol/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', 'ws', '@eternalus/client', '@eternalus/server'] },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: [{ name: '@eternalus/core', allowTypeImports: true }] },
      ],
    },
  },

  {
    // The Duel server never imports the client; only its listener touches `ws` (ADR 0016).
    files: ['apps/server/src/**/*.ts'],
    ignores: ['apps/server/src/transport/WsListener.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', 'ws', '@eternalus/client'] },
      ],
    },
  },

  {
    // The client never imports the server or its socket library (ADR 0016 point 6).
    files: ['apps/client/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['ws', '@eternalus/server'] }],
    },
  },

  {
    // The one door to transcendental Math in core (ADR 0012).
    files: ['packages/core/src/utils/deterministicMath.ts'],
    rules: { 'no-restricted-properties': ['error', NO_MATH_RANDOM] },
  },

  {
    files: ['**/*.test.{ts,tsx}'],
    extends: [vitest.configs.recommended],
    rules: { 'vitest/no-disabled-tests': 'error' },
  },

  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    // Zero-dependency Node scripts (agent hooks, docs check). Plain ESM, no type checking.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
      },
    },
  },

  prettier,
);
