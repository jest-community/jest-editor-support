/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('child_process', () => ({spawn: jest.fn()}));

import {spawn} from 'child_process';
import {createProcess} from '../Process';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mockSpawn = spawn as jest.Mocked<any>;

describe('createProcess', () => {
  let mockConsoleLog: jest.SpyInstance;
  beforeEach(() => {
    mockSpawn.mockClear();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.resetAllMocks();
    mockConsoleLog.mockRestore();
  });

  it('spawns the process', () => {
    const workspace: any = {jestCommandLine: ''};
    const args: string[] = [];
    createProcess(workspace, args);

    expect(mockSpawn).toBeCalled();
  });

  it('spawns the command from workspace.jestCommandLine', () => {
    const workspace: any = {jestCommandLine: 'jest'};
    const args = [];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][0]).toBe('jest');
    expect(mockSpawn.mock.calls[0][1]).toEqual([]);
  });

  it('spawns a command with spaces from workspace.jestCommandLine', () => {
    const workspace: any = {jestCommandLine: 'npm test --'};
    const args = [];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][0]).toBe('npm test --');
  });

  it('appends args', () => {
    const workspace: any = {jestCommandLine: 'npm test --'};
    const args = ['--option', 'value', '--another'];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][0]).toEqual(['npm', 'test', '--', ...args].join(' '));
  });

  it('sets the --config arg to workspace.pathToConfig', () => {
    const workspace: any = {
      pathToConfig: 'non-standard.jest.js',
      jestCommandLine: 'npm test --',
    };
    const args = ['--option', 'value'];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][0]).toEqual('npm test -- --option value --config non-standard.jest.js');
  });

  it('does not defines the "CI" environment variable', () => {
    const expected = process.env;

    const workspace: any = {jestCommandLine: ''};
    const args = [];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][2].env).toEqual(expected);
  });
  it('allow customize node environment variable', () => {
    const workspace: any = {
      nodeEnv: {NODE_ENV: 'test'},
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expected = Object.assign({}, process.env, workspace.nodeEnv);
    createProcess(workspace, []);

    expect(mockSpawn.mock.calls[0][2].env).toEqual(expected);
  });
  it.each`
    shell               | expected
    ${undefined}        | ${true}
    ${false}            | ${true}
    ${''}               | ${true}
    ${'powerShell.exe'} | ${'powerShell.exe'}
    ${'/bin/bash'}      | ${'/bin/bash'}
  `('allow customize shell: $shell', ({shell, expected}) => {
    const workspace: any = {shell};
    createProcess(workspace, []);

    expect(mockSpawn.mock.calls[0][2].shell).toEqual(expected);
  });

  it('sets the current working directory of the child process', () => {
    const workspace: any = {
      jestCommandLine: '',
      rootPath: 'root directory',
    };
    const args = [];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][2].cwd).toBe(workspace.rootPath);
  });

  it('should set the "shell" property', () => {
    const expected = true;
    const workspace: any = {jestCommandLine: ''};
    const args = [];
    createProcess(workspace, args);

    expect(mockSpawn.mock.calls[0][2].shell).toBe(expected);
  });

  it('should set "detached" to true for non-windows system', () => {
    const workspace: any = {jestCommandLine: ''};
    const args = [];

    const savedProcess = process;
    const processMock = {...process};
    global.process = processMock;

    processMock.platform = 'darwin';
    createProcess(workspace, args);
    expect(mockSpawn.mock.calls[0][2].detached).toBe(true);

    processMock.platform = 'win32';
    createProcess(workspace, args);
    expect(mockSpawn.mock.calls[1][2].detached).toBe(false);

    global.process = savedProcess;
  });
  it('in debug mode, it will log spawn message', () => {
    const workspace: any = {rootPath: 'abc', debug: true};
    const args = [];

    createProcess(workspace, args);
    expect(spawn).toBeCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
  });
  describe('login shell', () => {
    const jestCommandLine = 'whatever';
    const workspace: any = {jestCommandLine, shell: {path: '/bin/bash', args: ['-l']}};
    const mockWrite = jest.fn();
    const savedProcess = process;
    let processMock;
    beforeEach(() => {
      processMock = {...savedProcess};
      global.process = processMock;

      mockSpawn.mockClear();
      mockWrite.mockClear();
      mockSpawn.mockReturnValue({stdin: {write: mockWrite}});
    });
    afterEach(() => {
      global.process = savedProcess;
    });

    it.each`
      platform    | spawnLoginShell
      ${'linux'}  | ${true}
      ${'darwin'} | ${true}
      ${'win32'}  | ${false}
    `('can spawn login shell for $platform => $spawnLoginShell', ({platform, spawnLoginShell}) => {
      const args = [];
      processMock.platform = platform;

      createProcess(workspace, args);

      expect(spawn).toBeCalled();
      if (spawnLoginShell) {
        expect(mockSpawn.mock.calls[0][0]).toEqual(expect.stringContaining(workspace.shell.path));
        expect(mockSpawn.mock.calls[0][2].shell).not.toBe(true);
        expect(mockWrite).toBeCalledWith(expect.stringContaining(jestCommandLine));
        expect(mockWrite).toBeCalledWith(expect.stringContaining('exit $?'));

        expect(mockConsoleLog).not.toHaveBeenCalled();
      } else {
        expect(mockSpawn.mock.calls[0][0]).toEqual(expect.stringContaining(jestCommandLine));
        expect(mockSpawn.mock.calls[0][2].shell).toBe(true);
        expect(mockWrite).not.toBeCalled();
      }
    });
    it('in debug mode, it will log spawn message', () => {
      workspace.debug = true;
      const args = [];
      processMock.platform = 'linux';

      createProcess(workspace, args);
      expect(spawn).toBeCalled();
      expect(mockSpawn.mock.calls[0][2].shell).not.toBe(true);
      expect(mockWrite).toBeCalledWith(expect.stringContaining(jestCommandLine));
      expect(mockWrite).toBeCalledWith(expect.stringContaining('exit'));
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });
});
