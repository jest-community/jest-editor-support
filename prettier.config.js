module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 120,
  bracketSpacing: false,
  overrides: [
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
      },
    },
  ],
};
