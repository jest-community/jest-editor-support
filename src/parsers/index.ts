/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ParseResult} from './parser_nodes';
import {parse as babelParser} from './babel_parser';
import {JESParserOptions, JESParserPluginOptions, parseOptions} from './helper';
export {JESParserOptions, JESParserPluginOptions};
/**
 * parse the test file by selecting proper parser based on the file extension.
 *
 * exception will be throw should the underlying parse failed.
 */
export default function parse(filePath: string, serializedData?: string, options?: JESParserOptions): ParseResult {
  return babelParser(filePath, serializedData, parseOptions(filePath, options));
}
