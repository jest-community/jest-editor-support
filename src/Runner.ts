/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ChildProcess, spawn} from 'child_process';
import {readFile} from 'fs';
import {tmpdir} from 'os';
import * as path from 'path';
import EventEmitter from 'events';
import {MessageTypes} from './types';
import type {Options, MessageType} from './types';
import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

export type RunnerEventMap = {
  processClose: [code: number | null, signal: string | null];
  processExit: [code: number | null, signal: string | null];
  executableJSON: [data: object, {noTestsFound: boolean}];
  executableStdErr: [data: Buffer, {type: MessageType}];
  executableOutput: [data: string];
  terminalError: [error: string];
  debuggerProcessExit: [];
};

export type AllRunnerEvent = keyof RunnerEventMap;
export type RunnerEvent = Exclude<AllRunnerEvent, 'debuggerProcessExit'>;

// This class represents the running process, and
// passes out events when it understands what data is being
// pass sent out of the process
export default class Runner extends EventEmitter<RunnerEventMap> {
  /** @internal */
  runProcess?: ChildProcess;

  /** @internal */
  outputPath: string;

  /** @internal */
  workspace: ProjectWorkspace;

  /** @internal */
  private _createProcess: (workspace: ProjectWorkspace, args: string[]) => ChildProcess;

  watchMode = false;

  watchAll = false;

  /** @internal */
  options: Options;

  /** @internal */
  prevMessageTypes: MessageType[];

  /** @internal */
  private _exited: boolean;

  constructor(workspace: ProjectWorkspace, options?: Options) {
    super();

    this._createProcess = (options && options.createProcess) || createProcess;
    this.options = options || {};
    this.workspace = workspace;
    this.outputPath = path.join(tmpdir(), `jest_runner_${this.workspace.outputFileSuffix || ''}.json`);
    this.prevMessageTypes = [];
    this._exited = false;
  }

  /** @internal */
  private __convertDashedArgs(args: string[]): string[] {
    if (!this.workspace.useDashedArgs) {
      return args;
    }

    return args.map((arg) =>
      arg && arg.startsWith('--') && arg.length > 2 ? arg.replace(/(\B)([A-Z])/gm, '-$2').toLowerCase() : arg
    );
  }

  /** @internal */
  private _getArgs(): string[] {
    if (this.options.args && this.options.args.replace) {
      return this.options.args.skipConversion
        ? this.options.args.args
        : this.__convertDashedArgs(this.options.args.args);
    }

    // Handle the arg change on v18
    const belowEighteen = this.workspace.localJestMajorVersion < 18;
    const outputArg = belowEighteen ? '--jsonOutputFile' : '--outputFile';
    let args = ['--testLocationInResults', '--json', '--useStderr', outputArg, this.outputPath];
    if (this.watchMode) {
      args.push(this.watchAll ? '--watchAll' : '--watch');
    }
    if (this.options.testNamePattern) {
      args.push('--testNamePattern', this.options.testNamePattern);
    }
    if (this.options.testFileNamePattern) {
      args.push(this.options.testFileNamePattern);
    }
    if (this.workspace.collectCoverage === true) {
      args.push('--coverage');
    }
    if (this.workspace.collectCoverage === false) {
      args.push('--no-coverage');
    }
    if (this.options.noColor === true) {
      args.push('--no-color');
    }
    if (this.options.reporters) {
      this.options.reporters.forEach((reporter) => {
        args.push('--reporters', reporter);
      });
    }
    if (this.options.args) {
      args.push(...this.options.args.args);
    }
    args = this.__convertDashedArgs(args);

    return args;
  }

  start(watchMode = true, watchAll = false) {
    if (this.runProcess) {
      return;
    }

    this.watchMode = watchMode;
    this.watchAll = watchAll;

    const args = this._getArgs();
    const childProcess = this._createProcess(this.workspace, args);
    this.runProcess = childProcess;
    childProcess.stdout?.on('data', (data: Buffer) => {
      this._parseOutput(data, false);
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      // jest 23 could send test results message to stderr
      // see https://github.com/facebook/jest/pull/4858
      this._parseOutput(data, true);
    });
    childProcess.on('exit', (code: number | null, signal: string | null) => {
      this._exited = true;

      // this is mainly for backward compatibility, should be deprecated soon
      this.emit('debuggerProcessExit');

      this.emit('processExit', code, signal);
      this.prevMessageTypes.length = 0;
    });

    childProcess.on('error', (error: Error) => {
      this.emit('terminalError', `Process failed: ${error.message}`);
      this.prevMessageTypes.length = 0;
    });

    childProcess.on('close', (code: number | null, signal: string | null) => {
      // this is mainly for backward compatibility, should be deprecated soon
      this.emit('debuggerProcessExit');

      this.emit('processClose', code, signal);
      this.prevMessageTypes.length = 0;
    });
  }

