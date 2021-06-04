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

describe('getFileType', () => {
  it('returns js for .js or .jsx or .mjs file', () => {
    const files = ['abc.js', 'abc.jsx', 'abc.mjs'];
    files.forEach((file) => {
      expect(helper.getFileType(file)).toEqual('js');
      jest.clearAllMocks();
    });
  });
  it('returns ts for .ts', async () => {
    expect(helper.getFileType('abc.ts')).toEqual('ts');
  });
  it('returns tsx for .tsx', async () => {
    expect(helper.getFileType('abc.tsx')).toEqual('tsx');
  });
});

describe('parseOption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('js file should contain "flow" and "jsx" plugins', () => {
    expect(helper.parseOptions('abc.js')).toEqual({plugins: [...helper.plugins, 'flow', 'jsx']});
  });
  it('ts file should contain "typescript" plugin', () => {
    expect(helper.parseOptions('abc.ts')).toEqual({plugins: [...helper.plugins, 'typescript']});
  });
  it('tsx file should contain "typescript" and "jsx" plugins', () => {
    expect(helper.parseOptions('abc.tsx')).toEqual({plugins: [...helper.plugins, 'typescript', 'jsx']});
  });
  describe('for unrecognized file type', () => {
    it('in strict mode, throw error', () => {
      expect(() => helper.parseOptions('abc.json', true)).toThrow();
    });
    it('in non-strict mode, use js options', () => {
      expect(helper.parseOptions('abc.json', false)).toEqual({plugins: [...helper.plugins, 'flow', 'jsx']});
    });
  });
});
