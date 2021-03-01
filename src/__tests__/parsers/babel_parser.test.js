/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const {parseOptions} = require('../../parsers/helper');
const {parse} = require('../../parsers/babel_parser');
const {parserTests} = require('../../../fixtures/parser_tests');

const parseJs = (file: string, data?: string) => parse(file, data, parseOptions('always.js'));
parserTests(parseJs);
