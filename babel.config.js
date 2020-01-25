module.exports = {
  presets: [['@babel/preset-env', {useBuiltIns: 'usage', corejs: '3'}], '@babel/typescript'],
  plugins: ['@babel/plugin-proposal-optional-chaining', '@babel/proposal-class-properties', '@babel/transform-runtime'],
};
