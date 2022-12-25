/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import path from 'path';
import Snapshot from '../Snapshot';

const snapshotHelper = new Snapshot();
const snapshotFixturePath = path.resolve(__dirname, 'fixtures/snapshots');

test('nodescribe.example', async () => {
  const filePath = path.join(snapshotFixturePath, 'nodescribe.example');
  const results = await snapshotHelper.getMetadataAsync(filePath);
  const allAssertion = ['fit', 'it', 'it.only', 'it.skip', 'test', 'test.only', 'test.skip', 'xit', 'xtest'];

  const expectations = Object.create(null);
  allAssertion.forEach((assertion) => {
    // $FlowIgnore[prop-missing]
    expectations[`${assertion} 1`] = {
      assertion,
      checked: false,
      number: 1,
    };
    // $FlowIgnore[prop-missing]
    expectations[`${assertion} 2`] = {
      assertion,
      checked: false,
      number: 2,
    };
  });

  results.forEach((result) => {
    const check = expectations[result.name];
    check.checked = result.content === `${check.assertion} ${check.number}`;
  });

  expect(
    Object.keys(expectations)
      .map((key) => expectations[key])
      .filter((expectation) => !expectation.checked).length
  ).toBe(0);
});

test('describe.example', () => {
  const filePath = path.join(snapshotFixturePath, 'describe.example');
  const results = snapshotHelper.getMetadata(filePath);
  const allDescribe = ['describe', 'describe.only', 'describe.skip', 'fdescribe', 'xdescribe'];
  const allAssertion = ['fit', 'it', 'it.only', 'it.skip', 'test', 'test.only', 'test.skip', 'xit', 'xtest'];

  const expectations = Object.create(null);

  allDescribe.forEach((describe) => {
    allAssertion.forEach((assertion) => {
      // $FlowIgnore[prop-missing]
      expectations[`${describe.toUpperCase()} ${assertion} 1`] = {
        assertion,
        checked: false,
        describe,
        number: 1,
      };

      // $FlowIgnore[prop-missing]
      expectations[`${describe.toUpperCase()} ${assertion} 2`] = {
        assertion,
        checked: false,
        describe,
        number: 2,
      };
    });
  });

  results.forEach((result) => {
    const check = expectations[result.name];
    check.checked = result.content === `${check.number} ${check.assertion} ${check.describe}`;
  });
  expect(
    Object.keys(expectations)
      .map((key) => expectations[key])
      .filter((expectation) => !expectation.checked).length
  ).toBe(0);
});

test('nested.example', () => {
  const filePath = path.join(snapshotFixturePath, 'nested.example');
  const results = snapshotHelper.getMetadata(filePath);
  expect(results[0].content).toBe('first nested');
  expect(results[1].content).toBe('second nested');

  expect(results[0].name).toBe('outer describe outer it inner describe inner it 1');
  expect(results[1].name).toBe('outer describe outer it inner describe inner it 2');

  expect(results[0].node.loc.start).toEqual({column: 21, line: 5});
  expect(results[0].node.loc.end).toEqual({column: 36, line: 5});
  expect(results[1].node.loc.start).toEqual({column: 21, line: 6});
  expect(results[1].node.loc.end).toEqual({column: 36, line: 6});
});