  /**
   * @internal
   * parse the stdin/out stream buffer for recognized messages.
   *
   * note: if these messages coming in in separate chucks, we might not be able to
   * resolve it properly. While there haven't been much evidence of such scenario,
   * it's worth to note that it could and we might need to buffer them in that case.
   * see https://github.com/jest-community/jest-editor-support/pull/9#pullrequestreview-231888752
   *
   * @param {Buffer} data
   * @param {boolean} isStdErr
   * @returns {MessageType}
   * @memberof Runner
   */
  private _parseOutput(data: Buffer, isStdErr: boolean): MessageType {
    const msgType = this.findMessageType(data);
    switch (msgType) {
      case MessageTypes.testResults:
        this.emit('executableStdErr', data, {
          type: msgType,
        });
        readFile(this.outputPath, 'utf8', (err, _data) => {
          if (err) {
            const message = `JSON report not found at ${this.outputPath}`;
            this.emit('terminalError', message);
          } else {
            const noTestsFound = this.doResultsFollowNoTestsFoundMessage();
            this.emit('executableJSON', JSON.parse(_data), {
              noTestsFound,
            });
          }
        });
        this.prevMessageTypes.length = 0;
        break;
      case MessageTypes.watchUsage:
      case MessageTypes.noTests:
        this.prevMessageTypes.push(msgType);
        this.emit('executableStdErr', data, {
          type: msgType,
        });
        break;
      default:
        // no special action needed, just report the output by its source
        if (isStdErr) {
          this.emit('executableStdErr', data, {
            type: msgType,
          });
        } else {
          // remove clear screen escape sequence
          this.emit('executableOutput', data.toString().replace('[2J[H', ''));
        }
        this.prevMessageTypes.length = 0;
        break;
    }

    return msgType;
  }

  runJestWithUpdateForSnapshots(completion: () => void, args?: string[]) {
    const defaultArgs = ['--updateSnapshot'];

    const updateProcess = this._createProcess(this.workspace, [...defaultArgs, ...(args || [])]);
    updateProcess.on('close', () => {
      completion();
    });
  }

  closeProcess() {
    if (!this.runProcess?.pid || this._exited) {
      // eslint-disable-next-line no-console
      console.log(`process has not started or already exited`);
      return;
    }
    if (process.platform === 'win32') {
      // Windows doesn't exit the process when it should.
      spawn('taskkill', ['/pid', `${this.runProcess.pid}`, '/T', '/F']);
    } else {
      try {
        // kill all process with the same PGID, i.e.
        // as a detached process, it is the same as the PID of the leader process.
        process.kill(-this.runProcess.pid);
      } catch (e) {
        // if anything goes wrong, fallback to the old benavior
        // knowing this could leave orphan process...
        // eslint-disable-next-line no-console
        console.warn(
          `failed to kill process group, this could leave some orphan process whose ppid=${
            this.runProcess?.pid || 'process-non-exist'
          }. error=`,
          e
        );
        this.runProcess?.kill();
      }
    }
    this.runProcess = undefined;
  }

  /** @internal */
  findMessageType(buf: Buffer): MessageType {
    const noTestRegex = /No tests found related to files changed since ((last commit)|("[a-z0-9]+"))./;
    const watchUsageRegex = /^\s*Watch Usage\b/;
    const testResultsRegex = /Test results written to/;

    const checks = [
      {regex: testResultsRegex, messageType: MessageTypes.testResults},
      {regex: noTestRegex, messageType: MessageTypes.noTests},
      {regex: watchUsageRegex, messageType: MessageTypes.watchUsage},
    ];

    const str = buf.toString('utf8');
    const match = checks.find(({regex}) => regex.test(str));
    return match ? match.messageType : MessageTypes.unknown;
  }

  /** @internal */
  doResultsFollowNoTestsFoundMessage(): boolean {
    if (this.prevMessageTypes.length === 1) {
      return this.prevMessageTypes[0] === MessageTypes.noTests;
    }

    if (this.prevMessageTypes.length === 2) {
      return this.prevMessageTypes[0] === MessageTypes.noTests && this.prevMessageTypes[1] === MessageTypes.watchUsage;
    }

    return false;
  }
}
