/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Represents the project that the extension is running on and it's state
 */
export default class ProjectWorkspace {
  private _jestCommandLine: string;

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
  get jestCommandLine() {
    return this._jestCommandLine;
  }

  set jestCommandLine(commandLine: string) {
    this._jestCommandLine = commandLine;
  }

  /**
   * @deprecated please use `jestCommandLine` instead.  If both settings are provided, only
   * `jestCommandLine` will be used.
   *
   * @type {string?}
   */
  get pathToJest() {
    return this._jestCommandLine;
  }

  set pathToJest(commandLine: string) {
    this._jestCommandLine = commandLine;
  }

  /**
   * Optional. Path to a local Jest config file.
   *
   * @type {string}
   */
  pathToConfig?: string;

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

  constructor(
    rootPath: string,
    jestCommandLine: string,
    pathToConfig: string,
    localJestMajorVersion: number,
    outputFileSuffix?: string,
    collectCoverage?: boolean,
    debug?: boolean
  ) {
    this.rootPath = rootPath;
    this.jestCommandLine = jestCommandLine;
    this.pathToConfig = pathToConfig;
    this.localJestMajorVersion = localJestMajorVersion;
    this.outputFileSuffix = outputFileSuffix ? outputFileSuffix.replace(/[^a-z0-9]/gi, '_').toLowerCase() : undefined;
    this.collectCoverage = collectCoverage;
    this.debug = debug;
  }
}
