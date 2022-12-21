/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as helper from '../../parsers/helper';

describe('parseOptions', () => {
  it('returns jsOptions for .js or .jsx or .mjs file', () => {
    const files = ['abc.js', 'abc.jsx', 'abc.mjs', 'abc.JS', 'abc.JSX', 'abc.MJS'];
    files.forEach((file) => {
      expect(helper.parseOptions(file)).toEqual({plugins: [...helper.jsPlugins, helper.DefaultDecoratorPlugin]});
    });
  });
  it('returns tsOptions for .ts', () => {
    const files = ['abc.ts', 'abc.TS'];
    files.forEach((file) => {
      expect(helper.parseOptions(file)).toEqual({plugins: [...helper.tsPlugins, helper.DefaultDecoratorPlugin]});
    });
  });
  it('returns tsxOptions for .tsx', () => {
    const files = ['abc.tsx', 'abc.TSX'];
    files.forEach((file) => {
      expect(helper.parseOptions(file)).toEqual({plugins: [...helper.tsxPlugins, helper.DefaultDecoratorPlugin]});
    });
  });
  describe('for unrecognized file type', () => {
    it('in strict mode, throw error', () => {
      expect(() => helper.parseOptions('abc.json', {strictMode: true})).toThrow();
    });
    it('in non-strict mode, use js options', () => {
      expect(helper.parseOptions('abc.json', {strictMode: false})).toEqual({
        plugins: [...helper.jsPlugins, helper.DefaultDecoratorPlugin],
      });
    });
  });
  describe('can specify decoractors options', () => {
    it('with legacy decoractors', () => {
      expect(helper.parseOptions('abc.ts', {decorators: 'legacy'})).toEqual({
        plugins: [...helper.tsPlugins, 'decorators-legacy'],
      });
    });
    it('with custom decoractors', () => {
      const decorators = ['decorators', {allowCallParenthesized: true}];
      expect(helper.parseOptions('abc.ts', {decorators})).toEqual({
        plugins: [...helper.tsPlugins, decorators],
      });
    });
  });
});
