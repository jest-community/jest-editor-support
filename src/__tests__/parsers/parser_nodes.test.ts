/* eslint-disable camelcase */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {DescribeBlock, Expect, ItBlock, ParseResult, ParsedNode, ParsedNodeType} from '../../parsers/parser_nodes';

describe('ParsedNode', () => {
  it('can filter children', () => {
    const root = new ParsedNode(ParsedNodeType.describe, 'a/b/c');
    const c1 = root.addChild(ParsedNodeType.describe);
    const c2 = root.addChild(ParsedNodeType.it);
    const c1_1 = c1.addChild(ParsedNodeType.it);
    const c1_2 = c1.addChild(ParsedNodeType.describe);
    const c1_2_1 = c1_2.addChild(ParsedNodeType.it);

    let filtered = root.filter((n) => n.type === 'it');
    expect(filtered.length).toEqual(3);
    expect(filtered).toEqual(expect.arrayContaining([c2, c1_1, c1_2_1]));

    filtered = root.filter((n) => n.type === 'describe');
    expect(filtered.length).toEqual(2);
    expect(filtered).toEqual(expect.arrayContaining([c1, c1_2]));

    filtered = c1.filter((n) => n.type === 'it');
    expect(filtered.length).toEqual(2);

    filtered = c1_2.filter((n) => n.type === 'it');
    expect(filtered.length).toEqual(1);

    filtered = c1_1.filter((n) => n.type === 'it');
    expect(filtered.length).toEqual(0);

    filtered = c1_1.filter((n) => n.type === 'it', true);
    expect(filtered.length).toEqual(1);
  });
  it('can attach lastProperty for NamedBlock', () => {
    const itBlock = new ItBlock('abc.js', 'a test');
    itBlock.lastProperty = 'each';
    expect(itBlock.lastProperty).toEqual('each');
    expect(itBlock.name).toEqual('a test');

    const descBlock = new DescribeBlock('abc.js', 'a describe');
    descBlock.lastProperty = 'only';
    expect(descBlock.lastProperty).toEqual('only');
    expect(descBlock.name).toEqual('a describe');
  });
  it('throws an error when adding an unknown child', () => {
    const root = new ParsedNode(ParsedNodeType.describe, 'a/b/c');
    expect(() => {
      root.addChild('unknown' as ParsedNodeType);
    }).toThrow(TypeError);
  });
});

describe('ParseResult', () => {
  it('can add node by types', () => {
    const d1 = new DescribeBlock('a/b/c', 'd1');
    const i1 = new ItBlock('a/b/c', 'i1');
    const i2 = new ItBlock('a/b/c', 'i2');
    const e1 = i1.addChild(ParsedNodeType.expect);

    const result = new ParseResult('a/b/c');
    result.addNode(d1);
    result.addNode(i1);
    result.addNode(i2);
    result.addNode(e1);

    expect(result.describeBlocks.length).toEqual(1);
    expect(result.itBlocks.length).toEqual(2);
    expect(result.expects.length).toEqual(1);
  });
  it('can dedup Expects', () => {
    const d1 = new DescribeBlock('a/b/c', 'd1');
    const d2 = new DescribeBlock('a/b/c', 'd2');
    const e1 = new Expect('a/b/c');
    const e2 = new Expect('a/b/c');

    const start = {column: 11, line: 10};
    const allNodes = [d1, d2, e1, e2];
    allNodes.forEach((n) => {
      n.start = start;
    });

    // without dedup, anything goes
    let result = new ParseResult('a/b/c');
    allNodes.forEach((n) => result.addNode(n));
    expect(result.describeBlocks.length).toEqual(2);
    expect(result.itBlocks.length).toEqual(0);
    expect(result.expects.length).toEqual(2);

    // enable dedup, only impact expect blocks
    result = new ParseResult('a/b/c');
    allNodes.forEach((n) => result.addNode(n, true));
    expect(result.describeBlocks.length).toEqual(2);
    expect(result.itBlocks.length).toEqual(0);
    expect(result.expects.length).toEqual(1);
  });
  it('throws an error on unknown node type', () => {
    const result = new ParseResult('a/b/c');
    expect(() => {
      const node = new ParsedNode(ParsedNodeType.root, '');
      result.addNode(node);
    }).toThrow(TypeError);
  });
});
