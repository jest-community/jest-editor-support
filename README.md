# jest-editor-support

[![Build Status](https://travis-ci.com/jest-community/jest-editor-support.svg?branch=master)](https://travis-ci.com/jest-community/jest-editor-support) 
[![Coverage Status](https://coveralls.io/repos/github/jest-community/jest-editor-support/badge.svg?branch=master)](https://coveralls.io/github/jest-community/jest-editor-support?branch=master)


The engine that allows editors to build on top of Jest.

## Usage

This is only useful if you are interested in building an editor integration for Jest.

For now as an end user, we'd recommend looking at either [vscode-jest](https://github.com/jest-community/vscode-jest/) or [majestic](https://github.com/Raathigesh/majestic/).

## API

parse(filePath: string, serializedData?: string, strictMode?: boolean = false)

parse is a static jest parser which uses babel 7 and supports js,jsx,ts,tsx,mjs files.   
Here is a [list](https://github.com/jest-community/jest-editor-support/blob/master/src/parsers/babel_parser.js#L174) of [The ECMAScript Proposal](https://babeljs.io/docs/en/babel-parser#ecmascript-proposals-https-githubcom-babel-proposals) plugins the parser has activated.

- filePath = Path to the file you want to parse
- serializedData = Serialized data, will be used instead of the filePath if available (optional)
- strictMode = If this option is activated the parser throws an exception if the filetype is not detected, defaults to false (optional)

## Note

Since version `18.2.0` TypeScript is now a peer dependency. If you don't need to handle `.tsx` files then you can safely ignore the warning during installation.
