/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as helper from '../../parsers/helper';

jest.mock('../../parsers/babel_parser', () => {
  return {parse: jest.fn()};
});

describe('supportedFileType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('for .js or .jsx or .mjs file', () => {
    const files = ['abc.js', 'abc.jsx', 'abc.mjs'];
    files.forEach((file) => {
      expect(helper.supportedFileType(file)).toEqual('js');
      jest.clearAllMocks();
    });
  });
  describe('parseOption', () => {
    it('js file should contain "flow" plugin', () => {
      expect(helper.parseOptions('abc.js')?.plugins).toContain('flow');
    });
    it('ts file should contain "typescript" plugin', () => {
      expect(helper.parseOptions('abc.ts')).toEqual({plugins: [...helper.plugins, 'typescript']});
    });
    it('tsx/js/jsx file should contain "jsx" plugin', () => {
      expect(helper.parseOptions('abc.tsx').plugins).toContain('jsx');
      expect(helper.parseOptions('abc.js').plugins).toContain('jsx');
      expect(helper.parseOptions('abc.jsx').plugins).toContain('jsx');
    });
    it('ts file should not contain "jsx" plugin', () => {
      expect(helper.parseOptions('abc.ts').plugins).not.toContain('jsx');
    });
    describe('for unrecognized file type', () => {
      it('in strict mode, throw error', () => {
        expect(() => helper.parseOptions('abc.json', true)).toThrow();
      });
      it('in non-strict mode, use js options', () => {
        expect(helper.parseOptions('abc.json', false)).toEqual({plugins: [...helper.plugins, 'flow']});
      });
    });
  });
});
