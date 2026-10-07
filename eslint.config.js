// @ts-check
import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// packages/core is L2 Domain, the innermost layer: it imports nothing from the client, React or Redux.
const CORE_FORBIDDEN_PACKAGES = [
  'react',
  'react-dom',
  'react-redux',
  '@reduxjs/*',
  '@eternalus/client',
];

// Inside core, modules form rings: utils/teams → content → components → entities → systems and up.
// A module may import its own ring and the rings inside it, never one further out
// (packages/core/AGENTS.md, "Folders"). Each constant lists what lies outside that ring.
const OUTSIDE_ENTITIES = 'systems|state|commands|ai|Simulation';
const OUTSIDE_COMPONENTS = `entities|${OUTSIDE_ENTITIES}`;
const OUTSIDE_CONTENT = `components|${OUTSIDE_COMPONENTS}`;
const OUTSIDE_UTILS = `content|${OUTSIDE_CONTENT}`;

/** An ESLint `no-restricted-imports` option that keeps a core module away from outer modules. */
const coreModuleImports = (/** @type {string} */ forbidden, /** @type {string} */ ring) => [
  'error',
  {
    patterns: [
      { group: CORE_FORBIDDEN_PACKAGES },
      {
        regex: `(^|/)(${forbidden})(/|$)`,
        message: `${ring} is an inner module of core and must not import an outer module.`,
      },
    ],
  },
];

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
      'no-restricted-imports': ['error', { patterns: CORE_FORBIDDEN_PACKAGES }],
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
    files: ['packages/core/src/{utils,teams}/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': coreModuleImports(OUTSIDE_UTILS, 'utils/teams'),
    },
  },

  {
    files: ['packages/core/src/content/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': coreModuleImports(OUTSIDE_CONTENT, 'content'),
    },
  },

  {
    files: ['packages/core/src/components/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': coreModuleImports(OUTSIDE_COMPONENTS, 'components'),
    },
  },

  {
    files: ['packages/core/src/entities/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': coreModuleImports(OUTSIDE_ENTITIES, 'entities'),
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

  prettier,
);
