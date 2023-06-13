/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * a LoginShell holds the shell path and arguments to
 * start an login/interactive shell
 */
export interface LoginShell {
  /** shell executable path */
  path: string;
  /** shell arguments */
  args: string[];
}
export interface ProjectWorkspaceConfig {
  jestCommandLine: string;
  pathToConfig?: string;
  rootPath: string;
  localJestMajorVersion: number;
  outputFileSuffix?: string;
  collectCoverage?: boolean;
  debug?: boolean;
  nodeEnv?: {[key: string]: string | undefined};
  shell?: string | LoginShell;
  useDashedArgs?: boolean;
}

/**
 * Represents the project that the extension is running on and it's state
 */
export default class ProjectWorkspace {
  /**
   * The path to the root of the project's workspace
   *
   * @type {string}
   */
  rootPath: string;

  /**
   * The command to execute Jest on the command line, this is normally a file path like
   * `node_modules/.bin/jest` but you should not make the assumption that it is always a direct
   * file path, as in a create-react app it would look like `npm test --`.
   *
   * This means when launching a process, you will need to split on the first
   * space, and then move any other args into the args of the process.
   *
   * @type {string}
   */
  jestCommandLine: string;

  /**
   * @deprecated please use `jestCommandLine` instead.
   *
   * @type {string?}
   */
  get pathToJest(): string {
    // eslint-disable-next-line no-console
    console.warn('Use of ProjectWorkspace.pathToJest is deprecated.  Please use jestCommandLine instead.');
    return this.jestCommandLine;
  }

  set pathToJest(commandLine: string) {
    // eslint-disable-next-line no-console
    console.warn('Use of ProjectWorkspace.pathToJest is deprecated.  Please use jestCommandLine instead.');
    this.jestCommandLine = commandLine;
  }

  /**
   * Path to a local Jest config file.
   *
   * @type {string}
   */
  pathToConfig: string;

  /**
   * local Jest major release version, as the runner could run against
   * any version of Jest.
   *
   * @type {number}
   */
  localJestMajorVersion: number;

  /**
   * Whether test coverage should be (automatically) collected.
   *
   * @type {boolean}
   */
  collectCoverage?: boolean;

  /**
   * if to output more information for debugging purpose. Default is false.
   *
   * @type {boolean}
   */
  debug?: boolean;

  /**
   * suffix string used as part of the output file path, this is to support concurrent Runners.
   *
   * @type {string}
   * @memberof ProjectWorkspace
   */
  outputFileSuffix?: string;

  /**
   * optional additional node env variables
   */
  nodeEnv?: {[key: string]: string | undefined};

  /**
   * optional custom shell for node child_process spawn() call. Default is '/bin/sh' on Unix, and process.env.ComSpec on Windows.
   * see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
   *
   * If a string is passed in, a non-login/non-interactive shell will be used to spawn the child_process
   * If a terminal-shell is passed, a login/interactive shell will be used to spawn the child_process. This is not as efficient as
   * the non-login/non-interactive shell, but might be needed if parent environment is not guarenteed to be properly initialized
   * (see https://github.com/jest-community/vscode-jest/issues/741)
   */
  shell?: string | LoginShell;

  /**
   * Wether dashed args should be used for the jest command line. Default is false.
   */
  useDashedArgs?: boolean;

  constructor(
    rootPath: string,
    jestCommandLine: string,
    pathToConfig: string,
    localJestMajorVersion: number,
    outputFileSuffix?: string,
    collectCoverage?: boolean,
    debug?: boolean,
    nodeEnv?: {[key: string]: string | undefined},
    shell?: string | LoginShell,
    useDashedArgs?: boolean
  ) {
    this.rootPath = rootPath;
    this.jestCommandLine = jestCommandLine;
    this.pathToConfig = pathToConfig;
    this.localJestMajorVersion = localJestMajorVersion;
    this.outputFileSuffix = outputFileSuffix ? outputFileSuffix.replace(/[^a-z0-9]/gi, '_').toLowerCase() : undefined;
    this.collectCoverage = collectCoverage;
    this.debug = debug;
    this.nodeEnv = nodeEnv;
    this.shell = shell;
    this.useDashedArgs = useDashedArgs;
  }
}

/**
 * A factory to create a ProjectWorkspace instance from a ProjectWorkspaceConfig object.
 */
export const createProjectWorkspace = (config: ProjectWorkspaceConfig): ProjectWorkspace => {
  // Note for pathToConfig we are forcing the TS compiler to accept undefined for ProjectWorkspace.pathToConfig.
  // This property should be allowed to be optional, since Jest will work fine if no config file is provided.  It
  // will just use defaults.
  return new ProjectWorkspace(
    config.rootPath,
    config.jestCommandLine,
    config.pathToConfig as unknown as string,
    config.localJestMajorVersion,
    config.outputFileSuffix,
    config.collectCoverage,
    config.debug,
    config.nodeEnv,
    config.shell,
    config.useDashedArgs
  );
};
