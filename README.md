# jest-editor-support

[![Build Status](https://travis-ci.com/jest-community/jest-editor-support.svg?branch=master)](https://travis-ci.com/jest-community/jest-editor-support) 
[![Coverage Status](https://coveralls.io/repos/github/jest-community/jest-editor-support/badge.svg?branch=master)](https://coveralls.io/github/jest-community/jest-editor-support?branch=master)


The engine that allows editors to build on top of Jest.

## Usage

This is only useful if you are interested in building an editor integration for Jest.

For now as an end user, we'd recommend looking at either [vscode-jest](https://github.com/jest-community/vscode-jest/), [vscode-jest-runner](https://github.com/firsttris/vscode-jest-runner) or [majestic](https://github.com/Raathigesh/majestic/).

## API
```
parse(   
  filePath: string,   
  serializedData?: string,   
  strictMode: boolean = false,   
  additionalPlugins?: stirng[]   
)
```
Parse is a static Jest parser which uses Babel 7 and supports js,jsx,ts,tsx,mjs files.   

- filePath = Path to the file you want to parse.
- serializedData = Serialized data, will be used instead of the filePath if available (optional).
- strictMode = If this option is activated the parser throws an exception if the filetype is not detected, defaults to false.
- additionalPlugins = List of ECMAScript proposal [plugins](https://babeljs.io/docs/en/babel-parser#ecmascript-proposals-https-githubcom-babel-proposals). Pass an array of strings e.g. ```['dynamicImport']```. Please have a look at the list of [plugins](https://github.com/jest-community/jest-editor-support/blob/master/src/parsers/babel_parser.js#L174) activated by default.

## Note

Since version `18.2.0` TypeScript is now a peer dependency. If you don't need to handle `.tsx` files then you can safely ignore the warning during installation.
