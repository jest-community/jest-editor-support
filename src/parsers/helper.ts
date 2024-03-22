/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {DecoratorsPluginOptions, ParserOptions, ParserPluginWithOptions, ParserPlugin} from '@babel/parser';
import * as t from '@babel/types';

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
export const isFunctionExpression = (node: t.Node): node is t.ArrowFunctionExpression | t.FunctionExpression =>
  t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);

const getNodeAttribute = <T = t.Node>(
  node: t.Node | undefined | null,
  isDeep: boolean,
  ...attributes: string[]
): T | undefined => {
  if (!node) {
    return;
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */

  const value: any = node;
  return attributes.reduce((aNode: any, attr: string) => {
    if (!aNode || !aNode[attr]) {
      return;
    }
    if (isDeep) {
      let n = aNode;
      while (n[attr]) {
        n = aNode[attr];
      }
      return n;
    }
    return aNode[attr];
  }, value) as T | undefined;
};

export const shallowAttr = <T = t.Node>(node: t.Node | undefined | null, ...attributes: string[]) =>
  getNodeAttribute<T>(node, false, ...attributes);

const deepAttr = <T = t.Node>(node: t.Node | undefined | null, ...attributes: string[]) =>
  getNodeAttribute<T>(node, true, ...attributes);

// const isFunctionCall = (node: t.Node): node is t.ExpressionStatement => t.isExpressionStatement(node) && t.isCallExpression(node.expression);
export const getCallExpression = (node: t.Node): t.CallExpression | undefined => {
  if (t.isExpressionStatement(node)) {
    if (t.isCallExpression(node.expression)) {
      return node.expression;
    }
  } else if (t.isCallExpression(node)) {
    return node;
  }
};

/**
 * Pull out the name of a CallExpression (describe/it) and the last property (each, skip etc)
 */
export const getNameForNode = (node: t.Node) => {
  const expression = getCallExpression(node);
  const rootCallee = deepAttr(expression, 'callee');
  if (rootCallee) {
    // Get root callee in case it's a chain of higher-order functions (e.g. .each(table)(name, fn))
    const attrs = ['property', 'name'];
    const lastProperty =
      shallowAttr<string>(rootCallee, ...attrs) || shallowAttr(deepAttr(rootCallee, 'tag'), ...attrs);
    const name =
      shallowAttr<string>(rootCallee, 'name') ||
      // handle cases where it's a member expression (e.g .only or .concurrent.only)
      shallowAttr<string>(deepAttr(rootCallee, 'object'), 'name') ||
      // handle cases where it's part of a tag (e.g. .each`table`)
      shallowAttr<string>(deepAttr(rootCallee, 'tag', 'object'), 'name');

    return [name, lastProperty];
  }
  return [];
};
