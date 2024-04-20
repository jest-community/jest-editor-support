/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import EventEmitter from 'events';
import Runner from '../Runner';
import {MessageTypes} from '../types';
import ProjectWorkspace from '../project_workspace';
import os from 'os';
import path from 'path';
import cp from 'child_process';
import fs from 'fs';
import process from 'process';
import * as Process from '../Process';

const fixtures = path.resolve(__dirname, '../../fixtures');

describe('Runner', () => {
  let processKillSpy: jest.SpyInstance;
  let tmpdirSpy: jest.SpyInstance;
  let joinSpy: jest.SpyInstance;
  let spawnSpy: jest.SpyInstance;
  let createProcessSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();

    createProcessSpy = jest.spyOn(Process, 'createProcess');
    createProcessSpy.mockReturnValue({pid: 123} as any);

    processKillSpy = jest.spyOn(process, 'kill');
    processKillSpy.mockReturnValue(true);

    tmpdirSpy = jest.spyOn(os, 'tmpdir');
    tmpdirSpy.mockReturnValue('tmpdir');

    joinSpy = jest.spyOn(path, 'join');
    joinSpy.mockImplementation((...paths: string[]) => paths.join('/'));

    spawnSpy = jest.spyOn(cp, 'spawn');
    spawnSpy.mockReturnValue({pid: 123} as any);

    // Replace `readFile` with `readFileSync` so we don't get multiple threads
    jest
      .spyOn(fs, 'readFile')
      .mockImplementation(
        (_path: any, options: any, callback?: (err: NodeJS.ErrnoException | null, data: Buffer | string) => void) => {
          // Determine if 'options' is a function, implying it is the callback, and there were no options passed.
          if (typeof options === 'function') {
            callback = options;
            options = undefined; // Set options to undefined to reflect no options passed.
          }

          // Ensure callback exists before invoking it.
          if (callback) {
            try {
              // If options include an encoding, the return type should be a string.
              const encoding = typeof options === 'string' ? options : options?.encoding;
              const data = fs.readFileSync(_path, {encoding});

              // Invoke the callback with no error and data.
              // If encoding is specified and is a known string encoding, 'data' will be a string.
              callback(null, data);
            } catch (error) {
              // If readFileSync throws an error, pass it to the callback.
              callback(error as NodeJS.ErrnoException, '');
            }
          }
        }
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('constructor', () => {
    it('does not set watchMode', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      expect(sut.watchMode).toBeFalsy();
    });

    it('does not set watchAll', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      expect(sut.watchAll).toBeFalsy();
    });

    it('sets the output filepath', () => {
      const suffix = ['runner-test', undefined];

      suffix.forEach((s) => {
        const workspace: any = {outputFileSuffix: s};
        joinSpy.mockImplementation((...paths: string[]) => paths.join('/'));
        const sut = new Runner(workspace);
        expect(sut.outputPath).toEqual(`tmpdir/jest_runner_${s || ''}.json`);
      });
    });

    it('sets the default options', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      expect(sut.options).toEqual({});
    });

    it('sets the options', () => {
      const workspace: any = {};
      const options = {};
      const sut = new Runner(workspace, options);

      expect(sut.options).toEqual(options);
    });
  });

  describe('start', () => {
    beforeEach(() => {
      createProcessSpy.mockImplementationOnce(() => {
        const _process: any = new EventEmitter();
        _process.stdout = new EventEmitter();
        _process.stderr = new EventEmitter();
        return _process;
      });
    });

    it('will not start when started', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      sut.start();
      sut.start();

      expect(createProcessSpy).toHaveBeenCalledTimes(1);
    });

    it('sets watchMode', () => {
      const expected = true;

      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(expected);

      expect(sut.watchMode).toEqual(expected);
    });

    it('sets watchAll', () => {
      const watchMode = true;
      const watchAll = true;

      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(watchMode, watchAll);

      expect(sut.watchMode).toEqual(watchMode);
      expect(sut.watchAll).toEqual(watchAll);
    });

    it('calls createProcess', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(false);

      expect(createProcessSpy.mock.calls[0][0]).toEqual(workspace);
    });

    it('calls createProcess with the --json arg', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(false);

      expect(createProcessSpy.mock.calls[0][1]).toContain('--json');
    });

    it('calls createProcess with the --useStderr arg', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(false);

      expect(createProcessSpy.mock.calls[0][1]).toContain('--useStderr');
    });

    it('calls createProcess with the --jsonOutputFile arg for Jest 17 and below', () => {
      const workspace: any = {localJestMajorVersion: 17};
      const sut = new Runner(workspace);
      sut.start(false);

      expect(createProcessSpy).toHaveBeenCalledTimes(1);
      const args = createProcessSpy.mock.calls[0][1];
      const index: number = args.indexOf('--jsonOutputFile');
      expect(index).not.toEqual(-1);
      expect(args[index + 1]).toEqual(sut.outputPath);
    });

    it('calls createProcess with the --outputFile arg for Jest 18 and above', () => {
      const workspace: any = {localJestMajorVersion: 18};
      const sut = new Runner(workspace);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index: number = args.indexOf('--outputFile');
      expect(index).not.toEqual(-1);
      expect(args[index + 1]).toEqual(sut.outputPath);
    });

    it('calls createProcess with the --watch arg when provided', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(true);

      expect(createProcessSpy.mock.calls[0][1]).toContain('--watch');
    });

    it('calls createProcess with the --coverage arg when provided', () => {
      const expected = '--coverage';

      const workspace: any = {collectCoverage: true};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).not.toEqual(-1);
    });

    it('calls createProcess with the ---no-coverage arg when provided and false', () => {
      const expected = '--no-coverage';

      const workspace: any = {collectCoverage: false};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).not.toEqual(-1);
    });

    it('calls createProcess without the --coverage arg when undefined', () => {
      const expected = '--coverage';

      const workspace: any = {};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).toEqual(-1);
    });

    it('calls createProcess with the --testNamePattern arg when provided', () => {
      const expected = 'testNamePattern';

      const workspace: any = {};
      const options = {testNamePattern: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index: number = args.indexOf('--testNamePattern');
      expect(index).not.toEqual(-1);
      expect(args[index + 1]).toEqual(expected);
    });

    it('calls createProcess with a test path pattern when provided', () => {
      const expected = 'testPathPattern';
      const workspace: any = {};
      const options = {testFileNamePattern: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      expect(createProcessSpy.mock.calls[0][1]).toContain(expected);
    });

    it('calls createProcess with the no color option when provided', () => {
      const expected = '--no-color';

      const workspace: any = {};
      const options = {noColor: true};
      const sut = new Runner(workspace, options);
      sut.start(false);

      expect(createProcessSpy.mock.calls[0][1]).toContain(expected);
    });

    it('calls createProcess with the --reporters arg when provided', () => {
      const expected = ['reporter'];

      const workspace: any = {};
      const options = {reporters: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index: number = args.indexOf('--reporters');
      expect(index).not.toEqual(-1);
      expect(args[index + 1]).toEqual(expected[0]);
    });

    it('calls createProcess with multiple --reporters arg when provided', () => {
      const expected = ['reporter1', 'reporter2'];

      const workspace: any = {};
      const options = {reporters: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index: number = args.indexOf('--reporters');
      expect(args[index + 1]).toEqual(expected[0]);
      const lastIndex: number = args.lastIndexOf('--reporters');
      expect(args[lastIndex + 1]).toEqual(expected[1]);
    });

    it('calls createProcess with camel cased args by default', () => {
      const expected = '--testLocationInResults';

      const workspace: any = {};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      expect(args[0]).toEqual(expected);
    });

    it('calls createProcess with dashed args when provided', () => {
      const expected = '--test-location-in-results';

      const workspace: any = {useDashedArgs: true};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      expect(args[0]).toEqual(expected);
    });

    it.each`
      argOption                                                       | expected
      ${{args: ['--fooBarBaz']}}                                      | ${'--foo-bar-baz'}
      ${{args: ['--fooBarBaz'], replace: true}}                       | ${'--foo-bar-baz'}
      ${{args: ['--fooBarBaz'], replace: true, skipConversion: true}} | ${'--fooBarBaz'}
    `('converts user passed in args', ({argOption, expected}) => {
      const workspace: any = {useDashedArgs: true};
      const options = {args: argOption};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).not.toEqual(-1);
    });

    it('does not alter already dashed args when provided', () => {
      const expected = '--foo-bar-baz';

      const workspace: any = {useDashedArgs: true};
      const options = {args: {args: [expected]}};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = createProcessSpy.mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).not.toEqual(-1);
    });

    describe('RunArgs', () => {
      it.each`
        runArgs                                   | containedArgs
        ${{args: ['--whatever']}}                 | ${['--no-color', '--whatever']}
        ${{args: ['--whatever'], replace: false}} | ${['--no-color', '--whatever']}
        ${{args: ['--whatever'], replace: true}}  | ${['--whatever']}
      `('supports $runArg', ({runArgs, containedArgs}) => {
        const workspace: any = {};
        const options = {noColor: true, args: runArgs};
        const sut = new Runner(workspace, options);
        sut.start(false);

        expect(createProcessSpy).toHaveBeenCalledWith(workspace, expect.arrayContaining(containedArgs));
      });
    });
  });

  describe('closeProcess', () => {
    let savedPlatform: any;
    const setPlatform = (value: string) => {
      Object.defineProperty(process, 'platform', {
        value, // Example: Mocking as if running on Windows
        writable: true,
      });
    };

    beforeEach(() => {
      savedPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    });

    afterEach(() => {
      Object.defineProperty(process, 'platform', savedPlatform);
    });

    it('does nothing if the runner has not started', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.closeProcess();

      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it('spawns taskkill to close the process on Windows', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      setPlatform('win32');
      sut.runProcess = {pid: 123} as any;
      sut.closeProcess();

      expect(spawnSpy).toHaveBeenCalledWith('taskkill', ['/pid', '123', '/T', '/F']);
    });

    it('calls process.kill() with processGroup id to close the process on POSIX', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      setPlatform('posix');
      const kill = jest.fn();
      sut.runProcess = {kill, pid: 123} as any;
      sut.closeProcess();

      expect(kill).not.toHaveBeenCalled();
      expect(processKillSpy).toHaveBeenCalledWith(-123);
    });
    it('if process.kill() failed, it will fallback to subprocess.kill', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      setPlatform('posix');
      const kill = jest.fn();
      sut.runProcess = {kill, pid: 123} as any;

      processKillSpy.mockImplementation(() => {
        throw new Error('for testing');
      });

      sut.closeProcess();

      expect(kill).toHaveBeenCalled();
    });

    it('clears the runProcess property', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.runProcess = {kill: () => {}, pid: 123} as any;
      sut.closeProcess();

      expect(sut.runProcess).not.toBeDefined();
    });
  });

  describe('events', () => {
    let runner: Runner;
    let fakeProcess: any;

    beforeEach(() => {
      fakeProcess = new EventEmitter() as any;
      fakeProcess.stdout = new EventEmitter();
      fakeProcess.stderr = new EventEmitter();
      fakeProcess.kill = () => {};
      fakeProcess.pid = 123;

      createProcessSpy.mockImplementation(() => fakeProcess);

      const workspace = new ProjectWorkspace('.', 'node_modules/.bin/jest', 'test', 18);
      runner = new Runner(workspace);

      // Sets it up and registers for notifications
      runner.start();
    });

    it('expects JSON from both stdout and stderr, then it passes the JSON', () => {
      const data = jest.fn();
      runner.on('executableJSON', data);

      runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;

      const doTest = (out: any) => {
        data.mockClear();

        // Emitting data through stdout should trigger sending JSON
        out.emit('data', 'Test results written to file');
        expect(data).toHaveBeenCalled();

        // And lets check what we emit
        const dataAtPath = fs.readFileSync(runner.outputPath);
        const storedJSON = JSON.parse(dataAtPath.toString());
        expect(data.mock.calls[0][0]).toEqual(storedJSON);
      };

      doTest(fakeProcess.stdout);
      doTest(fakeProcess.stderr);
    });

    it('emits errors when process errors', () => {
      const error = jest.fn();
      runner.on('terminalError', error);
      fakeProcess.emit('error', {});
      expect(error).toHaveBeenCalled();
    });

    it('emits processExit when process exits', () => {
      const close = jest.fn();
      runner.on('processExit', close);
      fakeProcess.emit('exit', 0, null);
      expect(close).toHaveBeenCalledWith(0, null);
    });

    it('emits processExit when process close', () => {
      const close = jest.fn();
      runner.on('processClose', close);
      fakeProcess.emit('close', null, 'SIGKILL');
      expect(close).toHaveBeenCalledWith(null, 'SIGKILL');
    });

    it('support to-be-deprecated debuggerProcessExit when process closes and exits', () => {
      const close = jest.fn();
      runner.on('debuggerProcessExit', close);
      fakeProcess.emit('exit');
      expect(close).toHaveBeenCalledTimes(1);
      fakeProcess.emit('close');
      expect(close).toHaveBeenCalledTimes(2);
    });

    it('should start jest process after killing the old process', () => {
      expect(createProcessSpy).toHaveBeenCalledTimes(1);
      runner.closeProcess();
      runner.start();

      expect(createProcessSpy).toHaveBeenCalledTimes(2);
    });

    describe('stdout.on("data")', () => {
      it('should emit an "executableJSON" event with the "noTestsFound" meta data property set', () => {
        const listener = jest.fn();
        runner.on('executableJSON', listener);
        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        (runner as any).doResultsFollowNoTestsFoundMessage = jest.fn().mockReturnValueOnce(true);
        fakeProcess.stdout.emit('data', 'Test results written to file');

        expect(listener.mock.calls[0].length).toEqual(2);
        expect(listener.mock.calls[0][1]).toEqual({noTestsFound: true});
      });

      it('should clear the message type history', () => {
        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        runner.prevMessageTypes.push(MessageTypes.noTests);
        fakeProcess.stdout.emit('data', 'Test results written to file');

        expect(runner.prevMessageTypes.length).toEqual(0);
      });
      it.each`
        msgType                     | eventType
        ${MessageTypes.testResults} | ${'executableStdErr'}
        ${MessageTypes.watchUsage}  | ${'executableStdErr'}
        ${MessageTypes.noTests}     | ${'executableStdErr'}
        ${MessageTypes.unknown}     | ${'executableOutput'}
      `('should always emit output event with type $msgType', ({msgType, eventType}) => {
        const stderrListener = jest.fn();
        const stdoutListener = jest.fn();
        const data = Buffer.from('whatever');
        const meta = {type: msgType};

        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        (runner as any).findMessageType = jest.fn().mockReturnValueOnce(msgType);

        runner.on('executableStdErr', stderrListener);
        runner.on('executableOutput', stdoutListener);
        fakeProcess.stdout.emit('data', data, meta);

        if (eventType === 'executableStdErr') {
          expect(stderrListener).toHaveBeenCalledWith(data, meta);
        } else {
          expect(stdoutListener).toHaveBeenCalledWith(data.toString());
        }
      });
    });

    describe('stderr.on("data")', () => {
      it('should identify the message type', () => {
        const mockFindMessageType = jest.fn();
        (runner as any).findMessageType = mockFindMessageType;
        const expected = {};
        fakeProcess.stderr.emit('data', expected);

        expect(mockFindMessageType).toHaveBeenCalledWith(expected);
      });

      it('should add the type to the message type history when known', () => {
        (runner as any).findMessageType = jest.fn().mockReturnValueOnce(MessageTypes.noTests);
        fakeProcess.stderr.emit('data', Buffer.from(''));

        expect(runner.prevMessageTypes).toEqual([MessageTypes.noTests]);
      });

      it('should clear the message type history when the type is unknown', () => {
        (runner as any).findMessageType = jest.fn().mockReturnValueOnce(MessageTypes.unknown);
        fakeProcess.stderr.emit('data', Buffer.from(''));

        expect(runner.prevMessageTypes).toEqual([]);
      });

      it.each`
        type
        ${MessageTypes.testResults}
        ${MessageTypes.watchUsage}
        ${MessageTypes.noTests}
        ${MessageTypes.unknown}
      `('should always emit an "executableStdErr" event with type $type', ({type}) => {
        const listener = jest.fn();
        const data = Buffer.from('');
        const meta = {type};

        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        (runner as any).findMessageType = jest.fn().mockReturnValueOnce(type);

        runner.on('executableStdErr', listener);
        fakeProcess.stderr.emit('data', data, meta);

        expect(listener).toHaveBeenCalledWith(data, meta);
      });

      it('should track when "No tests found related to files changed since the last commit" is received', () => {
        const data = Buffer.from(
          'No tests found related to files changed since last commit.\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        fakeProcess.stderr.emit('data', data);

        expect(runner.prevMessageTypes).toEqual([MessageTypes.noTests]);
      });

      it('should track when "No tests found related to files changed since master" is received', () => {
        const data = Buffer.from(
          'No tests found related to files changed since "master".\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        fakeProcess.stderr.emit('data', data);

        expect(runner.prevMessageTypes).toEqual([MessageTypes.noTests]);
      });

      it('should clear the message type history when any other other data is received', () => {
        const data = Buffer.from('');
        fakeProcess.stderr.emit('data', data);

        expect(runner.prevMessageTypes).toEqual([]);
      });
    });

    describe('findMessageType()', () => {
      it('should return "unknown" when the message is not matched', () => {
        const buf = Buffer.from('');
        expect(runner.findMessageType(buf)).toEqual(MessageTypes.unknown);
      });

      it('should identify "No tests found related to files changed since last commit."', () => {
        const buf = Buffer.from(
          'No tests found related to files changed since last commit.\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        expect(runner.findMessageType(buf)).toEqual(MessageTypes.noTests);
      });

      it('should identify "No tests found related to files changed since git ref."', () => {
        const buf = Buffer.from(
          'No tests found related to files changed since "master".\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        expect(runner.findMessageType(buf)).toEqual(MessageTypes.noTests);
      });

      it('should identify the "Watch Usage" prompt', () => {
        const buf = Buffer.from('\n\nWatch Usage\n...');
        expect(runner.findMessageType(buf)).toEqual(MessageTypes.watchUsage);
      });
      it('should prioritize message types accordingly.', () => {
        // testResults > noTests > watchUsage > unknown

        const testResults = 'Test results written to file\n';
        const noTests = 'No tests found related to files changed since "master".\n';
        const watchUsage = 'Press `a` to run all tests, or run Jest with `--watchAll`\n';
        const unknownMsg = 'whatever...\n';

        expect(runner.findMessageType(Buffer.from(noTests + testResults))).toEqual(MessageTypes.testResults);

        expect(runner.findMessageType(Buffer.from(noTests + watchUsage))).toEqual(MessageTypes.noTests);

        expect(runner.findMessageType(Buffer.from(noTests + watchUsage + testResults))).toEqual(
          MessageTypes.testResults
        );

        expect(runner.findMessageType(Buffer.from(unknownMsg + testResults))).toEqual(MessageTypes.testResults);
      });
    });

    describe('doResultsFollowNoTestsFoundMessage()', () => {
      it('should return true when the last message on stderr was "No tests found..."', () => {
        runner.prevMessageTypes.push(MessageTypes.noTests);
        expect(runner.doResultsFollowNoTestsFoundMessage()).toEqual(true);
      });

      it('should return true when the last two messages on stderr were "No tests found..." and "Watch Usage"', () => {
        runner.prevMessageTypes.push(MessageTypes.noTests, MessageTypes.watchUsage);
        expect(runner.doResultsFollowNoTestsFoundMessage()).toEqual(true);
      });

      it('should return false otherwise', () => {
        runner.prevMessageTypes.length = 0;
        expect(runner.doResultsFollowNoTestsFoundMessage()).toEqual(false);
      });
    });
  });
});
