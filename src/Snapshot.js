/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import traverse from '@babel/traverse';
import {buildSnapshotResolver, type SnapshotResolver, type SnapshotData, utils} from 'jest-snapshot';
import type {ProjectConfig} from '../types/Config';

import {getASTfor} from './parsers/babel_parser';

type Node = any;

type SnapshotMetadata = {
  exists: true | false,
  name: string,
  node: Node,
  content?: string,
};

const describeVariants = Object.assign((Object.create(null): {[string]: boolean, __proto__: null}), {
  describe: true,
  fdescribe: true,
  xdescribe: true,
});
const base = Object.assign((Object.create(null): {[string]: boolean, __proto__: null}), {
  describe: true,
  it: true,
  test: true,
});
const decorators = Object.assign((Object.create(null): {[string]: boolean, __proto__: null}), {
  only: true,
  skip: true,
});

const validParents = Object.assign(
  (Object.create(null): any),
  base,
  describeVariants,
  Object.assign((Object.create(null): {[string]: boolean, __proto__: null}), {
    fit: true,
    xit: true,
    xtest: true,
  })
);

const isValidMemberExpression = (node: any) =>
  node.object && base[node.object.name] && node.property && decorators[node.property.name];

const isDescribe = (node: any) =>
  describeVariants[node.name] || (isValidMemberExpression(node) && node.object.name === 'describe');

const isValidParent = (parent: any) =>
  parent.callee && (validParents[parent.callee.name] || isValidMemberExpression(parent.callee));

const getArrayOfParents = (path: any) => {
  const result = [];
  let parent = path.parentPath;
  while (parent) {
    result.unshift(parent.node);
    parent = parent.parentPath;
  }
  return result;
};

const buildName: (snapshotNode: Node, parents: Array<Node>, position: number) => string = (
  snapshotNode,
  parents,
  position
) => {
  const fullName = parents.map((parent) => parent.arguments[0].value).join(' ');

  return utils.testNameToKey(fullName, position);
};

export interface SnapshotNode {
  node: Node;
  parents: Node[];
}

export default class Snapshot {
  _parser: Function;

  _matchers: Array<string>;

  _projectConfig: ?ProjectConfig;

  // $FlowIgnore[value-as-type]
  snapshotResolver: ?SnapshotResolver;

  // $FlowIgnore[value-as-type]
  _resolverPromise: Promise<SnapshotResolver>;

  constructor(parser: any, customMatchers?: Array<string>, projectConfig?: ProjectConfig) {
    this._parser = parser || getASTfor;
    this._matchers = ['toMatchSnapshot', 'toThrowErrorMatchingSnapshot'].concat(customMatchers || []);
    this._projectConfig = projectConfig;
    this._resolverPromise = buildSnapshotResolver(this._projectConfig || {}, () => Promise.resolve()).then(
      (resolver) => {
        this.snapshotResolver = resolver;
      }
    );
  }

  parse(filePath: string, verbose: boolean = false): SnapshotNode[] {
    let fileNode;
    try {
      fileNode = this._parser(filePath);
    } catch (error) {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.warn(error);
      }
      return [];
    }

    const Visitors = {
      Identifier(path: any, found: any, matchers: any) {
        if (matchers.indexOf(path.node.name) >= 0) {
          found.push({
            node: path.node,
            parents: getArrayOfParents(path),
          });
        }
      },
    };

    const found = [];

    traverse(fileNode, {
      enter: (path) => {
        const visitor = Visitors[path.node.type];
        if (visitor != null) {
          visitor(path, found, this._matchers);
        }
      },
    });

    return found.map((f) => ({
      node: f.node,
      parents: f.parents.filter(isValidParent),
    }));
  }

  // $FlowIgnore[value-as-type]
  async _getSnapshotResolver(): Promise<SnapshotResolver> {
    if (!this.snapshotResolver) {
      await this._resolverPromise;
    }
    return this.snapshotResolver;
  }

  /**
   * look for snapshot content for the given test.
   * @param {*} filePath
   * @param {*} name can be a literal string or a regex pattern.
   * @returns the content of the snapshot, if exist. If name is a string, a string will be returned. If name is a RegExp,
   * a SnapshotData object will be returned with all matched snapshots. If nothing matched, null will be returned.
   * @throws throws exception if the snapshot version mismatched or any other unexpected error.
   */
  // $FlowIgnore[value-as-type]
  async getSnapshotContent(filePath: string, name: string | RegExp): Promise<string | SnapshotData | null> {
    const snapshotResolver = await this._getSnapshotResolver();

    const snapshotPath = snapshotResolver.resolveSnapshotPath(filePath);
    const snapshots = utils.getSnapshotData(snapshotPath, 'none').data;
    if (typeof name === 'string') {
      return snapshots[name];
    }
    const regex = name;
    // $FlowIgnore[value-as-type]
    const data: SnapshotData = {};
    Object.entries(snapshots).forEach(([key, value]) => {
      if (regex.test(key)) {
        data[key] = value;
      }
    });
    return Object.entries(data).length > 0 ? data : null;
  }

  async getMetadataAsync(filePath: string, verbose: boolean = false): Promise<Array<SnapshotMetadata>> {
    await this._getSnapshotResolver();
    return this.getMetadata(filePath, verbose);
  }

  getMetadata(filePath: string, verbose: boolean = false): Array<SnapshotMetadata> {
    if (!this.snapshotResolver) {
      throw new Error('snapshotResolver is not ready yet, consider migrating to "getMetadataAsync" instead');
    }
    const snapshotPath = this.snapshotResolver.resolveSnapshotPath(filePath);
    const snapshotNodes = this.parse(filePath, verbose);
    const snapshots = utils.getSnapshotData(snapshotPath, 'none').data;

    let lastParent = null;
    let count = 1;

    return snapshotNodes.map((snapshotNode) => {
      const {parents} = snapshotNode;
      const innerAssertion = parents[parents.length - 1];

      if (lastParent !== innerAssertion) {
        lastParent = innerAssertion;
        count = 1;
      }

      const result = {
        content: undefined,
        count,
        exists: false,
        name: '',
        node: snapshotNode.node,
      };
      count += 1;

      if (!innerAssertion || isDescribe(innerAssertion.callee)) {
        // An expectation inside describe never gets executed.
        return result;
      }

      result.name = buildName(snapshotNode, parents, result.count);

      if (snapshots[result.name]) {
        result.exists = true;
        result.content = snapshots[result.name];
      }
      return result;
    });
  }
}
