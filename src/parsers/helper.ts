/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ParserOptions, ParserPlugin} from '@babel/parser';

/**
 * determine if the file is a typescript (ts), javascript (js) otherwise returns undefined.
 * @param filepath
 * @returns 'js'|'ts' or undefined
 */
export const supportedFileType = (filePath: string): 'ts' | 'js' | undefined => {
  if (filePath.match(/\.tsx?$/)) {
    return 'ts';
  }
  if (filePath.match(/\.m?jsx?$/)) {
    return 'js';
  }
  return undefined;
};

/**
 * determine if the file is a react file(jsx, tsx);
 * @param filepath
 * @returns true or false
 */
export const isReactFileType = (filePath: string): boolean => {
  if (filePath.match(/\.[jt]sx$/)) {
    return true;
  }
  return false;
};

export const plugins: ParserPlugin[] = [
  'asyncGenerators',
  'bigInt',
  'classPrivateMethods',
  'classPrivateProperties',
  'classProperties',
  'doExpressions',
  'dynamicImport',
  'estree',
  'exportDefaultFrom',
  'exportNamespaceFrom', // deprecated
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
  ['decorators', {decoratorsBeforeExport: true}],
  ['pipelineOperator', {proposal: 'smart'}],
];

export const parseOptions = (filePath: string, strictMode = false): ParserOptions | null => {
  const fileType = supportedFileType(filePath);

  let parserPlugins = plugins;
  // only add jsx plugin if file is react type.
  if (fileType && isReactFileType(filePath)) {
    parserPlugins = [...plugins, 'jsx'];
  }

  if (fileType === 'ts') {
    return {plugins: [...parserPlugins, 'typescript']};
  }
  const jsOptions: ParserOptions = {plugins: [...parserPlugins, 'flow']};
  if (fileType === 'js') {
    return jsOptions;
  }

  // unexpected file extension, for backward compatibility, will use js parser
  if (strictMode) {
    throw new TypeError(`unable to find parser options for unrecognized file extension: ${filePath}`);
  }

  return jsOptions;
};
