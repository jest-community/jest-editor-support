/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ChildProcess, spawn} from 'child_process';
import ProjectWorkspace, {LoginShell} from './project_workspace';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
const isLoginShell = (arg: any): arg is LoginShell => arg && typeof arg.path === 'string' && Array.isArray(arg.args);

/**
 * Spawns and returns a Jest process with specific args
 *
 * @param {string[]} args
 * @returns {ChildProcess}
 */
// eslint-disable-next-line import/prefer-default-export
export const createProcess = (workspace: ProjectWorkspace, args: string[]): ChildProcess => {
  const runtimeExecutable = [workspace.jestCommandLine, ...args];

  // If a path to configuration file was defined, push it to runtimeArgs
  if (workspace.pathToConfig) {
    runtimeExecutable.push('--config');
    runtimeExecutable.push(workspace.pathToConfig);
  }

  const env = {...process.env, ...(workspace.nodeEnv ?? {})};
  const cmd = runtimeExecutable.join(' ');

  const spawnShell = () => {
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
      console.log(`spawning process with command=${cmd}`, 'options:', spawnOptions);
    }

    return spawn(cmd, [], spawnOptions);
  };

  const spawnLoginShell = (tShell: LoginShell) => {
    const spawnOptions = {
      cwd: workspace.rootPath,
      env,
      detached: process.platform !== 'win32',
    };

    if (workspace.debug) {
      // eslint-disable-next-line no-console
      console.log(
        `spawning login-shell "${tShell.path} ${tShell.args.join(' ')}" for command=${cmd}`,
        'options:',
        spawnOptions
      );
    }

    const child = spawn(tShell.path, tShell.args, spawnOptions);
    child.stdin.write(`${cmd} \n exit\n`);
    return child;
  };

  if (isLoginShell(workspace.shell)) {
    if (process.platform === 'win32') {
      console.error('currently login-shell is only supported for non-windown platforms');
    } else {
      return spawnLoginShell(workspace.shell);
    }
  }
  return spawnShell();
};