describe('when metadata parse error', () => {
  it('getMetadata returns empty array', () => {
    const filePath = path.join(snapshotFixturePath, 'typescript-file');
    const results = snapshotHelper.getMetadata(filePath);
    expect(results).toEqual([]);
  });
  it('support verbose mode for debugging', () => {
    (console: any).warn = jest.fn();
    const filePath = path.join(snapshotFixturePath, 'typescript-file');

    let results = snapshotHelper.getMetadata(filePath);
    expect(results).toEqual([]);
    // eslint-disable-next-line no-console
    expect(console.warn).not.toHaveBeenCalled();

    results = snapshotHelper.getMetadata(filePath, true);
    expect(results).toEqual([]);
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('parse', () => {
  it('can parse and return matched nodes', () => {
    const filePath = path.join(snapshotFixturePath, 'nested.example');
    const snapshotNodes = snapshotHelper.parse(filePath);
    expect(snapshotNodes).toHaveLength(2);
    snapshotNodes.forEach((n) => expect(n.node.name).toEqual('toMatchSnapshot'));
    snapshotNodes.forEach((n) => expect(n.parents).toHaveLength(4));
    expect(snapshotNodes[0].node.loc.start).toEqual({column: 21, line: 5});
    expect(snapshotNodes[0].node.loc.end).toEqual({column: 36, line: 5});
    expect(snapshotNodes[1].node.loc.start).toEqual({column: 21, line: 6});
    expect(snapshotNodes[1].node.loc.end).toEqual({column: 36, line: 6});
  });
  it('can parse inline snapshots', () => {
    const filePath = path.join(snapshotFixturePath, 'inline-and-each.example');

    let snapshot = new Snapshot();
    let snapshotNodes = snapshot.parse(filePath);
    let inlineSnapshotNodes = snapshotNodes.filter((sn) => sn.node.name === 'toMatchInlineSnapshot');
    expect(inlineSnapshotNodes).toHaveLength(0);
    let inlineThrowSnapshotNodes = snapshotNodes.filter((sn) => sn.node.name === 'toThrowErrorMatchingInlineSnapshot');
    expect(inlineThrowSnapshotNodes).toHaveLength(0);

    snapshot = new Snapshot(undefined, ['toMatchInlineSnapshot', 'toThrowErrorMatchingInlineSnapshot']);
    snapshotNodes = snapshot.parse(filePath);
    inlineSnapshotNodes = snapshotNodes.filter((sn) => sn.node.name === 'toMatchInlineSnapshot');
    expect(inlineSnapshotNodes).toHaveLength(4);
    inlineThrowSnapshotNodes = snapshotNodes.filter((sn) => sn.node.name === 'toThrowErrorMatchingInlineSnapshot');
    expect(inlineThrowSnapshotNodes).toHaveLength(1);
  });
});
describe('getSnapshotContent', () => {
  it.each`
    testName                                           | expected
    ${'regular inline test 1'}                         | ${undefined}
    ${'test.each %s 1'}                                | ${undefined}
    ${'test.each a 1'}                                 | ${'a'}
    ${'1 describe with each test.each a 1'}            | ${'1.a'}
    ${'2 describe with each test.each b 1'}            | ${'2.b'}
    ${'tests with each case %d test 1-D array each 1'} | ${undefined}
    ${'tests with each case 3 test 1-D array each 1'}  | ${'3 1-D'}
  `('', async ({testName, expected}) => {
    const filePath = path.join(snapshotFixturePath, 'inline-and-each.example');
    const snapshot = new Snapshot(undefined, ['toMatchInlineSnapshot', 'toThrowErrorMatchingInlineSnapshot']);
    const content = await snapshot.getSnapshotContent(filePath, testName);
    expect(content).toEqual(expected);
  });
  it('can take literal snapshot name', async () => {
    const filePath = path.join(snapshotFixturePath, 'inline-and-each.example');
    const snapshot = new Snapshot(undefined, ['toMatchInlineSnapshot', 'toThrowErrorMatchingInlineSnapshot']);
    const content = await snapshot.getSnapshotContent(filePath, `literal test 2`);
    expect(content).toEqual('literal test 2 content');
  });
  it('can take regex', async () => {
    const filePath = path.join(snapshotFixturePath, 'inline-and-each.example');
    const snapshot = new Snapshot(undefined, ['toMatchInlineSnapshot', 'toThrowErrorMatchingInlineSnapshot']);
    const content = await snapshot.getSnapshotContent(filePath, /literal test/);
    expect(content).toEqual({
      'literal test 1': 'literal test 1 content',
      'literal test 2': 'literal test 2 content',
    });
  });
  it('if nothing matched, returns null', async () => {
    const filePath = path.join(snapshotFixturePath, 'inline-and-each.example');
    const snapshot = new Snapshot(undefined, ['toMatchInlineSnapshot', 'toThrowErrorMatchingInlineSnapshot']);
    const content = await snapshot.getSnapshotContent(filePath, /not existing test/);
    expect(content).toEqual(null);
  });
});
