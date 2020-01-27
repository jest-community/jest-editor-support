module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier', 
    'plugin:prettier/recommended', 
    'prettier/@typescript-eslint',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    'prettier/prettier': 'error',
    'no-underscore-dangle': 'off',
    'camelcase': 'off',
    'no-param-reassign': ['error', { 'props': false }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
    '@typescript-eslint/array-type': ['error', {
      'default' : 'array',
      'readonly': 'array'
    }],
    'max-classes-per-file': 'off',
  },
};
