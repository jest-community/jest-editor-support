/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {readFileSync} from 'fs';
// import {File as t.File, Node as t.Node} from '@babel/types';
import * as t from '@babel/types';
import * as parser from '@babel/parser';
import {ParsedNodeType} from './parser_nodes';
import {NamedBlock, ParsedRange, ParseResult, ParsedNode} from './parser_nodes';
import {parseOptions, JESParserOptions, shallowAttr, getCallExpression, getNameForNode} from './helper';

const _getASTfor = (file: string, data?: string, options?: parser.ParserOptions): [t.File, string] => {
  const _data = data || readFileSync(file).toString();
  const config: parser.ParserOptions = {...(options || {}), sourceType: 'module'};
  return [parser.parse(_data, config), _data];
};

export const getASTfor = (file: string, data?: string, options?: JESParserOptions): t.File => {
  const [bFile] = _getASTfor(file, data, parseOptions(file, options));
  return bFile;
};

const isFunctionExpression = (node: t.Node): node is t.ArrowFunctionExpression | t.FunctionExpression =>
  t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);

export const parse = (file: string, data?: string, options?: parser.ParserOptions): ParseResult => {
  const parseResult = new ParseResult(file);
  const [ast, _data] = _getASTfor(file, data, options);

  const updateNameInfo = (nBlock: NamedBlock, bNode: t.Node, lastProperty?: string) => {
    if (!t.isExpressionStatement(bNode) || !t.isCallExpression(bNode.expression)) {
      throw new Error(`Expected an ExpressionStatement with CallExpression but got: ${JSON.stringify(bNode)}`);
    }
    const arg = bNode.expression.arguments[0];
    let name = (arg as any).value;

    if (!name) {
      if (arg.start && arg.end) {
        switch (arg.type) {
          case 'TemplateLiteral':
            name = _data.substring(arg.start + 1, arg.end - 1);
            break;
          default:
            name = _data.substring(arg.start, arg.end);
            break;
        }
      } else {
        console.warn(`Unable to find name start/end position: ${JSON.stringify(arg)}`);
      }
    }

    nBlock.name = name;
    nBlock.nameType = arg.type;
    nBlock.lastProperty = lastProperty;
    if (arg.loc) {
      nBlock.nameRange = new ParsedRange(
        arg.loc.start.line,
        arg.loc.start.column + 2,
        arg.loc.end.line,
        arg.loc.end.column - 1
      );
    }
  };

  const updateNode = (node: ParsedNode, babelNode: t.Node, lastProperty?: string) => {
    node.start = babelNode.loc?.start;
    node.end = babelNode.loc?.end;
    if (node.start) {
      node.start.column += 1;
    }

    parseResult.addNode(node);
    if (node instanceof NamedBlock) {
      updateNameInfo(node, babelNode, lastProperty);
    }
  };

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  const isAnIt = (name?: string) => {
    return name === 'it' || name === 'fit' || name === 'test';
  };

  const isAnDescribe = (name?: string) => {
    return name === 'describe';
  };

  // When given a node in the AST, does this represent
  // the start of an expect expression?
  const isAnExpect = (node: t.Node) => {
    const expression = getCallExpression(node);
    if (!expression) {
      return false;
    }
    let name = '';
    let element: any = expression.callee;
    while (!name && element) {
      name = element.name;
      // Because expect may have accessors tacked on (.to.be) or nothing
      // (expect()) we have to check multiple levels for the name
      element = element.object || element.callee;
    }
    return name === 'expect';
  };

  const addNode = (
    type: ParsedNodeType,
    parent: ParsedNode,
    babylonNode: t.Node,
    lastProperty?: string
  ): ParsedNode => {
    const child = parent.addChild(type);
    updateNode(child, babylonNode, lastProperty);

    if (child instanceof NamedBlock && child.name == null) {
      // eslint-disable-next-line no-console
      console.warn(`block is missing name: ${JSON.stringify(babylonNode)}`);
    }
    return child;
  };

  // A recursive AST parser
  const searchNodes = (parentNode: t.Node | undefined, parentParsedNode: ParsedNode) => {
    if (!parentNode) {
      return;
    }

    const body = shallowAttr(parentNode, 'body');
    if (!body || !Array.isArray(body)) {
      return;
    }

    // Look through the node's children
    let child: ParsedNode | undefined;

    body.forEach((element: t.Node) => {
      child = undefined;
      // Pull out the node

      const [name, lastProperty] = getNameForNode(element);
      if (isAnDescribe(name)) {
        child = addNode(ParsedNodeType.describe, parentParsedNode, element, lastProperty);
      } else if (isAnIt(name)) {
        child = addNode(ParsedNodeType.it, parentParsedNode, element, lastProperty);
      } else if (isAnExpect(element)) {
        child = addNode(ParsedNodeType.expect, parentParsedNode, element);
      } else if (t.isVariableDeclaration(element)) {
        element.declarations
          .filter((declaration) => {
            const ret = declaration.init && isFunctionExpression(declaration.init);
            return ret;
          })
          .forEach((declaration) => {
            const ret = searchNodes(shallowAttr(declaration, 'init', 'body'), parentParsedNode);
            return ret;
          });
      } else if (
        t.isExpressionStatement(element) &&
        t.isAssignmentExpression(element.expression) &&
        isFunctionExpression(element.expression.right)
      ) {
        const body = shallowAttr(element.expression, 'right', 'body');
        searchNodes(body, parentParsedNode);
      } else if (t.isReturnStatement(element)) {
        const args = shallowAttr<t.Node[]>(element.argument, 'arguments');
        if (args && Array.isArray(args)) {
          args
            .filter((arg) => isFunctionExpression(arg))
            .forEach((argument: t.Node) => searchNodes(shallowAttr(argument, 'body'), parentParsedNode));
        }
      }

      const expression = getCallExpression(element);

      if (expression) {
        expression.arguments.forEach((argument) =>
          searchNodes(shallowAttr(argument, 'body'), child ?? parentParsedNode)
        );
      }
    });
  };

  const {program} = ast;
  searchNodes(program, parseResult.root);

  return parseResult;
};
