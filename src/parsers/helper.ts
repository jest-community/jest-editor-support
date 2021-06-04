/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ParserOptions, ParserPlugin} from '@babel/parser';

/**
 * determine if the file is a javascript (js), typescript (ts), or typescript JSX (tsx),
 * otherwise returns undefined.
 * @param filepath
 * @returns 'js'|'ts'|'tsx' or undefined
 */
export const getFileType = (filePath: string): 'js' | 'ts' | 'tsx' | undefined => {
  if (filePath.match(/\.ts$/)) {
    return 'ts';
  }
  if (filePath.match(/\.tsx$/)) {
    return 'tsx';
  }
  if (filePath.match(/\.m?jsx?$/)) {
    return 'js';
  }
  return undefined;
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
  const fileType = getFileType(filePath);
  if (fileType === 'ts') {
    return {plugins: [...plugins, 'typescript']};
  }
  if (fileType === 'tsx') {
    return {plugins: [...plugins, 'typescript', 'jsx']};
  }
  const jsOptions: ParserOptions = {plugins: [...plugins, 'flow', 'jsx']};
  if (fileType === 'js') {
    return jsOptions;
  }

  // unexpected file extension, for backward compatibility, will use js parser
  if (strictMode) {
    throw new TypeError(`unable to find parser options for unrecognized file extension: ${filePath}`);
  }

  return jsOptions;
};
