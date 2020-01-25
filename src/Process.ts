/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ChildProcess, spawn} from 'child_process';
import ProjectWorkspace from './project_workspace';

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
// eslint-disable-next-line import/prefer-default-export
export const createProcess = (workspace: ProjectWorkspace, args: Array<string>): ChildProcess => {
  const runtimeExecutable = [workspace.pathToJest, ...args];

  // If a path to configuration file was defined, push it to runtimeArgs
  if (workspace.pathToConfig) {
    runtimeExecutable.push('--config');
    runtimeExecutable.push(workspace.pathToConfig);
  }

  // To use our own commands in create-react, we need to tell the command that
  // we're in a CI environment, or it will always append --watch
  const {env} = process;
  env.CI = 'true';

  const spawnOptions = {
    cwd: workspace.rootPath,
    env,
    shell: true,
  };

  if (workspace.debug) {
    // eslint-disable-next-line no-console
    console.log(`spawning process with command=${runtimeExecutable.join(' ')}`);
  }

  return spawn(runtimeExecutable.join(' '), [], spawnOptions);
};
