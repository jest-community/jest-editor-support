/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Options} from './types';
import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

type Glob = string;

// This class represents the configuration of Jest's process.
// The interface below can be used to show what we use, as currently the whole
// settings object will be in memory.
// As soon as the code will be converted to TypeScript, this will be removed
// in favor of `@jest/types`, which exports the full config interface.

type ProjectConfiguration = {
  testRegex: string | string[];
  testMatch: Glob[];
};

type JestSettings = {
  jestVersionMajor: number;
  configs: ProjectConfiguration[];
};

function parseSettings(text: string, debug = false): JestSettings {
  const jsonPattern = new RegExp(/^[\s]*\{/gm);
  let settings = null;

  try {
    settings = JSON.parse(text);
  } catch (err) {
    // skip the non-json content, if any
    const idx = text.search(jsonPattern);
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

export default function getSettings(workspace: ProjectWorkspace, options?: Options): Promise<JestSettings> {
  return new Promise((resolve, reject) => {
    const _createProcess = (options && options.createProcess) || createProcess;
    const getConfigProcess = _createProcess(workspace, ['--showConfig']);

    let configString = '';
    getConfigProcess.stdout.on('data', (data: Buffer) => {
      configString += data.toString();
    });

    let rejected = false;
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
