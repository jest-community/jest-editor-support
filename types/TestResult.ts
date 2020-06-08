/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// import type {ConsoleBuffer} from './Console';

export type RawFileCoverage = {
  path: string;
  s: {[statementId: number]: number};
  b: {[branchId: number]: number};
  f: {[functionId: number]: number};
  l: {[lineId: number]: number};
  fnMap: {[functionId: number]: any};
  statementMap: {[statementId: number]: any};
  branchMap: {[branchId: number]: any};
  inputSourceMap?: Record<string, any>;
};

export type RawCoverage = {
  [filePath: string]: RawFileCoverage;
};

type FileCoverageTotal = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

export type CoverageSummary = {
  lines: FileCoverageTotal;
  statements: FileCoverageTotal;
  branches: FileCoverageTotal;
  functions: FileCoverageTotal;
  merge: (other: CoverageSummary) => void;
};

export type FileCoverage = {
  getLineCoverage: () => Record<string, any>;
  getUncoveredLines: () => number[];
  getBranchCoverageByLine: () => Record<string, any>;
  toJSON: () => Record<string, any>;
  merge: (other: Record<string, any>) => void;
  computeSimpleTotals: (property: string) => FileCoverageTotal;
  computeBranchTotals: () => FileCoverageTotal;
  resetHits: () => void;
  toSummary: () => CoverageSummary;
};

export type CoverageMap = {
  merge: (data: Record<string, any>) => void;
  getCoverageSummary: () => FileCoverage;
  data: RawCoverage;
  addFileCoverage: (fileCoverage: RawFileCoverage) => void;
  files: () => string[];
  fileCoverageFor: (file: string) => FileCoverage;
};

export type SerializableError = {
  code?: unknown;
  message: string;
  stack?: string;
  type?: string;
};

export type FailedAssertion = {
  matcherName: string;
  message?: string;
  actual?: any;
  pass?: boolean;
  expected?: any;
  isNot?: boolean;
  stack?: string;
};

export type AssertionLocation = {
  fullName: string;
  path: string;
};

export type Status = 'passed' | 'failed' | 'skipped' | 'pending' | 'todo';

export type Bytes = number;
export type Milliseconds = number;

type Callsite = {
  column: number;
  line: number;
};

export type AssertionResult = {
  ancestorTitles: string[];
  duration?: Milliseconds;
  failureMessages: string[];
  fullName: string;
  location?: Callsite;
  numPassingAsserts: number;
  status: Status;
  title: string;
};

export type FormattedAssertionResult = {
  failureMessages: string[] | null;
  fullName: string;
  ancestorTitles: string[];
  location?: Callsite;
  status: Status;
  title: string;
};

export type AggregatedResultWithoutCoverage = {
  numFailedTests: number;
  numFailedTestSuites: number;
  numPassedTests: number;
  numPassedTestSuites: number;
  numPendingTests: number;
  numTodoTests: number;
  numPendingTestSuites: number;
  numRuntimeErrorTestSuites: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  openHandles: Error[];
  snapshot: SnapshotSummary;
  startTime: number;
  success: boolean;
  testResults: TestResult[];
  wasInterrupted: boolean;
};

export type AggregatedResult = AggregatedResultWithoutCoverage & {
  coverageMap?: CoverageMap;
};

export type Suite = {
  title: string;
  suites: Suite[];
  tests: AssertionResult[];
};

export type TestResult = {
  // console: ?ConsoleBuffer,
  coverage?: RawCoverage;
  displayName?: string;
  failureMessage?: string;
  leaks: boolean;
  memoryUsage?: Bytes;
  numFailingTests: number;
  numPassingTests: number;
  numPendingTests: number;
  numTodoTests: number;
  openHandles: Error[];
  perfStats: {
    end: Milliseconds;
    start: Milliseconds;
  };
  skipped: boolean;
  snapshot: {
    added: number;
    fileDeleted: boolean;
    matched: number;
    unchecked: number;
    uncheckedKeys: string[];
    unmatched: number;
    updated: number;
  };
  sourceMaps: {[sourcePath: string]: string};
  testExecError?: SerializableError;
  testFilePath: string;
  testResults: AssertionResult[];
};

export type FormattedTestResult = {
  message: string;
  name: string;
  summary: string;
  status: 'failed' | 'passed';
  startTime: number;
  endTime: number;
  coverage: any;
  assertionResults: FormattedAssertionResult[];
};

export type FormattedTestResults = {
  coverageMap?: CoverageMap;
  numFailedTests: number;
  numFailedTestSuites: number;
  numPassedTests: number;
  numPassedTestSuites: number;
  numPendingTests: number;
  numPendingTestSuites: number;
  numRuntimeErrorTestSuites: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  snapshot: SnapshotSummary;
  startTime: number;
  success: boolean;
  testResults: FormattedTestResult[];
  wasInterrupted: boolean;
};

export type CodeCoverageReporter = any;

export type CodeCoverageFormatter = (coverage?: RawCoverage, reporter?: CodeCoverageReporter) => any;

export type UncheckedSnapshot = {
  filePath: string;
  keys: string[];
};

export type SnapshotSummary = {
  added: number;
  didUpdate: boolean;
  failure: boolean;
  filesAdded: number;
  filesRemoved: number;
  filesUnmatched: number;
  filesUpdated: number;
  matched: number;
  total: number;
  unchecked: number;
  uncheckedKeysByFile: UncheckedSnapshot[];
  unmatched: number;
  updated: number;
};
