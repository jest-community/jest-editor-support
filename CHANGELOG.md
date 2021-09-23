<!--

Please add your own contribution below inside the Master section
Bug-fixes within the same version aren't needed

## Master

-->

### 30.0.0
* added `shell` argument to workspace config to allow users override spawn() child_process default shell - @connectdotz (#79)
* remove `CI: true` env for spawned process, a better way to ensure non-watch mode run will be to explicitly add `--watchAll=false` jest option in the commadLine. - @connectdotz (#79)
* update most dependency to address security vulnerabilities - @connectdotz (#80)

### 29.0.0
* convert `parser-test.js` to a true jest test: `babel-parser.test.ts` and convert to typescript. - @connectdotz (#69)
* upgrade prettier and @babel/preset-typescript, fix lint errors. - @connectdotz (#69)
* adding lastProperty and nameType attributes to NamedNode - @connectdotz (#71)
* preserve test/describe block name argument instead of using a type-marker - @connectdotz (#71)
* remove JSX plugin for `.ts` files - @ehaynes99 @@gregoryzh (#75)
* upgrade lint-staged to address security vulnerability - @connectdotz (#76)
  
### 28.2.0
- Identify todo tests, which are distinct from pending/skip tests - @pmcelhaney (#61)
- split exit and close runner event for correct/finer control; provide better event types. - @connectdotz (#62)
- adding ability to pass explicit, extra arguments and node_env for runner process - @connectdotz (#63)
- fix snapshot parsing for flow and typescript files - @connectdotz (#63)
### 28.1.0

- make parser missing name a warning instead of error (#55) - @connectdotz
- clean up fixtures/parser_tests.js and add it for lint/prettier scripts. - @connectdotz
- Detect Tagged Template Literal version of describe.each and it.each - @TheSench
- Detect it when used with deep chain of modifiers (e.g. `test.concurrent.only.each(table)(name, fn)`) - @TheSench

### 28.0.0

- fix parser crash for return statement without argument. - @connectdotz
- upgrade dependency `danger` and address other vulnerable dependency issues.

### 28.0.0-beta.0

- Replace babylon and typescript parsers with @babel/parser 7.x - @firsttris
- Renamed the property `pathToJest` to `jestCommandLine` in the ProjectWorkspace configuration object to better convey how the property is used internally. Left the original `pathToJest` with a deprecated flag. - @rossknudsen
- expose fullName and ancestorTitles to assertions - @connectdotz
- fix parser regression: test.each is being ignored by parser - @connectdotz
- fix typescript parsing error - @connectdotz

### 27.2.0

- Address orphan process issue - @connectdotz

### 27.1.0

- Add `--reporters` option support - [@jmarceli](https://github.com/jmarceli)

### 27.0.0

- [breaking change] Replace the `Settings` class with a `getSettings` function - stephtr

  `getSettings` now simply returns a promise resolving to jest's config.

- Improved handling of quoted commands, arguments and escaped spaces - omjadas

### 26.0.0

- incorporate `jest-test-typescript-parser` into this package since it has been deprecated from the original `jest` reposition (#9) - connectdotz

  projects that link with this package no longer need to add `jest-test-typescript-parser` package separately. The newly exposed `parse` function can select the proper parser based on file extension.

- fix a few race condition errors in Runner (#9) - connectdotz

  - concurrent Runner output to the same hard coded output file: added optional 'outputFileSuffix' parameter.
  - jest process output parser sometimes failed to identify testResults message.

- `TestReconciler` will now report test locations from jest '--testLocationInResults' output

- Snapshot parsing error will no longer throw but returns empty result. (#9) - connectdotz

  Turning on the verbose will output caught exception for debugging purpose.

- upgrade to the latest jest version (24.7.x) - connectdotz

### 25.0.0

This is the first release that is de-coupled from the Jest release cycle. So,
in your head, consider this a 1.0 kinda thing.

- Updates the `jest-snapshot` dependency to an alpha build of jest 24.x

  This is because the codebase was migrated with Jest, and now uses functions
  from the master builds that don't seem to be available on the latest production
  versions of jest-snapshot/. If someone wants to backport this to the prod builds
  look at the usage of the `buildSnapshotResolver`

- Adds the ability to parse describe blocks - https://github.com/facebook/jest/pull/7215
