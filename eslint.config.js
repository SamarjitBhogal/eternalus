// @ts-check
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['**/dist/', '**/coverage/']),

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
        { patterns: ['react', 'react-dom', 'react-redux', '@reduxjs/*', '@eternalus/client'] },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'core must be deterministic: use a seeded RNG.',
        },
      ],
    },
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
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly' },
    },
  },

  // Core module rings (packages/core/AGENTS.md, "Module rings"). core is L2 Domain, the innermost
  // layer; inside it, utils/teams → content → components → entities → systems and up. A module may
  // import its own ring and the rings inside it, never one further out.
  ...[
    {
      ring: 'utils/teams',
      folders: '{utils,teams}',
      outside: 'content|components|entities|systems|state|commands|ai|Simulation',
    },
    {
      ring: 'content',
      folders: 'content',
      outside: 'components|entities|systems|state|commands|ai|Simulation',
    },
    {
      ring: 'components',
      folders: 'components',
      outside: 'entities|systems|state|commands|ai|Simulation',
    },
    // 02 section 2: entities may import state/ for types only (e.g. a spawn context's events).
    {
      ring: 'entities',
      folders: 'entities',
      outside: 'systems|commands|ai|Simulation',
      typesOnly: 'state',
    },
  ].map(({ ring, folders, outside, typesOnly }) => ({
    files: [`packages/core/src/${folders}/**/*.ts`],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react-redux', '@reduxjs/*', '@eternalus/client'] },
            {
              regex: `(^|/)(${outside})(/|$)`,
              message: `${ring} is an inner module of core and must not import an outer module.`,
            },
            ...(typesOnly === undefined
              ? []
              : [
                  {
                    regex: `(^|/)(${typesOnly})(/|$)`,
                    allowTypeImports: true,
                    message: `${ring} may import only types from ${typesOnly}/.`,
                  },
                ]),
          ],
        },
      ],
    },
  })),

  prettier,
);
