/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ChildProcess } from 'child_process';
import EventEmitter from 'events';
import type { Options, SpawnOptions } from './types';
import ProjectWorkspace from './project_workspace';
import { createProcess } from './Process';

// This class represents the the configuration of Jest's process
// the interface below can be used to show what we use, as currently the whole
// settings object will be in memory.

// For now, this is all we care about inside the config

type Glob = string;

type ProjectConfiguration = {
  testRegex: string | Array<string>,
  testMatch: Array<Glob>,
};

type JestSettings = {
  jestVersionMajor: number,
  configs: ProjectConfiguration[],
};

function parseSettings(text: string, debug: Boolean = false): JestSettings {
  _jsonPattern = new RegExp(/^[\s]*\{/gm);
  let settings = null;

  try {
    settings = JSON.parse(text);
  } catch (err) {
    // skip the non-json content, if any
    const idx = text.search(_jsonPattern);
    if (idx > 0) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.log(`skip config output noise: ${text.substring(0, idx)}`);
      }
      return parseSettings(text.substring(idx));
    }
    // eslint-disable-next-line no-console
    console.warn(`failed to parse config: \n${text}\nerror: ${err}`);
    throw err;
  }

  const jestVersionMajor = parseInt(settings.version.split('.').shift(), 10);
  if (debug) {
    // eslint-disable-next-line no-console
    console.log(`found config jestVersionMajor=${jestVersionMajor}`);
  }

  return {
    jestVersionMajor,
    configs: Array.isArray(settings.configs) ? settings.configs : [settings.config],
  };
}

export function getSettings(workspace: ProjectWorkspace, options?: Options): Promise<JestSettings> {
  return new Promise((resolve, reject) => {
    const _createProcess = (options && options.createProcess) || createProcess;
    const spawnOptions = {
      shell: options && options.shell,
    };
    const getConfigProcess = _createProcess(workspace, ['--showConfig'], spawnOptions);

    const configString = '';
    getConfigProcess.stdout.on('data', (data: Buffer) => {
      configString += data.toString();
    });

    const rejected = false;
    getConfigProcess.stderr.on('data', (data: Buffer) => {
      rejected = true;
      reject(data.toString());
    });

    getConfigProcess.on('close', () => {
      if (!rejected) {
        try {
          resolve(parseSettings(configString, workspace.debug));
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}
