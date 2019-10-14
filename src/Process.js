/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {ChildProcess, spawn} from 'child_process';
import ProjectWorkspace from './project_workspace';
import type {SpawnOptions} from './types';

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
// eslint-disable-next-line import/prefer-default-export
export const createProcess = (
  workspace: ProjectWorkspace,
  args: Array<string>,
  options?: SpawnOptions = {}
): ChildProcess => {
  // A command could look like `npm run test`, which we cannot use as a command
  // as they can only be the first command, so take out the command, and add
  // any other bits into the args
  const runtimeExecutable = workspace.pathToJest;

  // "[^"\\]*                 Matches a quote followed by zero or more
  //                          characters that are not quotes or backslashes
  // (?:\\[\S\s][^"\\]*)*"    Matches a backslash followed by any character,
  //                          followed by zero or more characters that are not
  //                          quotes or backslashes ('[\S\s]' is used instead of
  //                          '.' so that newlines are also matched). This
  //                          ensures that escaped quotes are handled correctly
  // (?:\\\s(?!\s+)|\S)       Matches a backslash followed by a single
  //                          whitespace character, or a non-whitespace
  //                          character
  const parameters = runtimeExecutable.match(
    /(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|(?:\\\s(?!\s)|\S))+/g
  ) || [''];
  const command = parameters[0];
  const initialArgs = parameters.slice(1);
  const runtimeArgs = [].concat(initialArgs, args);

  // If a path to configuration file was defined, push it to runtimeArgs
  if (workspace.pathToConfig) {
    runtimeArgs.push('--config');
    runtimeArgs.push(workspace.pathToConfig);
  }

  // To use our own commands in create-react, we need to tell the command that
  // we're in a CI environment, or it will always append --watch
  const {env} = process;
  env.CI = 'true';

  const spawnOptions = {
    cwd: workspace.rootPath,
    env,
    shell: options.shell,
  };

  if (workspace.debug) {
    // eslint-disable-next-line no-console
    console.log(`spawning process with command=${command}, args=${runtimeArgs.toString()}`);
  }

  return spawn(command, runtimeArgs, spawnOptions);
};
