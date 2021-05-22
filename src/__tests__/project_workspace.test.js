/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ProjectWorkspace, {createProjectWorkspace} from '../project_workspace';

describe('setup', () => {
  beforeAll(() => {
    // we mock console.warn because we emit a warning when the deprecated property is used.  We will
    // throw away the actual message to save cluttering the test output.
    jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    // make sure the call details are reset between each test.
    jest.clearAllMocks();
  });

  it('sets itself up fom the constructor', () => {
    const workspace = new ProjectWorkspace('root_path', 'jest_command_line', 'path_to_config', 1000);
    expect(workspace.rootPath).toEqual('root_path');
    expect(workspace.jestCommandLine).toEqual('jest_command_line');
  });
  it('can safe guard outputFileSuffix', () => {
    const suffixStrings = [
      [undefined, undefined],
      ['with_underscore', 'with_underscore'],
      ['camelCase', 'camelcase'],
      ['upperCase', 'uppercase'],
      ['with Space', 'with_space'],
      ['WITH?special ? character\n', 'with_special___character_'],
    ];
    suffixStrings.forEach((pair) => {
      const workspace = new ProjectWorkspace('root_path', 'jest_command_line', 'path_to_config', 1000, pair[0]);
      expect(workspace.outputFileSuffix).toEqual(pair[1]);
    });
  });

  it('ensure that pathToJest is a shadow accessor for jestCommandLine', () => {
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

  it('ProjectWorkspace factory can create a valid instance without pathToConfig', () => {
    const config = {
      jestCommandLine: 'jestCommandLine',
      localJestMajorVersion: 1000,
      rootPath: 'rootPath',
      collectCoverage: false,
      debug: true,
      outputFileSuffix: 'suffix',
    };

    const instance = createProjectWorkspace(config);

    expect(instance.collectCoverage).toBe(config.collectCoverage);
    expect(instance.debug).toBe(config.debug);
    expect(instance.jestCommandLine).toBe(config.jestCommandLine);
    expect(instance.localJestMajorVersion).toBe(config.localJestMajorVersion);
    expect(instance.outputFileSuffix).toBe(config.outputFileSuffix);
    expect(instance.rootPath).toBe(config.rootPath);
    expect(instance.pathToConfig).toBe(undefined);
  });

  it('accessing pathToJest invokes console warning.', () => {
    const config = {
      jestCommandLine: 'jestCommandLine',
      localJestMajorVersion: 1000,
      rootPath: 'rootPath',
      collectCoverage: false,
      debug: true,
      outputFileSuffix: 'suffix',
    };

    const instance = createProjectWorkspace(config);

    instance.pathToJest = 'new value';
    expect(global.console.warn).toBeCalledTimes(1);

    // eslint-disable-next-line no-unused-vars
    const {pathToJest} = instance;
    expect(global.console.warn).toBeCalledTimes(2);
  });
  it('allow passing nodeEnv', () => {
    const config = {
      jestCommandLine: 'jestCommandLine',
      localJestMajorVersion: 1000,
      rootPath: 'rootPath',
      collectCoverage: false,
      debug: true,
      outputFileSuffix: 'suffix',
      nodeEnv: {NODE_ENV: 'production'},
    };

    const instance = createProjectWorkspace(config);

    expect(instance.nodeEnv).toBe(config.nodeEnv);
  });
});
