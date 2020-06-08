module.exports = {
  presets: [['@babel/preset-env', {useBuiltIns: 'usage', corejs: '3'}], '@babel/flow', '@babel/typescript'],
  plugins: ['@babel/proposal-class-properties'],
};
