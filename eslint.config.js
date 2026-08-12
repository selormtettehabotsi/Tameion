import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

// One flat config for the whole repository, run from the root as `npm run lint`.
//
// Both packages are linted here rather than from inside client/ and server/,
// because neither of those has eslint as a dependency: running `npx eslint`
// from within them downloads a stray copy and then fails to resolve this
// file's imports.
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'client/public/**',
      'scripts/**',
      'generate-doc.js',
    ],
  },

  // ── Server: CommonJS on Node ──────────────────────────────────────
  {
    files: ['server/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // ── Client: TypeScript + React in the browser ─────────────────────
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['client/**/*.{ts,tsx}'],
  })),
  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // New in eslint-plugin-react-hooks v7 (React Compiler rules). It flags
      // the ordinary fetch-on-mount pattern used across the pages here:
      //   useEffect(() => { load(); }, [])   where load() calls setLoading(true)
      // That costs one extra render on mount and is not a correctness problem,
      // so the rule is off rather than restructuring every page around it.
      // The other react-hooks rules, including exhaustive-deps, stay on.
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // The API layer intentionally returns `unknown` from the JSON parser and
      // narrows at the call site; a blanket ban on `any` is not useful here.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  prettier,
];
