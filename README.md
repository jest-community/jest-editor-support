# jest-editor-support

[![Build Status](https://github.com/jest-community/jest-editor-support/actions/workflows/node-ci.yml/badge.svg)](https://github.com/jest-community/jest-editor-support/actions) [![Coverage Status](https://coveralls.io/repos/github/jest-community/jest-editor-support/badge.svg?branch=master)](https://coveralls.io/github/jest-community/jest-editor-support?branch=master) [![npm version](https://badge.fury.io/js/jest-editor-support.svg)](https://badge.fury.io/js/jest-editor-support)


The engine that allows editors to build on top of Jest.

## Usage

This is only useful if you are interested in building an editor integration for Jest.

## API
```ts
parse(   
  filePath: string,   
  serializedData?: string,   
  options?: JESParserOptions
);

JESParserOptions = 
{
    plugins?: JESParserPluginOptions;
    strictMode?: boolean;
};

JESParserPluginOptions = 
{
  decorators?: 'legacy' | {
    decoratorsBeforeExport?: boolean;
    allowCallParenthesized?: boolean;
  }
}
```

Parse is a static Jest parser which uses Babel 7 and supports js,jsx,mjs,ts,tsx files.   

[Supported ECMAScript proposals](https://github.com/babel/babel/blob/928b9f8c9518284eac6d0598633f2ec373fc6d0c/packages/babel-parser/typings/babel-parser.d.ts#L97)

- filePath = Path to the file you want to parse.
- serializedData = Serialized data, will be used instead of the filePath if available (optional).
- options: 
  - strictMode = If this option is activated the parser throws an exception if the filetype is not detected, defaults to false.
  - pluginOptions = allow override for selected [plugins](https://babeljs.io/docs/en/babel-parser#plugins) options. Currently only support `decorators`. 

examples:
```ts
parse('test.spec.ts');
parse('parameterDecorators.spec.ts', undefined, {plugins: {decorators: 'legacy'}})
parse('parameterDecorators.spec.ts', undefined, 
  {plugins: 
    {decorators: 
      {decoratorsBeforeExport: false}
    }
  })
```

## Note

Since version `18.2.0` TypeScript is now a peer dependency. If you don't need to handle `.tsx` files then you can safely ignore the warning during installation.
