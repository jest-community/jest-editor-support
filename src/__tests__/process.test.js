/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {spawn} from 'child_process';
import {createProcess} from '../Process';

jest.mock('child_process');

describe('createProcess', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('spawns the process', () => {
    const workspace: any = {pathToJest: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn).toBeCalled();
  });

  it('spawns the command from workspace.pathToJest', () => {
    const workspace: any = {pathToJest: 'jest'};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toBe('jest');
    expect(spawn.mock.calls[0][1]).toEqual([]);
  });

  it('spawns a command with spaces from workspace.pathToJest', () => {
    const workspace: any = {pathToJest: 'npm test --'};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toBe('npm test --');
  });

  it('appends args', () => {
    const workspace: any = {pathToJest: 'npm test --'};
    const args = ['--option', 'value', '--another'];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toEqual(['npm', 'test', '--', ...args].join(' '));
  });

  it('sets the --config arg to workspace.pathToConfig', () => {
    const workspace: any = {
      pathToConfig: 'non-standard.jest.js',
      pathToJest: 'npm test --',
    };
    const args = ['--option', 'value'];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toEqual('npm test -- --option value --config non-standard.jest.js');
  });

  it('defines the "CI" environment variable', () => {
    const expected = Object.assign({}, process.env, {CI: 'true'});

    const workspace: any = {pathToJest: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].env).toEqual(expected);
  });

  it('sets the current working directory of the child process', () => {
    const workspace: any = {
      pathToJest: '',
      rootPath: 'root directory',
    };
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].cwd).toBe(workspace.rootPath);
  });

  it('should set the "shell" property', () => {
    const expected = true;
    const workspace: any = {pathToJest: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].shell).toBe(expected);
    expect(spawn.mock.calls[0][2].detached).toBe(expected);
  });
  it('should set "detached" to true for non-windows system', () => {
    const workspace: any = {pathToJest: ''};
    const args = [];

    const savedProcess = process;
    const processMock = {...process};
    global.process = processMock;

    processMock.platform = 'darwin';
    createProcess(workspace, args);
    expect(spawn.mock.calls[0][2].detached).toBe(true);

    processMock.platform = 'win32';
    createProcess(workspace, args);
    expect(spawn.mock.calls[1][2].detached).toBe(false);

    global.process = savedProcess;
  });
});
