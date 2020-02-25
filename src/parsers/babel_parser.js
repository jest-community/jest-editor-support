/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {readFileSync} from 'fs';
import {File as BabelFile, Node as BabelNode} from '@babel/types';
import * as parser from '@babel/parser';
import type {ParsedNodeType} from './parser_nodes';
import {NamedBlock, ParsedRange, ParseResult, ParsedNode} from './parser_nodes';

const _getASTfor = (file: string, data: ?string, options: ?parser.ParserOptions): [BabelFile, string] => {
  const _data = data || readFileSync(file).toString();
  const config = {...options, sourceType: 'module'};
  return [parser.parse(_data, config), _data];
};

export const getASTfor = (file: string, data: ?string): BabelFile => {
  const [bFile] = _getASTfor(file, data);
  return bFile;
};

export const parse = (file: string, data: ?string, options: ?parser.ParserOptions): ParseResult => {
  const parseResult = new ParseResult(file);
  const [ast, _data] = _getASTfor(file, data, options);

  const updateNameInfo = (nBlock: NamedBlock, bNode: BabelNode) => {
    const arg = bNode.expression.arguments[0];
    let name = arg.value;

    if (!name && arg.type === 'TemplateLiteral') {
      name = _data.substring(arg.start + 1, arg.end - 1);
    }

    if (name == null) {
      throw new TypeError(`failed to update namedBlock from: ${JSON.stringify(bNode)}`);
    }
    nBlock.name = name;
    nBlock.nameRange = new ParsedRange(
      arg.loc.start.line,
      arg.loc.start.column + 2,
      arg.loc.end.line,
      arg.loc.end.column - 1
    );
  };
  const updateNode = (node: ParsedNode, babylonNode: BabelNode) => {
    node.start = babylonNode.loc.start;
    node.end = babylonNode.loc.end;
    node.start.column += 1;

    parseResult.addNode(node);
    if (node instanceof NamedBlock) {
      updateNameInfo(node, babylonNode);
    }
  };

  const isFunctionCall = node =>
    node && node.type === 'ExpressionStatement' && node.expression && node.expression.type === 'CallExpression';

  const isFunctionDeclaration = (nodeType: string) =>
    nodeType === 'ArrowFunctionExpression' || nodeType === 'FunctionExpression';

  // Pull out the name of a CallExpression (describe/it)
  // handle cases where it's a member expression (.only)
  const getNameForNode = node => {
    if (isFunctionCall(node) && node && node.expression && node.expression.callee) {
      return (
        node.expression.callee.name || (node.expression.callee.object ? node.expression.callee.object.name : undefined)
      );
    }
    return undefined;
  };

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  const isAnIt = node => {
    const name = getNameForNode(node);
    return name === 'it' || name === 'fit' || name === 'test';
  };

  const isAnDescribe = node => {
    const name = getNameForNode(node);
    return name === 'describe';
  };

  // When given a node in the AST, does this represent
  // the start of an expect expression?
  const isAnExpect = node => {
    if (!isFunctionCall(node)) {
      return false;
    }
    let name = '';
    let element = node && node.expression ? node.expression.callee : undefined;
    while (!name && element) {
      // eslint-disable-next-line prefer-destructuring
      name = element.name;
      // Because expect may have accessors tacked on (.to.be) or nothing
      // (expect()) we have to check multiple levels for the name
      element = element.object || element.callee;
    }
    return name === 'expect';
  };

  const addNode = (type: ParsedNodeType, parent: ParsedNode, babylonNode: BabelNode): ParsedNode => {
    const child = parent.addChild(type);
    updateNode(child, babylonNode);

    if (child instanceof NamedBlock && child.name == null) {
      // eslint-disable-next-line no-console
      console.warn(`block is missing name: ${JSON.stringify(babylonNode)}`);
    }
    return child;
  };

  // A recursive AST parser
  const searchNodes = (babylonParent: BabelNode, parent: ParsedNode) => {
    // Look through the node's children
    let child: ?ParsedNode;

    if (!babylonParent.body) {
      return;
    }

    babylonParent.body.forEach(element => {
      child = undefined;
      // Pull out the node
      // const element = babylonParent.body[node];

      if (isAnDescribe(element)) {
        child = addNode('describe', parent, element);
      } else if (isAnIt(element)) {
        child = addNode('it', parent, element);
      } else if (isAnExpect(element)) {
        child = addNode('expect', parent, element);
      } else if (element && element.type === 'VariableDeclaration') {
        element.declarations
          .filter(declaration => declaration.init && isFunctionDeclaration(declaration.init.type))
          .forEach(declaration => searchNodes(declaration.init.body, parent));
      } else if (
        element &&
        element.type === 'ExpressionStatement' &&
        element.expression &&
        element.expression.type === 'AssignmentExpression' &&
        element.expression.right &&
        isFunctionDeclaration(element.expression.right.type)
      ) {
        searchNodes(element.expression.right.body, parent);
      } else if (element.type === 'ReturnStatement' && element.argument.arguments) {
        element.argument.arguments
          .filter(argument => isFunctionDeclaration(argument.type))
          .forEach(argument => searchNodes(argument.body, parent));
      }

      if (isFunctionCall(element)) {
        element.expression.arguments
          .filter(argument => isFunctionDeclaration(argument.type))
          .forEach(argument => searchNodes(argument.body, child || parent));
      }
    });
  };

  const {program} = ast;
  searchNodes(program, parseResult.root);

  return parseResult;
};

export const plugins = [
  'jsx',
  'classProperties',
  'exportDefaultFrom',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'objectRestSpread',
  'optionalChaining',
  'topLevelAwait',
];

// Its not possible to use the parser with flow and typescript active at the same time
export const parseJs = (file: string, data: ?string, additionalPlugins: string[] = []): ParseResult =>
  parse(file, data, {plugins: [...plugins, ...additionalPlugins, 'flow']});
export const parseTs = (file: string, data: ?string, additionalPlugins: string[] = []): ParseResult =>
  parse(file, data, {plugins: [...plugins, ...additionalPlugins, 'typescript']});
