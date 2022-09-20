/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {spawn} from 'child_process';
import {readFileSync} from 'fs';
import EventEmitter from 'events';
import type {ChildProcess} from 'child_process';
import Runner from '../Runner';
import {createProcess} from '../Process';
import {messageTypes} from '../types';
import ProjectWorkspace from '../project_workspace';

// ('use strict');

jest.mock('../Process');
jest.mock('child_process', () => ({spawn: jest.fn()}));
jest.mock('os', () => ({tmpdir: jest.fn()}));
jest.mock('path', () => ({join: jest.fn()}));
jest.mock('fs', () => {
  // $FlowFixMe requireActual
  // eslint-disable-next-line no-shadow
  const {readFileSync} = jest.requireActual('fs');

  // Replace `readFile` with `readFileSync` so we don't get multiple threads
  return {
    readFile: (_path, type, closure) => {
      const data = readFileSync(_path);
      closure(null, data);
    },
    readFileSync,
  };
});

// const _path = require('path');
const _path = jest.requireActual('path');
const fixtures = _path.resolve(__dirname, '../../fixtures');

describe('Runner', () => {
  const processKill = jest.fn();
  let originalProcessKill;

  beforeAll(() => {
    originalProcessKill = process.kill;
    (process: any).kill = processKill;
  });

  afterAll(() => {
    (process: any).kill = originalProcessKill;
  });
  describe('constructor', () => {
    it('does not set watchMode', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      expect(sut.watchMode).not.toBeDefined();
    });

    it('does not set watchAll', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      expect(sut.watchAll).not.toBeDefined();
    });

    it('sets the output filepath', () => {
      tmpdir.mockReturnValue('tmpdir');

      const suffix = ['runner-test', undefined];

      suffix.forEach((s) => {
        const workspace: any = {outputFileSuffix: s};
        path.join.mockImplementation((...paths: string[]) => paths.join('/'));
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

      expect(sut.options).toBe(options);
    });
  });

  describe('start', () => {
    beforeEach(() => {
      jest.resetAllMocks();

      (createProcess: any).mockImplementationOnce(() => {
        const process: any = new EventEmitter();
        process.stdout = new EventEmitter();
        process.stderr = new EventEmitter();
        return process;
      });
    });

    it('will not start when started', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);

      sut.start();
      sut.start();

      expect(createProcess).toHaveBeenCalledTimes(1);
    });

    it('sets watchMode', () => {
      const expected = true;

      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(expected);

      expect(sut.watchMode).toBe(expected);
    });

    it('sets watchAll', () => {
      const watchMode = true;
      const watchAll = true;

      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(watchMode, watchAll);

      expect(sut.watchMode).toBe(watchMode);
      expect(sut.watchAll).toBe(watchAll);
    });

    it('calls createProcess', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(false);

      expect((createProcess: any).mock.calls[0][0]).toBe(workspace);
    });

    it('calls createProcess with the --json arg', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(false);

      expect((createProcess: any).mock.calls[0][1]).toContain('--json');
    });

    it('calls createProcess with the --useStderr arg', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(false);

      expect((createProcess: any).mock.calls[0][1]).toContain('--useStderr');
    });

    it('calls createProcess with the --jsonOutputFile arg for Jest 17 and below', () => {
      const workspace: any = {localJestMajorVersion: 17};
      const sut = new Runner(workspace);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf('--jsonOutputFile');
      expect(index).not.toBe(-1);
      expect(args[index + 1]).toBe(sut.outputPath);
    });

    it('calls createProcess with the --outputFile arg for Jest 18 and above', () => {
      const workspace: any = {localJestMajorVersion: 18};
      const sut = new Runner(workspace);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf('--outputFile');
      expect(index).not.toBe(-1);
      expect(args[index + 1]).toBe(sut.outputPath);
    });

    it('calls createProcess with the --watch arg when provided', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.start(true);

      expect((createProcess: any).mock.calls[0][1]).toContain('--watch');
    });

    it('calls createProcess with the --coverage arg when provided', () => {
      const expected = '--coverage';

      const workspace: any = {collectCoverage: true};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).not.toBe(-1);
    });

    it('calls createProcess with the ---no-coverage arg when provided and false', () => {
      const expected = '--no-coverage';

      const workspace: any = {collectCoverage: false};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).not.toBe(-1);
    });

    it('calls createProcess without the --coverage arg when undefined', () => {
      const expected = '--coverage';

      const workspace: any = {};
      const options = {};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf(expected);
      expect(index).toBe(-1);
    });

    it('calls createProcess with the --testNamePattern arg when provided', () => {
      const expected = 'testNamePattern';

      const workspace: any = {};
      const options = {testNamePattern: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf('--testNamePattern');
      expect(index).not.toBe(-1);
      expect(args[index + 1]).toBe(expected);
    });

    it('calls createProcess with a test path pattern when provided', () => {
      const expected = 'testPathPattern';
      const workspace: any = {};
      const options = {testFileNamePattern: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      expect((createProcess: any).mock.calls[0][1]).toContain(expected);
    });

    it('calls createProcess with the no color option when provided', () => {
      const expected = '--no-color';

      const workspace: any = {};
      const options = {noColor: true};
      const sut = new Runner(workspace, options);
      sut.start(false);

      expect((createProcess: any).mock.calls[0][1]).toContain(expected);
    });

    it('calls createProcess with the --reporters arg when provided', () => {
      const expected = ['reporter'];

      const workspace: any = {};
      const options = {reporters: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf('--reporters');
      expect(index).not.toBe(-1);
      expect(args[index + 1]).toBe(expected[0]);
    });

    it('calls createProcess with multiple --reporters arg when provided', () => {
      const expected = ['reporter1', 'reporter2'];

      const workspace: any = {};
      const options = {reporters: expected};
      const sut = new Runner(workspace, options);
      sut.start(false);

      const args = (createProcess: any).mock.calls[0][1];
      const index = args.indexOf('--reporters');
      expect(args[index + 1]).toBe(expected[0]);
      const lastIndex = args.lastIndexOf('--reporters');
      expect(args[lastIndex + 1]).toBe(expected[1]);
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

        expect(createProcess).toBeCalledWith(workspace, expect.arrayContaining(containedArgs));
      });
    });
  });

  describe('closeProcess', () => {
    let platformPV;

    beforeEach(() => {
      jest.resetAllMocks();
      platformPV = process.platform;

      // Remove the "process.platform" property descriptor so it can be writable.
      delete process.platform;
    });

    afterEach(() => {
      process.platform = platformPV;
    });

    it('does nothing if the runner has not started', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.closeProcess();

      expect(spawn).not.toBeCalled();
    });

    it('spawns taskkill to close the process on Windows', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      process.platform = 'win32';
      sut.debugprocess = ({pid: 123}: any);
      sut.closeProcess();

      expect(spawn).toBeCalledWith('taskkill', ['/pid', '123', '/T', '/F']);
    });

    it('calls process.kill() with processGroup id to close the process on POSIX', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      process.platform = 'posix';
      const kill = jest.fn();
      sut.debugprocess = ({kill, pid: 123}: any);
      sut.closeProcess();

      expect(kill).not.toBeCalled();
      expect(processKill).toBeCalledWith(-123);
    });
    it('if process.kill() failed, it will fallback to subprocess.kill', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      process.platform = 'posix';
      const kill = jest.fn();
      sut.debugprocess = ({kill, pid: 123}: any);

      processKill.mockImplementation(() => {
        throw new Error('for testing');
      });

      sut.closeProcess();

      expect(kill).toBeCalled();
    });

    it('clears the debugprocess property', () => {
      const workspace: any = {};
      const sut = new Runner(workspace);
      sut.debugprocess = ({kill: () => {}}: any);
      sut.closeProcess();

      expect(sut.debugprocess).not.toBeDefined();
    });
  });

  describe('events', () => {
    let runner: Runner;
    let fakeProcess: ChildProcess;

    beforeEach(() => {
      jest.resetAllMocks();

      fakeProcess = (new EventEmitter(): any);
      fakeProcess.stdout = new EventEmitter();
      fakeProcess.stderr = new EventEmitter();
      fakeProcess.kill = () => {};

      (createProcess: any).mockImplementation(() => fakeProcess);

      const workspace = new ProjectWorkspace('.', 'node_modules/.bin/jest', 'test', 18);
      runner = new Runner(workspace);

      // Sets it up and registers for notifications
      runner.start();
    });

    it('expects JSON from both stdout and stderr, then it passes the JSON', () => {
      const data = jest.fn();
      runner.on('executableJSON', data);

      runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;

      const doTest = (out: stream$Readable) => {
        data.mockClear();

        // Emitting data through stdout should trigger sending JSON
        out.emit('data', 'Test results written to file');
        expect(data).toBeCalled();

        // And lets check what we emit
        const dataAtPath = readFileSync(runner.outputPath);
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
      expect(error).toBeCalled();
    });

    it('emits processExit when process exits', () => {
      const close = jest.fn();
      runner.on('processExit', close);
      fakeProcess.emit('exit', 0, null);
      expect(close).toBeCalledWith(0, null);
    });

    it('emits processExit when process close', () => {
      const close = jest.fn();
      runner.on('processClose', close);
      fakeProcess.emit('close', null, 'SIGKILL');
      expect(close).toBeCalledWith(null, 'SIGKILL');
    });

    it('support to-be-deprecated debuggerProcessExit when process closes and exits', () => {
      const close = jest.fn();
      runner.on('debuggerProcessExit', close);
      fakeProcess.emit('exit');
      expect(close).toBeCalledTimes(1);
      fakeProcess.emit('close');
      expect(close).toBeCalledTimes(2);
    });

    it('should start jest process after killing the old process', () => {
      runner.closeProcess();
      runner.start();

      expect(createProcess).toHaveBeenCalledTimes(2);
    });

    describe('stdout.on("data")', () => {
      it('should emit an "executableJSON" event with the "noTestsFound" meta data property set', () => {
        const listener = jest.fn();
        runner.on('executableJSON', listener);
        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        (runner: any).doResultsFollowNoTestsFoundMessage = jest.fn().mockReturnValueOnce(true);
        fakeProcess.stdout.emit('data', 'Test results written to file');

        expect(listener.mock.calls[0].length).toBe(2);
        expect(listener.mock.calls[0][1]).toEqual({noTestsFound: true});
      });

      it('should clear the message type history', () => {
        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        runner.prevMessageTypes.push(messageTypes.noTests);
        fakeProcess.stdout.emit('data', 'Test results written to file');

        expect(runner.prevMessageTypes.length).toBe(0);
      });
      it.each`
        msgType                     | eventType
        ${messageTypes.testResults} | ${'executableStdErr'}
        ${messageTypes.watchUsage}  | ${'executableStdErr'}
        ${messageTypes.noTests}     | ${'executableStdErr'}
        ${messageTypes.unknown}     | ${'executableOutput'}
      `('should always emit output event with type $msgType', ({msgType, eventType}) => {
        const stderrListener = jest.fn();
        const stdoutListener = jest.fn();
        const data = Buffer.from('whatever');
        const meta = {type: msgType};

        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        (runner: any).findMessageType = jest.fn().mockReturnValueOnce(msgType);

        runner.on('executableStdErr', stderrListener);
        runner.on('executableOutput', stdoutListener);
        fakeProcess.stdout.emit('data', data, meta);

        if (eventType === 'executableStdErr') {
          expect(stderrListener).toBeCalledWith(data, meta);
        } else {
          expect(stdoutListener).toBeCalledWith(data.toString());
        }
      });
    });

    describe('stderr.on("data")', () => {
      it('should identify the message type', () => {
        (runner: any).findMessageType = jest.fn();
        const expected = {};
        fakeProcess.stderr.emit('data', expected);

        expect(runner.findMessageType).toBeCalledWith(expected);
      });

      it('should add the type to the message type history when known', () => {
        (runner: any).findMessageType = jest.fn().mockReturnValueOnce(messageTypes.noTests);
        fakeProcess.stderr.emit('data', Buffer.from(''));

        expect(runner.prevMessageTypes).toEqual([messageTypes.noTests]);
      });

      it('should clear the message type history when the type is unknown', () => {
        (runner: any).findMessageType = jest.fn().mockReturnValueOnce(messageTypes.unknown);
        fakeProcess.stderr.emit('data', Buffer.from(''));

        expect(runner.prevMessageTypes).toEqual([]);
      });

      it.each`
        type
        ${messageTypes.testResults}
        ${messageTypes.watchUsage}
        ${messageTypes.noTests}
        ${messageTypes.unknown}
      `('should always emit an "executableStdErr" event with type $type', ({type}) => {
        const listener = jest.fn();
        const data = Buffer.from('');
        const meta = {type};

        runner.outputPath = `${fixtures}/failing-jsons/failing_jest_json.json`;
        (runner: any).findMessageType = jest.fn().mockReturnValueOnce(type);

        runner.on('executableStdErr', listener);
        fakeProcess.stderr.emit('data', data, meta);

        expect(listener).toBeCalledWith(data, meta);
      });

      it('should track when "No tests found related to files changed since the last commit" is received', () => {
        const data = Buffer.from(
          'No tests found related to files changed since last commit.\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        fakeProcess.stderr.emit('data', data);

        expect(runner.prevMessageTypes).toEqual([messageTypes.noTests]);
      });

      it('should track when "No tests found related to files changed since master" is received', () => {
        const data = Buffer.from(
          'No tests found related to files changed since "master".\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        fakeProcess.stderr.emit('data', data);

        expect(runner.prevMessageTypes).toEqual([messageTypes.noTests]);
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
        expect(runner.findMessageType(buf)).toBe(messageTypes.unknown);
      });

      it('should identify "No tests found related to files changed since last commit."', () => {
        const buf = Buffer.from(
          'No tests found related to files changed since last commit.\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        expect(runner.findMessageType(buf)).toBe(messageTypes.noTests);
      });

      it('should identify "No tests found related to files changed since git ref."', () => {
        const buf = Buffer.from(
          'No tests found related to files changed since "master".\n' +
            'Press `a` to run all tests, or run Jest with `--watchAll`.'
        );
        expect(runner.findMessageType(buf)).toBe(messageTypes.noTests);
      });

      it('should identify the "Watch Usage" prompt', () => {
        const buf = Buffer.from('\n\nWatch Usage\n...');
        expect(runner.findMessageType(buf)).toBe(messageTypes.watchUsage);
      });
      it('should prioritize message types accordingly.', () => {
        // testResults > noTests > watchUsage > unknown

        const testResults = 'Test results written to file\n';
        const noTests = 'No tests found related to files changed since "master".\n';
        const watchUsage = 'Press `a` to run all tests, or run Jest with `--watchAll`\n';
        const unknownMsg = 'whatever...\n';

        expect(runner.findMessageType(Buffer.from(noTests + testResults))).toBe(messageTypes.testResults);

        expect(runner.findMessageType(Buffer.from(noTests + watchUsage))).toBe(messageTypes.noTests);

        expect(runner.findMessageType(Buffer.from(noTests + watchUsage + testResults))).toBe(messageTypes.testResults);

        expect(runner.findMessageType(Buffer.from(unknownMsg + testResults))).toBe(messageTypes.testResults);
      });
    });

    describe('doResultsFollowNoTestsFoundMessage()', () => {
      it('should return true when the last message on stderr was "No tests found..."', () => {
        runner.prevMessageTypes.push(messageTypes.noTests);
        expect(runner.doResultsFollowNoTestsFoundMessage()).toBe(true);
      });

      it('should return true when the last two messages on stderr were "No tests found..." and "Watch Usage"', () => {
        runner.prevMessageTypes.push(messageTypes.noTests, messageTypes.watchUsage);
        expect(runner.doResultsFollowNoTestsFoundMessage()).toBe(true);
      });

      it('should return false otherwise', () => {
        runner.prevMessageTypes.length = 0;
        expect(runner.doResultsFollowNoTestsFoundMessage()).toBe(false);
      });
    });
    test('should always emit output', () => {});
  });
});
