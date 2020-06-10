/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import parse from '../../parsers';
import {parseJs, parseTs} from '../../parsers/babel_parser';

jest.mock('../../parsers/babel_parser', () => {
  return {parseJs: jest.fn(), parseTs: jest.fn()};
});

describe('select parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('for .js or .jsx or .mjs file', () => {
    const files = ['abc.js', 'abc.jsx', 'abc.mjs'];
    files.forEach(file => {
      parse(file, undefined, true);
      expect(parseJs).toHaveBeenCalled();
      expect(parseTs).not.toHaveBeenCalled();
      jest.clearAllMocks();
    });
  });
  it('for .ts or .tsx file', () => {
    const files = ['abc.ts', 'abc.tsx'];
    files.forEach(file => {
      parse(file, undefined, true);
      expect(parseJs).not.toHaveBeenCalled();
      expect(parseTs).toHaveBeenCalled();
      jest.clearAllMocks();
    });
  });
  describe('when unrecognized file type', () => {
    it('fall back to js parser in non-strict mode', () => {
      const files = ['abc', 'abc.ttsx'];
      files.forEach(file => {
        expect(() => parse(file, undefined, false)).not.toThrow();
        expect(parseJs).toHaveBeenCalled();
        expect(parseTs).not.toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });
    it('throw exception in strict mode', () => {
      const files = ['abc', 'abc.ttsx'];
      files.forEach(file => {
        expect(() => parse(file, undefined, true)).toThrow();
        jest.clearAllMocks();
      });
    });
  });
});
