/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import EventEmitter from 'events';
import ProjectWorkspace from '../project_workspace';
import { getSettings } from '../Settings';

function prepareProcess() {
  const mockProcess = new EventEmitter();
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  return {
    mockProcess,
    createProcess: jest.fn(() => mockProcess),
  };
}

describe('getSettings', () => {
  it('[jest 20] reads and parses the config', async () => {
    expect.assertions(2);
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest', 'test', 1000);
    const config = {
      cacheDirectory: '/tmp/jest',
      name: '[md5 hash]',
    };
    const json = {
      config,
      version: '19.0.0',
    };

    const { mockProcess, createProcess } = prepareProcess();
    const buffer = Buffer.from(JSON.stringify(json));
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });

    mockProcess.stdout.emit('data', buffer);
    mockProcess.emit('close');

    const settings = await settingsPromise;
    expect(settings.jestVersionMajor).toBe(19);
    expect(settings.configs).toEqual([config]);
  });

  it('[jest 21] reads and parses the config', async () => {
    expect.assertions(2);
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest', 'test', 1000);
    const configs = [
      {
        cacheDirectory: '/tmp/jest',
        name: '[md5 hash]',
      },
    ];
    const json = {
      configs,
      version: '21.0.0',
    };

    const { mockProcess, createProcess } = prepareProcess();
    const buffer = Buffer.from(JSON.stringify(json));
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });

    mockProcess.stdout.emit('data', buffer);
    mockProcess.emit('close');

    const settings = await settingsPromise;
    expect(settings.jestVersionMajor).toBe(21);
    expect(settings.configs).toEqual(configs);
  });

  it('rejects the promise even if no data is sent', async () => {
    expect.assertions(1);
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest', 'test', 1000);

    const { mockProcess, createProcess } = prepareProcess();
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });

    mockProcess.emit('close');

    try {
      await settingsPromise;
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('passes command, args, and options to createProcess', () => {
    const localJestMajorVersion = 1000;
    const pathToConfig = 'test';
    const pathToJest = 'path_to_jest';
    const rootPath = 'root_path';
    const workspace = new ProjectWorkspace(rootPath, pathToJest, pathToConfig, localJestMajorVersion);

    const { createProcess } = prepareProcess();
    const settingsPromise = getSettings(workspace, {
      createProcess,
      shell: true,
    });

    expect(createProcess).toBeCalledWith(
      {
        localJestMajorVersion,
        pathToConfig,
        pathToJest,
        rootPath,
      },
      ['--showConfig'],
      {
        shell: true,
      }
    );
  });

  describe('parse config', () => {
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest', 'test', 1000);
    const createProcess = jest.fn();

    const json = `{ 
      "version": "23.2.0",
      "configs": [{
        "testRegex": "some-regex"
      }]
    }`;
    const run_test = async (text: string, expected_version: number = 23, expected_regex: string = 'some-regex'): void => {
      expect.assertions(2);
      const { mockProcess, createProcess } = prepareProcess();
      const buffer = Buffer.from(text);
      const settingsPromise = getSettings(workspace, {
        createProcess,
      });
      mockProcess.stdout.emit('data', buffer);
      mockProcess.emit('close');
      
      const settings = await settingsPromise;
      expect(settings.jestVersionMajor).toBe(expected_version);
      expect(settings.configs[0].testRegex).toBe(expected_regex);
    };

    it('can parse correct config', () => {
      run_test(json);
    });

    it('can parse config even with noise', () => {
      const with_noise = `
      > something
      > more noise
      ${json}
      `;
      run_test(with_noise);
    });
  });
});
