/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Options} from './types';
import type ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';
import type {Config} from '@jest/types';

type JestSettings = {
  jestVersionMajor: number;
  configs: Config.ProjectConfig[];
};

interface JestConfigOutput {
  globalConfig: Config.GlobalConfig;
  configs: Config.ProjectConfig[] | Config.ProjectConfig;
  version: string;
}

function parseSettings(text: string, debug = false): JestSettings {
  const jsonPattern = /^[\s]*\{/gm;
  let jestConfig: JestConfigOutput;

  try {
    jestConfig = JSON.parse(text) as JestConfigOutput;
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
    console.warn(`failed to parse config: \n${text}\nerror:`, err);
    throw err;
  }

  const parts = jestConfig.version?.split('.');
  if(!parts || parts.length === 0) {
    throw new Error(`Jest version is not a valid semver version: ${jestConfig.version}`);
  }

  const jestVersionMajor = parseInt(parts[0], 10);
  if (debug) {
    // eslint-disable-next-line no-console
    console.log(`found config jestVersionMajor=${jestVersionMajor}`);
  }

  // prior to 21.0.0, jest only supported a single config
  return {
    jestVersionMajor,
    configs: Array.isArray(jestConfig.configs) ? jestConfig.configs : [(jestConfig as any).config],
  };
}

export default function getSettings(workspace: ProjectWorkspace, options?: Options): Promise<JestSettings> {
  return new Promise((resolve, reject) => {
    const cp = (options && options.createProcess) || createProcess;
    const childProcess = cp(workspace, ['--showConfig']);

    let configString = '';
    childProcess.stdout?.on('data', (data: Buffer) => {
      configString += data.toString();
    });

    let rejected = false;
    childProcess.stderr?.on('data', (data: Buffer) => {
      rejected = true;
      reject(data.toString());
    });

    childProcess.on('close', () => {
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
