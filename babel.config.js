module.exports = {
  presets: [
    [
      '@babel/preset-env',
      { useBuiltIns: 'usage' }
    ],
    '@babel/flow',
  ],
  plugins: ['@babel/plugin-transform-dotall-regex']
};
