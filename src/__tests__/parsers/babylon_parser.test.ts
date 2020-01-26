/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const {parse} = require('../../parsers/babylon_parser');
const {parserTests} = require('../../../fixtures/parser_tests');

parserTests(parse);
