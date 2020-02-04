import * as babelParser from '@babel/parser';
import {plugins} from '../../parsers/babel_parser';
import parse from '../../parsers/index';

const additionalPlugins = [
  'classPrivateProperties',
  'classPrivateMethods',
  'doExpressions',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  'partialApplication',
  'throwExpressions',
  'topLevelAwait',
];

const codeTobeParsed = 'const bla = 1';

const parserConfigFlow = {
  sourceType: 'module',
  plugins: [...plugins, ...additionalPlugins, 'flow'],
};

const parserConfigTypescript = {
  sourceType: 'module',
  plugins: [...plugins, ...additionalPlugins, 'typescript'],
};

describe('test plugins', () => {
  it('created plugins for javascript file correctly', () => {
    const spy = jest.spyOn(babelParser, 'parse');
    parse('fileName.js', codeTobeParsed, false, additionalPlugins);
    expect(spy).toBeCalledWith(codeTobeParsed, parserConfigFlow);
  });

  it('created plugins for typescript file correctly', () => {
    const spy = jest.spyOn(babelParser, 'parse');
    parse('fileName.ts', codeTobeParsed, false, additionalPlugins);
    expect(spy).toBeCalledWith(codeTobeParsed, parserConfigTypescript);
  });
});
