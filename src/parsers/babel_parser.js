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
import {parseOptions} from './helper';

export const UNRESOLVED_FUNCTION_NAME = '__function__';
export const UNSUPPORTED_TEST_NAME = '__unsupported__';

const _getASTfor = (file: string, data: ?string, options: ?parser.ParserOptions): [BabelFile, string] => {
  const _data = data || readFileSync(file).toString();
  const config = {...options, sourceType: 'module'};
  return [parser.parse(_data, config), _data];
};

export const getASTfor = (file: string, data: ?string): BabelFile => {
  const [bFile] = _getASTfor(file, data, parseOptions(file));
  return bFile;
};

export const parse = (file: string, data: ?string, options: ?parser.ParserOptions): ParseResult => {
  const parseResult = new ParseResult(file);
  const [ast, _data] = _getASTfor(file, data, options);

  const deepGet = (node, ...types: string[]) =>
    types.reduce<BabelNode>((rootForType, type) => {
      while (rootForType[type]) {
        rootForType = rootForType[type];
      }
      return rootForType;
    }, node);

  const updateNameInfo = (nBlock: NamedBlock, bNode: BabelNode) => {
    const arg = bNode.expression.arguments[0];
    let name = arg.value;

    if (!name) {
      switch (arg.type) {
        case 'TemplateLiteral':
          name = _data.substring(arg.start + 1, arg.end - 1);
          break;
        case 'CallExpression':
          // a dynamic function: use a placeholder
          name = UNRESOLVED_FUNCTION_NAME;
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(`failed to extract name for type "${arg.type}" in node:`, bNode);
          name = UNSUPPORTED_TEST_NAME;
          break;
      }
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

  const isFunctionCall = (node) =>
    node && node.type === 'ExpressionStatement' && node.expression && node.expression.type === 'CallExpression';

  const isFunctionDeclaration = (nodeType: string) =>
    nodeType === 'ArrowFunctionExpression' || nodeType === 'FunctionExpression';

  // Pull out the name of a CallExpression (describe/it)
  const getNameForNode = (node) => {
    if (isFunctionCall(node) && node.expression.callee) {
      // Get root callee in case it's a chain of higher-order functions (e.g. .each(table)(name, fn))
      const rootCallee = deepGet(node.expression, 'callee');
      const name =
        rootCallee.name ||
        // handle cases where it's a member expression (e.g .only or .concurrent.only)
        deepGet(rootCallee, 'object').name ||
        // handle cases where it's part of a tag (e.g. .each`table`)
        deepGet(rootCallee, 'tag', 'object').name;

      return name;
    }
    return undefined;
  };

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  const isAnIt = (node) => {
    const name = getNameForNode(node);
    return name === 'it' || name === 'fit' || name === 'test';
  };

  const isAnDescribe = (node) => {
    const name = getNameForNode(node);
    return name === 'describe';
  };

  // When given a node in the AST, does this represent
  // the start of an expect expression?
  const isAnExpect = (node) => {
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

    if (!babylonParent.body || !Array.isArray(babylonParent.body)) {
      return;
    }

    babylonParent.body.forEach((element) => {
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
          .filter((declaration) => declaration.init && isFunctionDeclaration(declaration.init.type))
          .forEach((declaration) => searchNodes(declaration.init.body, parent));
      } else if (
        element &&
        element.type === 'ExpressionStatement' &&
        element.expression &&
        element.expression.type === 'AssignmentExpression' &&
        element.expression.right &&
        isFunctionDeclaration(element.expression.right.type)
      ) {
        searchNodes(element.expression.right.body, parent);
      } else if (element.type === 'ReturnStatement' && element.argument?.arguments) {
        element.argument.arguments
          .filter((argument) => isFunctionDeclaration(argument.type))
          .forEach((argument) => searchNodes(argument.body, parent));
      }

      if (isFunctionCall(element)) {
        element.expression.arguments
          .filter((argument) => isFunctionDeclaration(argument.type))
          .forEach((argument) => searchNodes(argument.body, child || parent));
      }
    });
  };

  const {program} = ast;
  searchNodes(program, parseResult.root);

  return parseResult;
};
