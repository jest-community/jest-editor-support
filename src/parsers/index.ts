/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ParseResult} from './parser_nodes';
import {parse as parseJs} from './babylon_parser';
import {parse as parseTs} from './typescript_parser';

/**
 * parse the test file by selecting proper parser based on the file extension.
 *
 * exception will be throw should the underlying parse failed.
 */
export default function parse(file: string, data?: string, strict: boolean = false): ParseResult {
  if (file.match(/\.tsx?$/)) {
    return parseTs(file, data);
  }
  if (file.match(/\.jsx?$/)) {
    return parseJs(file, data);
  }

  // unexpected file extension, for backward compatibility, will use js parser
  if (strict) {
    throw new TypeError(`unable to find parser for unrecognized file extension: ${file}`);
  }
  return parseJs(file, data);
}
