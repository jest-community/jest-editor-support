/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {DecoratorsPluginOptions, ParserOptions, ParserPluginWithOptions, ParserPlugin} from '@babel/parser';

// taken from https://github.com/babel/babel/blob/main/packages/babel-parser/typings/babel-parser.d.ts
// but comment out a few file-based and either-or plugins
const commonPlugins: ParserPlugin[] = [
  'asyncDoExpressions',
  'asyncGenerators',
  'bigInt',
  'classPrivateMethods',
  'classPrivateProperties',
  'classProperties',
  'classStaticBlock', // Enabled by default
  'decimal',
  // 'decorators-legacy',
  'decoratorAutoAccessors',
  'destructuringPrivate',
  'doExpressions',
  'dynamicImport',
  'explicitResourceManagement',
  'exportDefaultFrom',
  'exportNamespaceFrom', // deprecated
  // 'flow',
  'flowComments',
  'functionBind',
  'functionSent',
  'importMeta',
  // 'jsx',
  'logicalAssignment',
  'importAssertions',
  'importReflection',
  'moduleBlocks',
  'moduleStringNames',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  'partialApplication',
  // 'placeholders',
  'privateIn', // Enabled by default
  'regexpUnicodeSets',
  'throwExpressions',
  'topLevelAwait',
  'v8intrinsic',
  // plugin with options
  // ['decorators', {decoratorsBeforeExport: true}],
  ['pipelineOperator', {proposal: 'smart'}],
  'recordAndTuple',
];

export const DefaultDecoratorPlugin: ParserPluginWithOptions = ['decorators', {decoratorsBeforeExport: true}];
export const jsPlugins: ParserPlugin[] = [...commonPlugins, 'flow', 'jsx'];
export const tsPlugins: ParserPlugin[] = [...commonPlugins, 'typescript'];
export const tsxPlugins: ParserPlugin[] = [...commonPlugins, 'typescript', 'jsx'];

export interface JESParserPluginOptions {
  decorators?: 'legacy' | DecoratorsPluginOptions;
}
export interface JESParserOptions {
  plugins?: JESParserPluginOptions;
  strictMode?: boolean;
}
export const parseOptions = (filePath: string, options?: JESParserOptions): ParserOptions => {
  const optionalPlugins = (): ParserPlugin[] => {
    if (!options?.plugins?.decorators) {
      return [DefaultDecoratorPlugin];
    }
    if (options.plugins?.decorators === 'legacy') {
      return ['decorators-legacy'];
    }
    return [['decorators', options.plugins.decorators]];
  };
  if (filePath.match(/\.ts$/i)) {
    return {plugins: [...tsPlugins, ...optionalPlugins()]};
  }

  if (filePath.match(/\.tsx$/i)) {
    return {plugins: [...tsxPlugins, ...optionalPlugins()]};
  }

  // for backward compatibility, use js parser as default unless in strict mode
  if (!options?.strictMode || filePath.match(/\.m?jsx?$/i)) {
    return {plugins: [...jsPlugins, ...optionalPlugins()]};
  }

  throw new TypeError(`unable to find parser options for unrecognized file extension: ${filePath}`);
};
