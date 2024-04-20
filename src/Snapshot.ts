/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import traverse, {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import type {SnapshotResolver} from 'jest-snapshot';
import {buildSnapshotResolver, utils} from 'jest-snapshot';
import type {Config} from '@jest/types';

import {getASTfor} from './parsers/babel_parser';
import type {JESParserOptions} from './parsers';
import {shallowAttr} from './parsers/helper';
import {SnapshotData} from 'jest-snapshot/build/types';

type ParserFunc = typeof getASTfor;

export type SnapshotNode = t.Identifier;
export interface SnapshotBlock {
  node: SnapshotNode;
  parents: t.Node[];
}

export interface SnapshotMetadata {
  exists: boolean;
  name: string;
  node: SnapshotNode;
  content?: string;
}

const describeVariants: Record<string, boolean> = {
  describe: true,
  fdescribe: true,
  xdescribe: true,
};

const base: Record<string, boolean> = {
  describe: true,
  it: true,
  test: true,
};

const decorators: Record<string, boolean> = {
  only: true,
  skip: true,
};

const validParents: Record<string, boolean> = {
  ...base,
  ...describeVariants,
  fit: true,
  xit: true,
  xtest: true,
};

const isValidMemberExpression = (node: t.Node): boolean =>
  t.isMemberExpression(node) &&
  t.isIdentifier(node.object) &&
  base[node.object.name] &&
  t.isIdentifier(node.property) &&
  decorators[node.property.name];

const isDescribe = (node: t.Node): boolean =>
  (t.isIdentifier(node) && describeVariants[node.name]) || (t.isMemberExpression(node) && isDescribe(node.object));

const isValidParent = (parent: t.Node): parent is t.CallExpression =>
  t.isCallExpression(parent) &&
  ((t.isIdentifier(parent.callee) && validParents[parent.callee.name]) || isValidMemberExpression(parent.callee));

const getArrayOfParents = (path: NodePath<t.Identifier>): t.Node[] => {
  const result: t.Node[] = [];
  let parent: NodePath<t.Node> | null = path.parentPath; // Update the type of 'parent' to allow for null values
  while (parent) {
    result.unshift(parent.node);
    parent = parent.parentPath;
  }
  return result;
};

const buildName: (parents: t.Node[], position: number) => string = (parents, position) => {
  const fullName = parents
    .map((parent) => {
      // Ensure parent is a CallExpression and it has at least one argument
      if (t.isCallExpression(parent) && parent.arguments.length > 0) {
        return shallowAttr(parent.arguments[0], 'value');
      }
      console.warn(`Unexpected Snapshot parent type: ${JSON.stringify(parent)}`);
      return ''; // Return an empty string for non-matching cases
    })
    .join(' '); // Join all the strings with spaces

  return utils.testNameToKey(fullName, position);
};

export interface SnapshotParserOptions {
  verbose?: boolean;
  parserOptions?: JESParserOptions;
}
export default class Snapshot {
  _parser: ParserFunc;

  _matchers: string[];

  _projectConfig?: Config.ProjectConfig;

  snapshotResolver?: SnapshotResolver;

  _resolverPromise: Promise<SnapshotResolver>;

  constructor(parser?: ParserFunc, customMatchers?: string[], projectConfig?: Config.ProjectConfig) {
    this._parser = parser || getASTfor;
    this._matchers = ['toMatchSnapshot', 'toThrowErrorMatchingSnapshot'].concat(customMatchers || []);
    this._projectConfig = projectConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._resolverPromise = buildSnapshotResolver(this._projectConfig || ({} as any), () => Promise.resolve()).then(
      (resolver) => {
        this.snapshotResolver = resolver;
        return resolver;
      }
    );
  }

  parse(filePath: string, options?: SnapshotParserOptions): SnapshotBlock[] {
    let fileNode;
    try {
      fileNode = this._parser(filePath, undefined, options?.parserOptions);
    } catch (error) {
      if (options?.verbose) {
        // eslint-disable-next-line no-console
        console.warn(error);
      }
      return [];
    }

    const found: SnapshotBlock[] = [];

    traverse(fileNode, {
      enter: (path) => {
        if (path.isIdentifier() && this._matchers.indexOf(path.node.name) >= 0) {
          found.push({
            node: path.node,
            parents: getArrayOfParents(path),
          });
        }
      },
    });

    return found.map((f) => ({
      node: f.node,
      parents: f.parents.filter(isValidParent),
    }));
  }

  async _getSnapshotResolver(): Promise<SnapshotResolver> {
    if (!this.snapshotResolver) {
      this.snapshotResolver = await this._resolverPromise;
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
  async getSnapshotContent(filePath: string, name: string | RegExp): Promise<string | SnapshotData | null> {
    const snapshotResolver = await this._getSnapshotResolver();

    const snapshotPath = snapshotResolver.resolveSnapshotPath(filePath);
    const snapshots = utils.getSnapshotData(snapshotPath, 'none').data;
    if (typeof name === 'string') {
      return snapshots[name];
    }
    const regex = name;
    const data: SnapshotData = {};
    Object.entries(snapshots).forEach(([key, value]) => {
      if (regex.test(key)) {
        data[key] = value;
      }
    });
    return Object.entries(data).length > 0 ? data : null;
  }

  async getMetadataAsync(filePath: string, options?: SnapshotParserOptions): Promise<SnapshotMetadata[]> {
    await this._getSnapshotResolver();
    return this.getMetadata(filePath, options);
  }

  getMetadata(filePath: string, options?: SnapshotParserOptions): SnapshotMetadata[] {
    if (!this.snapshotResolver) {
      throw new Error('snapshotResolver is not ready yet, consider migrating to "getMetadataAsync" instead');
    }
    const snapshotPath = this.snapshotResolver.resolveSnapshotPath(filePath);
    const snapshotBlocks = this.parse(filePath, options);
    const snapshots = utils.getSnapshotData(snapshotPath, 'none').data;

    let lastParent: t.Node | null = null;
    let count = 1;

    return snapshotBlocks.map((snapshotBlock) => {
      const {parents} = snapshotBlock;
      const innerAssertion = parents[parents.length - 1];

      if (lastParent !== innerAssertion) {
        lastParent = innerAssertion;
        count = 1;
      }

      const result: SnapshotMetadata = {
        content: undefined,
        exists: false,
        name: '',
        node: snapshotBlock.node,
      };

      if (!innerAssertion || (t.isCallExpression(innerAssertion) && isDescribe(innerAssertion.callee))) {
        return result;
      }

      result.name = buildName(parents, count);
      count += 1;

      if (snapshots[result.name]) {
        result.exists = true;
        result.content = snapshots[result.name];
      }
      return result;
    });
  }
}
