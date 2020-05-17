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
import getSettings from '../Settings';

function prepareProcess() {
  const mockProcess: any = new EventEmitter();
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();

  return {
    createProcess: jest.fn(() => mockProcess),
    mockProcessResult: (stdout: ?string, stderr: ?string) => {
      if (stdout) {
        mockProcess.stdout.emit('data', Buffer.from(stdout));
      }
      if (stderr) {
        mockProcess.stderr.emit('data', Buffer.from(stderr));
      }
      mockProcess.emit('close');
    },
  };
}

describe('getSettings', () => {
  it('[jest 19] reads and parses the config', async () => {
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

    const {createProcess, mockProcessResult} = prepareProcess();
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });
    mockProcessResult(JSON.stringify(json));
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

    const {createProcess, mockProcessResult} = prepareProcess();
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });
    mockProcessResult(JSON.stringify(json));
    const settings = await settingsPromise;

    expect(settings.jestVersionMajor).toBe(21);
    expect(settings.configs).toEqual(configs);
  });

  it('rejects the promise even if no data is sent', async () => {
    expect.assertions(1);
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest', 'test', 1000);

    const {createProcess, mockProcessResult} = prepareProcess();
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });
    mockProcessResult();

    try {
      await settingsPromise;
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('rejects the promise if an error is logged', async () => {
    expect.assertions(1);
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

    const {createProcess, mockProcessResult} = prepareProcess();
    const settingsPromise = getSettings(workspace, {
      createProcess,
    });
    mockProcessResult(JSON.stringify(json), 'The expected error occured.');

    try {
      await settingsPromise;
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('passes command and args to createProcess', () => {
    const localJestMajorVersion = 1000;
    const pathToConfig = 'test';
    const jestCommandLine = 'path_to_jest';
    const rootPath = 'root_path';
    const workspace = new ProjectWorkspace(rootPath, jestCommandLine, pathToConfig, localJestMajorVersion);

    const {createProcess} = prepareProcess();
    getSettings(workspace, {
      createProcess,
    });

    expect(createProcess).toBeCalledWith(
      {
        localJestMajorVersion,
        pathToConfig,
        jestCommandLine,
        rootPath,
      },
      ['--showConfig']
    );
  });

  it('setting pathToJest updates jestCommandLine', () => {
    const localJestMajorVersion = 1000;
    const pathToConfig = 'test';
    const jestCommandLine = 'path_to_jest';
    const rootPath = 'root_path';
    const workspace = new ProjectWorkspace(rootPath, jestCommandLine, pathToConfig, localJestMajorVersion);

    // first check that both pathToConfig and jestCommandLine are the same value.
    expect(workspace.jestCommandLine).toBe(jestCommandLine);
    expect(workspace.pathToJest).toBe(jestCommandLine);

    // then update the pathToJest property.
    const updatedPathToJest = 'updated pathToJest';
    workspace.pathToJest = updatedPathToJest;

    // check that both pathToConfig and jestCommandLine yield the same value.
    expect(workspace.jestCommandLine).toBe(updatedPathToJest);
    expect(workspace.pathToJest).toBe(updatedPathToJest);
  });

  describe('parse config', () => {
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest', 'test', 1000);

    const json = `{ 
      "version": "23.2.0",
      "configs": [{
        "testRegex": "some-regex"
      }]
    }`;
    const run_test = async (
      text: string,
      expected_version: number = 23,
      expected_regex: string = 'some-regex'
    ): Promise<void> => {
      expect.assertions(2);
      const {createProcess, mockProcessResult} = prepareProcess();
      const settingsPromise = getSettings(workspace, {
        createProcess,
      });
      mockProcessResult(text);
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
