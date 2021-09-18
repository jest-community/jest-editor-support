module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  settings: {
    'import/parsers': {
      'babel-eslint': ['.js'],
      '@typescript-eslint/parser': ['.ts']
    },
    'import/resolver': {
      'node': true,
      'eslint-import-resolver-typescript': true
    }
  },
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    babelOptions: {
      // configuration for babel-eslint
      configFile: 'babel.config.js',
    },
    // configuration for @typescript-eslint
    project: 'tsconfig.json'
  },
  overrides: [
    // linting setup for JS files.
    {
      files: '**/*.js',
      plugins: ['babel', 'flowtype', 'prettier', 'import'],
      extends: ['airbnb-base', 'plugin:flowtype/recommended', 'prettier', 'plugin:prettier/recommended'],
      rules: {
        'prettier/prettier': ["error", { "endOfLine": "auto" }],
        'no-underscore-dangle': 'off',
        'camelcase': 'off',
        'no-param-reassign': ['error', { 'props': false }],
        'import/extensions': [0, 'never', { 'ts': 'never' }],
        'import/named': 'off',
        'import/namespace': 'off',
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-as-default': 'off',
        'max-classes-per-file': 'off',
        'prefer-object-spread': 'off',
      },
    },
    // linting setup for TS files.
    {
      files: '**/*.ts',
      plugins: ['babel', 'prettier', 'import', '@typescript-eslint'],
      extends: [
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier',
        'plugin:prettier/recommended',
        'prettier/@typescript-eslint',
      ],
      rules: {
        'prettier/prettier': 'error',
        'no-underscore-dangle': 'off',
        'camelcase': 'off',
        'no-param-reassign': ['error', { 'props': false }],
        'import/extensions': [0, 'never', { 'ts': 'never' }],
        'import/named': 'off',
        'import/namespace': 'off',
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-as-default': 'off',
        'max-classes-per-file': 'off',
        // TS specific
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/prefer-regexp-exec': 'off',
        '@typescript-eslint/array-type': ['error', {
          'default': 'array',
          'readonly': 'array'
        }],
      },
    },
  ]
};
