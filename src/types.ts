/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ChildProcess} from 'child_process';
import type ProjectWorkspace from './project_workspace';

export interface CodeLocation {
  column: number;
  line: number;
}

export type RunArgs = {
  args: string[];
  replace?: boolean; // default is false
  skipConversion?: boolean; // if true, args will not go through any conversion, such as dashed arg conversion.
};

export type Options = {
  createProcess?: (workspace: ProjectWorkspace, args: string[]) => ChildProcess;
  noColor?: boolean;
  testNamePattern?: string;
  testFileNamePattern?: string;
  reporters?: string[];

  /** either to append or replace the Runner process arguments */
  args?: RunArgs;
};

export type JestTotalResultsMeta = {
  noTestsFound: boolean;
};

export enum MessageTypes {
  noTests = 1,
  testResults = 3,
  unknown = 0,
  watchUsage = 2,
}

export type MessageType = number;
