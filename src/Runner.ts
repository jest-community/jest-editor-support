/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ChildProcess, spawn} from 'child_process';
import {readFile} from 'fs';
import {tmpdir} from 'os';
import * as path from 'path';
import EventEmitter from 'events';
import {messageTypes, Options, MessageType} from './types';

import ProjectWorkspace from './project_workspace';
import {createProcess} from './Process';

// This class represents the running process, and
// passes out events when it understands what data is being
// pass sent out of the process
export default class Runner extends EventEmitter {
  debugprocess: ChildProcess | null = null;

  outputPath: string;

  workspace: ProjectWorkspace;

  _createProcess: (workspace: ProjectWorkspace, args: string[]) => ChildProcess;

  watchMode = false;

  watchAll = false;

  options: Options;

  prevMessageTypes: MessageType[];

  constructor(workspace: ProjectWorkspace, options?: Options) {
    super();

    this._createProcess = (options && options.createProcess) || createProcess;
    this.options = options || {};
    this.workspace = workspace;
    this.outputPath = path.join(tmpdir(), `jest_runner_${this.workspace.outputFileSuffix || ''}.json`);
    this.prevMessageTypes = [];
  }

  start(watchMode = true, watchAll = false) {
    if (this.debugprocess) {
      return;
    }

    this.watchMode = watchMode;
    this.watchAll = watchAll;

    // Handle the arg change on v18
    const belowEighteen = this.workspace.localJestMajorVersion < 18;
    const outputArg = belowEighteen ? '--jsonOutputFile' : '--outputFile';

    const args = ['--testLocationInResults', '--json', '--useStderr', outputArg, this.outputPath];
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
      this.options.reporters.forEach(reporter => {
        args.push('--reporters', reporter);
      });
    }

    this.debugprocess = this._createProcess(this.workspace, args);

    if (!(this.debugprocess.stdout && this.debugprocess.stderr)) {
      throw Error('stdout or stderr not available.');
    }

    this.debugprocess.stdout.on('data', (data: Buffer) => {
      this._parseOutput(data, false);
    });

    this.debugprocess.stderr.on('data', (data: Buffer) => {
      // jest 23 could send test results message to stderr
      // see https://github.com/facebook/jest/pull/4858
      this._parseOutput(data, true);
    });
    this.debugprocess.on('exit', () => {
      this.emit('debuggerProcessExit');
      this.prevMessageTypes.length = 0;
    });

    this.debugprocess.on('error', (error: Error) => {
      this.emit('terminalError', `Process failed: ${error.message}`);
      this.prevMessageTypes.length = 0;
    });

    this.debugprocess.on('close', () => {
      this.emit('debuggerProcessExit');
      this.prevMessageTypes.length = 0;
    });
  }

  /**
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
  _parseOutput(data: Buffer, isStdErr: boolean): MessageType {
    const msgType = this.findMessageType(data);
    switch (msgType) {
      case messageTypes.testResults:
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
      case messageTypes.watchUsage:
      case messageTypes.noTests:
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
    if (!this.debugprocess) {
      return;
    }
    if (process.platform === 'win32') {
      // Windows doesn't exit the process when it should.
      spawn('taskkill', ['/pid', `${this.debugprocess.pid}`, '/T', '/F']);
    } else {
      this.debugprocess.kill();
    }
    delete this.debugprocess;
  }

  // eslint-disable-next-line class-methods-use-this
  findMessageType(buf: Buffer): MessageType {
    const noTestRegex = /No tests found related to files changed since ((last commit)|("[a-z0-9]+"))./;
    const watchUsageRegex = /^\s*Watch Usage\b/;
    const testResultsRegex = /Test results written to/;

    const checks = [
      {regex: testResultsRegex, messageType: messageTypes.testResults},
      {regex: noTestRegex, messageType: messageTypes.noTests},
      {regex: watchUsageRegex, messageType: messageTypes.watchUsage},
    ];

    const str = buf.toString('utf8');
    const match = checks.find(({regex}) => regex.test(str));
    return match ? match.messageType : messageTypes.unknown;
  }

  doResultsFollowNoTestsFoundMessage() {
    if (this.prevMessageTypes.length === 1) {
      return this.prevMessageTypes[0] === messageTypes.noTests;
    }

    if (this.prevMessageTypes.length === 2) {
      return this.prevMessageTypes[0] === messageTypes.noTests && this.prevMessageTypes[1] === messageTypes.watchUsage;
    }

    return false;
  }
}
