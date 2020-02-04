/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ParseResult} from './parser_nodes';
import {parseJs, parseTs} from './babel_parser';

/**
 * parse the test file by selecting proper parser based on the file extension.
 *
 * exception will be throw should the underlying parse failed.
 */
export default function parse(
  filePath: string,
  serializedData?: string,
  strictMode: boolean = false,
  additionalPlugins?: string[]
): ParseResult {
  if (filePath.match(/\.tsx?$/)) {
    return parseTs(filePath, serializedData, additionalPlugins);
  }
  if (filePath.match(/\.m?jsx?$/)) {
    return parseJs(filePath, serializedData, additionalPlugins);
  }

  // unexpected file extension, for backward compatibility, will use js parser
  if (strictMode) {
    throw new TypeError(`unable to find parser for unrecognized file extension: ${filePath}`);
  }
  return parseJs(filePath, serializedData, additionalPlugins);
}
