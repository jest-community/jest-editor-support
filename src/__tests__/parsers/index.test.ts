/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *  @flow
 */

import parse from '../../parsers';

jest.mock('../../parsers/babel_parser');

const babelParser = require('../../parsers/babel_parser');
// const mockBabelParser = jest.fn();
// const babelParser = jest.createMockFromModule('../../parsers/babel_parser');
// jest.mock('../../parsers/babel_parser', () => {
//   return {parse: jest.fn()};
// });

describe('parse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it.each([['js'], ['.jsx'], ['.mjs']])('for file extension "%s" => parse with flow options', (ext) => {
    const file = `file.${ext}`;
    parse(file, undefined, {strictMode: true});
    expect(babelParser.parse).toHaveBeenCalledWith(
      file,
      undefined,
      expect.objectContaining({plugins: expect.arrayContaining(['flow'])})
    );
  });
  it.each([['ts'], ['.tsx']])('for file extension "%s" => parse with typescript options', (ext) => {
    const file = `file.${ext}`;
    parse(file, undefined, {strictMode: true});
    expect(babelParser.parse).toHaveBeenCalledWith(
      file,
      undefined,
      expect.objectContaining({plugins: expect.arrayContaining(['typescript'])})
    );
  });
  describe.each([['abc'], ['abc.ttsx']])('when unrecognized file type $s', (file) => {
    it('fall back to js parser in non-strict mode', () => {
      expect(() => parse(file, undefined, {strictMode: false})).not.toThrow();
      expect(babelParser.parse).toHaveBeenCalledWith(
        file,
        undefined,
        expect.objectContaining({plugins: expect.arrayContaining(['flow'])})
      );
    });
    it('throw exception in strict mode', () => {
      expect(() => parse(file, undefined, {strictMode: true})).toThrow();
    });
  });
});
