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

export type Location = {
  column: number,
  line: number,
};

export type Options = {
  createProcess?: (workspace: ProjectWorkspace, args: Array<string>) => ChildProcess,
  noColor?: boolean,
  testNamePattern?: string,
  testFileNamePattern?: string,
};

/**
 *  Did the thing pass, fail or was it not run?
 */
export type TestReconciliationState =
  | 'Unknown' // The file has not changed, so the watcher didn't hit it
  | 'KnownFail' // Definitely failed
  | 'KnownSuccess' // Definitely passed
  | 'KnownSkip'; // Definitely skipped

/**
 * The Jest Extension's version of a status for
 * individual assertion fails
 *
 */
export type TestAssertionStatus = {
  title: string,
  status: TestReconciliationState,
  message: string,
  shortMessage: ?string,
  terseMessage: ?string,
  location: ?Location,
  line: ?number,
};

/**
 * The Jest Extension's version of a status for
 * whether the file passed or not
 *
 */
export type TestFileAssertionStatus = {
  file: string,
  message: string,
  status: TestReconciliationState,
  assertions: TestAssertionStatus[] | null,
};

export type JestTotalResultsMeta = {
  noTestsFound: boolean,
};

// eslint-disable-next-line import/prefer-default-export
export const messageTypes = {
  noTests: 1,
  testResults: 3,
  unknown: 0,
  watchUsage: 2,
};

export type MessageType = number;
