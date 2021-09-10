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

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
// eslint-disable-next-line import/prefer-default-export
export const createProcess = (workspace: ProjectWorkspace, args: Array<string>): ChildProcess => {
  const runtimeExecutable = [workspace.jestCommandLine, ...args];

  // If a path to configuration file was defined, push it to runtimeArgs
  if (workspace.pathToConfig) {
    runtimeExecutable.push('--config');
    runtimeExecutable.push(workspace.pathToConfig);
  }

  const env = {...process.env, ...(workspace.nodeEnv ?? {})};

  const spawnOptions = {
    cwd: workspace.rootPath,
    env,
    shell: typeof workspace.shell === 'string' && workspace.shell ? workspace.shell : true,
    // for non-windows: run in detached mode so the process will be the group leader and any subsequent process spawned
    // within can be later killed as a group to prevent orphan processes.
    // see https://nodejs.org/api/child_process.html#child_process_options_detached
    detached: process.platform !== 'win32',
  };

  if (workspace.debug) {
    // eslint-disable-next-line no-console
    console.log(`spawning process with command=${runtimeExecutable.join(' ')}`, 'options:', spawnOptions);
  }

  return spawn(runtimeExecutable.join(' '), [], spawnOptions);
};
