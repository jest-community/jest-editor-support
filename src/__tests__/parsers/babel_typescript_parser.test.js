/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parseTs} from '../../parsers/babel_parser';
import {parserTests} from '../../../fixtures/parser_tests';

parserTests(parseTs, true);
