/* eslint-disable class-methods-use-this */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import type {TestFileAssertionStatus, TestAssertionStatus, TestReconciliationState, Location} from './types';

import type {FormattedTestResults} from '@jest/test-result';

export type FormattedTestResult = FormattedTestResults['testResults'][number];
export type FormattedAssertionResult = FormattedTestResult['assertionResults'][number];

/**
 *  You have a Jest test runner watching for changes, and you have
 *  an extension that wants to know where to show errors after file parsing.
 *
 *  This class represents the state between runs, keeping track of passes/fails
 *  at a file level, generating useful error messages and providing a nice API.
 */
export default class TestReconciler {
  fileStatuses: {[key: string]: TestFileAssertionStatus};

  constructor() {
    this.fileStatuses = {};
  }

  // the processed test results will be returned immediately instead of saved in
  // instance properties. This is 1) to prevent race condition 2) the data is already
  // stored in the this.fileStatuses, no dup is better 3) client will most likely need to process
  // all the results anyway.
  updateFileWithJestStatus(results: FormattedTestResults): TestFileAssertionStatus[] {
    // Loop through all files inside the report from Jest
    const statusList: TestFileAssertionStatus[] = [];
    results.testResults.forEach((file) => {
      // Did the file pass/fail?
      const status = this.statusToReconcilationState(file.status);
      // Create our own simpler representation
      const fileStatus: TestFileAssertionStatus = {
        assertions: this.mapAssertions(file.name, file.assertionResults),
        file: file.name,
        message: file.message,
        status,
      };
      this.fileStatuses[file.name] = fileStatus;
      statusList.push(fileStatus);
    });
    return statusList;
  }

  /**
   * remove jest status of the test file from the cached results
   * @param {string} fileName
   */
  removeTestFile(fileName: string) {
    delete this.fileStatuses[fileName];
  }

  // A failed test also contains the stack trace for an `expect`
  // we don't get this as structured data, but what we get
  // is useful enough to make it for ourselves

  mapAssertions(filename: string, assertions: Array<FormattedAssertionResult>): Array<TestAssertionStatus> {
    // convert jest location (column is 0-based and line is 1-based) to all 0-based location used internally in this package
    /* eslint-disable no-param-reassign */
    const convertJestLocation = (jestLocation?: Location) => {
      if (jestLocation) {
        jestLocation.line -= 1;
      }
      return jestLocation;
    };
    // Is it jest < 17? e.g. Before I added this to the JSON
    if (!assertions) {
      return [];
    }

    // Change all failing assertions into structured data
    return assertions.map((assertion) => {
      // Failure messages seems to always be an array of one item
      const message = assertion.failureMessages && assertion.failureMessages[0];
      let short = undefined;
      let terse = undefined;
      let line = undefined;
      const location = convertJestLocation(assertion.location ?? undefined); // output from jest --testLocationInResults (https://jestjs.io/docs/en/cli#testlocationinresults)
      if (message) {
        // Just the first line, with little whitespace
        short = message.split('   at', 1)[0].trim();
        // this will show inline, so we want to show very little
        terse = this.sanitizeShortErrorMessage(short);
        line = this.lineOfError(message, filename);
      }
      return {
        line,
        message: message || '',
        shortMessage: short,
        status: this.statusToReconcilationState(assertion.status),
        terseMessage: terse,
        title: assertion.title,
        location,
        fullName: assertion.fullName,
        ancestorTitles: assertion.ancestorTitles,
      };
    });
  }

  // Do everything we can to try make a one-liner from the error report
  sanitizeShortErrorMessage(string: string): string {
    if (string.includes('does not match stored snapshot')) {
      return 'Snapshot has changed';
    }

    if (string.includes('New snapshot was not written')) {
      return 'New snapshot is ready to write';
    }

    return string
      .split('\n')
      .splice(2)
      .join('')
      .replace(/\s\s+/g, ' ')
      .replace('Received:', ', Received:')
      .split('Difference:')[0];
  }

  // Pull the line out from the stack trace
  lineOfError(message: string, filePath: string): number | undefined {
    const filename = path.basename(filePath);
    const restOfTrace = message.split(filename, 2)[1];
    return restOfTrace ? parseInt(restOfTrace.split(':')[1], 10) : undefined;
  }

  statusToReconcilationState(status: string): TestReconciliationState {
    switch (status) {
      case 'passed':
        return 'KnownSuccess';
      case 'failed':
        return 'KnownFail';
      case 'pending':
        return 'KnownSkip';
      case 'todo':
        return 'KnownTodo';
      default:
        return 'Unknown';
    }
  }

  stateForTestFile(file: string): TestReconciliationState {
    const results = this.fileStatuses[file];
    if (!results) {
      return 'Unknown';
    }
    return results.status;
  }

  assertionsForTestFile(file: string): TestAssertionStatus[] | null {
    const results = this.fileStatuses[file];
    return results ? results.assertions : null;
  }

  stateForTestAssertion(file: string, name: string): TestAssertionStatus | null {
    const results = this.fileStatuses[file];
    if (!results || !results.assertions) {
      return null;
    }
    const assertion = results.assertions.find((a) => a.title === name);
    if (!assertion) {
      return null;
    }
    return assertion;
  }
}
