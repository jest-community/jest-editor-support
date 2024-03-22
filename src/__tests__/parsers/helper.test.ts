/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as helper from '../../parsers/helper';
import * as t from '@babel/types';
import * as parser from '@babel/parser';

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
      expect(helper.parseOptions('abc.ts', {plugins: {decorators: 'legacy'}})).toEqual({
        plugins: [...helper.tsPlugins, 'decorators-legacy'],
      });
    });
    it('with custom decoractors', () => {
      const decorators = {allowCallParenthesized: true};
      expect(helper.parseOptions('abc.ts', {plugins: {decorators}})).toEqual({
        plugins: [...helper.tsPlugins, ['decorators', decorators]],
      });
    });
  });
});

describe('isFunctionExpression', () => {
  it('returns true for ArrowFunctionExpression', () => {
    const node: t.ArrowFunctionExpression = t.arrowFunctionExpression([], t.identifier('x'));
    expect(helper.isFunctionExpression(node)).toBe(true);
  });

  it('returns true for FunctionExpression', () => {
    const node: t.FunctionExpression = t.functionExpression(null, [], t.blockStatement([]));
    expect(helper.isFunctionExpression(node)).toBe(true);
  });

  it('returns false for other node types', () => {
    const node: t.Node = t.identifier('x');
    expect(helper.isFunctionExpression(node)).toBe(false);
  });
});

function parseCodeToAST(codeSnippet: string): t.Node {
  // Parse the code snippet into an AST
  const ast = parser.parse(codeSnippet, {
    // Options to configure the parser
    sourceType: 'module', // Parse the code as an ES module
    plugins: [
      // Enable additional syntax features as needed
      'jsx', // If you're parsing JSX
      'typescript', // For TypeScript syntax
      // Add other plugins as needed for experimental syntax or specific language features
    ],
  });

  return ast.program.body[0] as t.Node;
}

describe('shallowAttr', () => {
  it('returns the value of a single attribute', () => {
    const node: t.Identifier = t.identifier('x');
    expect(helper.shallowAttr(node, 'name')).toBe('x');
  });
  it('returns the value of nested attributes', () => {
    const code = `const x = (a, b) => a + b;`;
    const node = parseCodeToAST(code);
    const declaration: any = (node as any).declarations[0];
    // this should be the "a + b" part
    const functionBody = helper.shallowAttr(declaration, 'init', 'body');
    expect(t.isBinaryExpression(functionBody)).toBe(true);
  }); 

  it('returns undefined for non-existent attributes', () => {
    const node: t.Identifier = t.identifier('x');
    expect(helper.shallowAttr(node, 'object')).toBeUndefined();
  });
  it('returns undefined for undefined nodes', () => {
    expect(helper.shallowAttr(undefined, 'name')).toBeUndefined();
  });
});

describe('getNameForNode', () => {
  describe('non-each cases', () => {
    it.each`
      case | code                                                    | expected
      ${1} | ${`import abc from "test"`}                             | ${[]}
      ${2} | ${`it('a test', () => {})`}                             | ${['it']}
      ${3} | ${`it.only('a test', () => {})`}                        | ${['it', 'only']}
      ${4} | ${'it.skip(`a ${stringTemplate} test`, () => {})'}      | ${['it', 'skip']}
      ${5} | ${`describe('a describe', () => {})`}                   | ${['describe']}
      ${6} | ${`describe.skip('a describe', () => {})`}              | ${['describe', 'skip']}
      ${7} | ${'describe(`another ${describe} describe`, () => {})'} | ${['describe']}
      ${8} | ${'test.concurrent.only(`3 elements ${code} block`, () => {})'} | ${['test', 'only']}
    `('case $case', ({code, expected}) => {
      const node = parseCodeToAST(code);
      const result = helper.getNameForNode(node);
      expect(result).toEqual(expected);
    });
  });
  describe('with each cases', () => {
    it('each with array', () => {
      const code = `
      describe.each([
        [1, 1, 2],
        [1, 2, 3],
        [2, 1, 3],
      ])('.add(%i, %i)', (a, b, expected) => {});
      `;

      const node = parseCodeToAST(code);
      const result = helper.getNameForNode(node);
      expect(result).toEqual(['describe', 'each']);
    });
    it('each with table', () => {
      const code = `
      it.skip.each\`
      a  | b  | expected
      ${1} | ${1} | ${2}
      ${1} | ${2} | ${3}
      ${2} | ${1} | ${3}
      \`('.add(%i, %i)', ({a, b, expected}) => {});
      `;

      const node = parseCodeToAST(code);
      const result = helper.getNameForNode(node);
      expect(result).toEqual(['it', 'each']);
    });
  });
});

describe('getCallExpression', () => {
  it('returns the CallExpression when given an ExpressionStatement', () => {
    const node: t.ExpressionStatement = t.expressionStatement(t.callExpression(t.identifier('x'), []));
    expect(helper.getCallExpression(node)).toBe(node.expression);
  });

  it('returns the CallExpression when given a CallExpression', () => {
    const node: t.CallExpression = t.callExpression(t.identifier('x'), []);
    expect(helper.getCallExpression(node)).toBe(node);
  });

  it('returns undefined for other node types', () => {
    const node: t.Node = t.identifier('x');
    expect(helper.getCallExpression(node)).toBeUndefined();
  });
});