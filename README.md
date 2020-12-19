# jest-editor-support

[![Build Status](https://travis-ci.com/jest-community/jest-editor-support.svg?branch=master)](https://travis-ci.com/jest-community/jest-editor-support) [![Coverage Status](https://coveralls.io/repos/github/jest-community/jest-editor-support/badge.svg?branch=master)](https://coveralls.io/github/jest-community/jest-editor-support?branch=master) [![npm version](https://badge.fury.io/js/jest-editor-support.svg)](https://badge.fury.io/js/jest-editor-support)


The engine that allows editors to build on top of Jest.

## Usage

This is only useful if you are interested in building an editor integration for Jest.

## API
```
parse(   
  filePath: string,   
  serializedData?: string,   
  strictMode: boolean = false,     
)
```
Parse is a static Jest parser which uses Babel 7 and supports js,jsx,mjs,ts,tsx files.   

[Supported ECMAScript proposals](https://github.com/babel/babel/blob/928b9f8c9518284eac6d0598633f2ec373fc6d0c/packages/babel-parser/typings/babel-parser.d.ts#L97)

- filePath = Path to the file you want to parse.
- serializedData = Serialized data, will be used instead of the filePath if available (optional).
- strictMode = If this option is activated the parser throws an exception if the filetype is not detected, defaults to false.


## Note

Since version `18.2.0` TypeScript is now a peer dependency. If you don't need to handle `.tsx` files then you can safely ignore the warning during installation.
