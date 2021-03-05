/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import {parserTests} from '../../../fixtures/parser_tests';

const {parseOptions} = require('../../parsers/helper');
const {parse} = require('../../parsers/babel_parser');

const parseTs = (file: string, data?: string) => parse(file, data, parseOptions('always.ts'));
parserTests(parseTs, true);
