/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import {ChildProcess} from 'child_process';
import {Config as JestConfig} from '@jest/types';
import { CoverageMapData } from 'istanbul-lib-coverage';
import ProjectWorkspace, {ProjectWorkspaceConfig, createProjectWorkspace,  LoginShell } from './build/project_workspace';
import {SourceLocation} from '@babel/types';
import {JESParserPluginOptions, JESParserOptions} from './build/parsers/helper';
export {JESParserPluginOptions, JESParserOptions, createProjectWorkspace, ProjectWorkspaceConfig, ProjectWorkspace, LoginShell};
export interface RunArgs {
  args: string[];
  replace?: boolean; // default is false
  skipConversion?: boolean, // if true, args will not go through any conversion, such as dashed arg conversion.
}
export type SnapshotData = Record<string, string>;
export interface Options {
  createProcess?: (
    workspace: ProjectWorkspace,
    args: string[],
  ) => ChildProcess;
  noColor?: boolean;
  testNamePattern?: string;
  testFileNamePattern?: string;
  reporters?: string[];
  /** either to append or replace the Runner process arguments */
  args?: RunArgs;
}

export type RunnerEvent = 'processClose' | 'processExit' | 'executableJSON' | 'executableStdErr' | 'executableOutput' | 'terminalError';
export type DeprecatedRunnerEvent = 'debuggerProcessExit';
export class Runner extends EventEmitter {
  constructor(workspace: ProjectWorkspace, options?: Options);
  watchMode: boolean;
  watchAll: boolean;
  start(watchMode?: boolean, watchAll?: boolean): void;
  closeProcess(): void;
  runJestWithUpdateForSnapshots(completion: () => void, args?: string[]): void;
  on:(event: RunnerEvent|DeprecatedRunnerEvent, listener: (...args: any[]) => void) => this;
}

export interface JestSettings {
  jestVersionMajor: number;
  configs: JestConfig.ProjectConfig[];
}

export function getSettings(workspace: ProjectWorkspace, options?: Options): Promise<JestSettings>;
export interface IParseResults {
  describeBlocks: Array<DescribeBlock>;
  expects: Array<Expect>;
  itBlocks: Array<ItBlock>;
  root: ParsedNode;
  file: string;
}

export function parse(file: string, data?: string, options?: JESParserOptions): IParseResults;
export interface Location {
  column: number;
  line: number;
}

export class ParsedRange {
  start: Location;
  end: Location;
  constructor(
    startLine: number,
    startCol: number,
    endLine: number,
    endCol: number,
  );
}

export enum ParsedNodeTypes {
  it = 'it',
  describe = 'describe',
  expect = 'expect',
  root = 'root',
}

export type ParsedNodeType = ParsedNodeTypes;

export declare class ParsedNode {
  type: ParsedNodeType;
  start: Location;
  end: Location;
  file: string;
  children?: ParsedNode[];

  constructor(type: ParsedNodeType, file: string);
  filter(f: (parsedNode: ParsedNode) => boolean): Array<ParsedNode>;
  addChild(type: ParsedNodeType): ParsedNode;
}
export declare class NamedBlock extends ParsedNode {
  name: string;
  nameRange: ParsedRange;
  lastProperty?: string;
  /**
   * type of the name, it's the babel Node["type"], such as "Literal", "TemplateLiteral" etc
   *
   * TODO babel parser currently returns "Literal" for the it/describe name argument, which is not part of its "type" definition, therefore declare a string type for now until it is fixed in babel.
   * */
  nameType?: string;
  constructor(type: ParsedNodeType, file: string, name?: string);
}

export declare class ItBlock extends NamedBlock {
  constructor(file: string, name?: string);
}
export declare class DescribeBlock extends NamedBlock {
  constructor(file: string, name?: string);
}

export declare class Expect extends ParsedNode {
  constructor(file: string);
}

export class TestReconciler {
  stateForTestFile(file: string): TestReconcilationState;
  assertionsForTestFile(file: string): TestAssertionStatus[] | null;
  stateForTestAssertion(
    file: string,
    name: string,
  ): TestFileAssertionStatus | null;
  updateFileWithJestStatus(data: any): TestFileAssertionStatus[];
  removeTestFile(fileName: string): void;
}

/**
 *  Did the thing pass, fail or was it not run?
 */
export type TestReconcilationState =
  | 'Unknown' // The file has not changed, so the watcher didn't hit it
  | 'KnownFail' // Definitely failed
  | 'KnownSuccess' // Definitely passed
  | 'KnownSkip' // Definitely skipped (it.skip)
  | 'KnownTodo'; // Definitely todo (it.todo)


/**
 * The Jest Extension's version of a status for
 * whether the file passed or not
 *
 */
export interface TestFileAssertionStatus {
  file: string;
  message: string;
  status: TestReconcilationState;
  assertions: Array<TestAssertionStatus> | null;
}

/**
 * The Jest Extension's version of a status for
 * individual assertion fails
 *
 */
export interface TestAssertionStatus {
  title: string;
  fullName: string;
  ancestorTitles: string[];
  status: TestReconcilationState;
  message: string;
  shortMessage?: string;
  terseMessage?: string;
  location?: Location;
  line?: number;
}

export interface JestFileResults {
  name: string;
  summary: string;
  message: string;
  status: 'failed' | 'passed';
  startTime: number;
  endTime: number;
  assertionResults: Array<JestAssertionResults>;
}

export interface JestAssertionResults {
  name: string;
  title: string;
  status: 'failed' | 'passed';
  failureMessages: string[];
  fullName: string;
}

export interface JestTotalResults {
  success: boolean;
  startTime: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  numRuntimeErrorTestSuites: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  coverageMap?: CoverageMapData;
  testResults: Array<JestFileResults>;
}

export interface JestTotalResultsMeta {
  noTestsFound: boolean;
}

export enum messageTypes {
  noTests = 1,
  testResults = 3,
  unknown = 0,
  watchUsage = 2,
}

export type MessageType = number;

export interface SnapshotMetadata {
  exists: boolean;
  name: string;
  node: {
    loc: ParsedNode;
  };
  content?: string;
}

export interface SnapshotNode{
  name: string;
  loc: SourceLocation;
}
export interface SnapshotBlock{
  node: SnapshotNode;
  parents: SnapshotNode[];
} 
export interface SnapshotParserOptions {
  verbose?: boolean;
  // $FlowIgnore[value-as-type]
  parserOptions?: JESParserOptions;
}
export class Snapshot {
  constructor(parser?: any, customMatchers?: string[]);
  getMetadata(filepath: string, options?: SnapshotParserOptions): SnapshotMetadata[];
  getMetadataAsync(filePath: string, options?: SnapshotParserOptions): Promise<Array<SnapshotMetadata>>; 
  parse(filePath: string, options?: SnapshotParserOptions): SnapshotBlock[];
  getSnapshotContent(filePath: string, name: string | RegExp): Promise<string | SnapshotData | undefined>; 
}

type FormattedTestResults = {
  testResults: TestResult[]
}

type TestResult = {
  name: string
}
