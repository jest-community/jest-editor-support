/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Config as JestConfig} from '@jest/types';
import {Options} from './types';
import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

type JestSettings = {
  configs: JestConfig.ProjectConfig[];
  globalConfig: JestConfig.GlobalConfig;
  version: string;
};

type Settings = {
  jestVersionMajor: number;
  configs: JestConfig.ProjectConfig[];
};

function parseSettings(text: string, debug = false): Settings {
  const jsonPattern = new RegExp(/^[\s]*\{/gm);
  let settings: JestSettings | null = null;

  try {
    settings = JSON.parse(text) as JestSettings;

    const jestVersionMajor = parseInt(settings.version.split('.').shift() || '', 10);
    if (debug) {
      // eslint-disable-next-line no-console
      console.log(`found config jestVersionMajor=${jestVersionMajor}`);
    }

    return {
      jestVersionMajor,
      configs: Array.isArray(settings.configs) ? settings.configs : [(settings as any).config],
    };
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
}

export default function getSettings(workspace: ProjectWorkspace, options?: Options): Promise<Settings> {
  return new Promise((resolve, reject) => {
    const _createProcess = (options && options.createProcess) || createProcess;
    const getConfigProcess = _createProcess(workspace, ['--showConfig']);

    if (!(getConfigProcess.stdout && getConfigProcess.stderr)) {
      throw Error('stdout or stderr not available.');
    }

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
