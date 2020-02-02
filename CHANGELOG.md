<!--

Please add your own contribution below inside the Master section
Bug-fixes within the same version aren't needed

## Master

-->

### 27.1.1
* replace babylon and typescript parser with @babel/parser 7.x
## Master
* Replace babylon and typescript parsers with @babel/parser 7.x

### 27.1.0
* Add `--reporters` option support - [@jmarceli](https://github.com/jmarceli)

### 27.0.0
* [breaking change] Replace the `Settings` class with a `getSettings` function - stephtr

  `getSettings` now simply returns a promise resolving to jest's config.

* Improved handling of quoted commands, arguments and escaped spaces - omjadas

### 26.0.0
* incorporate `jest-test-typescript-parser` into this package since it has been deprecated from the original `jest` reposition (#9) - connectdotz

  projects that link with this package no longer need to add `jest-test-typescript-parser` package separately. The newly exposed `parse` function can select the proper parser based on file extension.

* fix a few race condition errors in Runner (#9) - connectdotz
  - concurrent Runner output to the same hard coded output file: added optional 'outputFileSuffix' parameter. 
  - jest process output parser sometimes failed to identify testResults message.

* `TestReconciler` will now report test locations from jest '--testLocationInResults' output

* Snapshot parsing error will no longer throw but returns empty result. (#9) - connectdotz

  Turning on the verbose will output caught exception for debugging purpose.

* upgrade to the latest jest version (24.7.x) - connectdotz

### 25.0.0

This is the first release that is de-coupled from the Jest release cycle. So,
in your head, consider this a 1.0 kinda thing.

- Updates the `jest-snapshot` dependency to an alpha build of jest 24.x

  This is because the codebase was migrated with Jest, and now uses functions
  from the master builds that don't seem to be available on the latest production
  versions of jest-snapshot/. If someone wants to backport this to the prod builds 
  look at the usage of the `buildSnapshotResolver`

- Adds the ability to parse describe blocks - https://github.com/facebook/jest/pull/7215
