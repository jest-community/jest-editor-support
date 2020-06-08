/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import traverse from '@babel/traverse';
import {buildSnapshotResolver, utils} from 'jest-snapshot';
import {Config} from '@jest/types';

import {getASTfor} from './parsers/babel_parser';

type Node = any;

type SnapshotMetadata = {
  exists: boolean;
  name: string;
  node: Node;
  content?: string;
};

const describeVariants = Object.assign(Object.create(null), {
  describe: true,
  fdescribe: true,
  xdescribe: true,
});
const base = Object.assign(Object.create(null), {
  describe: true,
  it: true,
  test: true,
});
const decorators = Object.assign(Object.create(null), {
  only: true,
  skip: true,
});

const validParents = Object.assign(
  Object.create(null),
  base,
  describeVariants,
  Object.assign(Object.create(null), {
    fit: true,
    xit: true,
    xtest: true,
  })
);

const isValidMemberExpression = node =>
  node.object && base[node.object.name] && node.property && decorators[node.property.name];

const isDescribe = node =>
  describeVariants[node.name] || (isValidMemberExpression(node) && node.object.name === 'describe');

const isValidParent = parent =>
  parent.callee && (validParents[parent.callee.name] || isValidMemberExpression(parent.callee));

const getArrayOfParents = path => {
  const result = [];
  let parent = path.parentPath;
  while (parent) {
    result.unshift(parent.node);
    parent = parent.parentPath;
  }
  return result;
};

const buildName: (snapshotNode: Node, parents: Node[], position: number) => string = (
  snapshotNode,
  parents,
  position
) => {
  const fullName = parents.map(parent => parent.arguments[0].value).join(' ');

  return utils.testNameToKey(fullName, position);
};

export default class Snapshot {
  _parser: Function;

  _matchers: string[];

  _projectConfig?: Config.ProjectConfig;

  constructor(parser: any, customMatchers?: string[], projectConfig?: Config.ProjectConfig) {
    this._parser = parser || getASTfor;
    this._matchers = ['toMatchSnapshot', 'toThrowErrorMatchingSnapshot'].concat(customMatchers || []);
    this._projectConfig = projectConfig;
  }

  getMetadata(filePath: string, verbose = false): SnapshotMetadata[] {
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
    const state = {
      found: [],
    };
    const Visitors = {
      Identifier(path, _state, matchers) {
        if (matchers.indexOf(path.node.name) >= 0) {
          _state.found.push({
            node: path.node,
            parents: getArrayOfParents(path),
          });
        }
      },
    };

    traverse(fileNode, {
      enter: path => {
        const visitor = Visitors[path.node.type];
        if (visitor != null) {
          visitor(path, state, this._matchers);
        }
      },
    });

    // NOTE if no projectConfig is given the default resolver will be used
    const snapshotResolver = buildSnapshotResolver(this._projectConfig || ({} as Config.ProjectConfig));
    const snapshotPath = snapshotResolver.resolveSnapshotPath(filePath);
    const snapshots = utils.getSnapshotData(snapshotPath, 'none').data;
    let lastParent = null;
    let count = 1;

    return state.found.map(snapshotNode => {
      const parents = snapshotNode.parents.filter(isValidParent);
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
