/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Note (2019/04/16):
 *
 * This is a direct port from the deprecated jest-test-typescript-parser in https://github.com/facebook/jest, as jest moving to babel-7, which includes direct typescript
 * support, the package is removed.
 *
 * However "jest-test-typescript-parser" is used by 3rd party tools such as vscode-jest, together with "jest-editor-support",
 * therefore, for the continuity and backward compatibility, we merged the legacy parser here and take responsibility in selecting the
 * proper parser for the given file. Therefore tools that adopt the new "jest-editor-support" package should remove
 * "jest-test-typescript-parser".
 *
 * @flow
 */

import {readFileSync} from 'fs';

import ts from 'typescript';
import {NamedBlock, ParsedRange, ParsedNode, ParseResult} from './parser_nodes';
import type {ParsedNodeType} from './parser_nodes';

/* eslint-disable no-param-reassign */
function getNode<T: ParsedNode>(file: ts.SourceFile, expression: ts.CallExpression, node: T): T {
  const start = file.getLineAndCharacterOfPosition(expression.getStart(file));
  node.start = {
    column: start.character + 1,
    line: start.line + 1,
  };
  const pos = expression.getEnd();
  const end = file.getLineAndCharacterOfPosition(pos);

  // our end position is 1-based end character, including whitespace and
  // statement separator.  getLineAndCharacterOfPosition in typescript, however,
  // returns the 1-based location of the last non-whitespace char position.
  // Therefore we need to adjust for the actual lineEnd position here
  const lineEnd = file.getLineEndOfPosition(pos);
  const lineEndDiff = lineEnd - pos;

  // TypeScript parser is 0 based, so we have to increment by 1 to normalize
  // but the character position is the exclusive, so no need to to increment by 1
  node.end = {
    column: end.character + lineEndDiff,
    line: end.line + 1,
  };
  node.file = file.fileName;
  return node;
}

// eslint-disable-next-line import/prefer-default-export
export function parse(file: string, data: ?string): ParseResult {
  const sourceFile = ts.createSourceFile(file, data || readFileSync(file).toString(), ts.ScriptTarget.ES3);
  const parseResult = new ParseResult(file);

  const addNode = (tsNode: ts.Node, parent: ParsedNode, type: ParsedNodeType): ParsedNode => {
    const child = parent.addChild(type);
    getNode(sourceFile, tsNode, child);

    if (child instanceof NamedBlock) {
      const arg = tsNode.arguments[0];
      child.name = arg.text;
      if (!child.name) {
        if (ts.isTemplateExpression(arg)) {
          child.name = sourceFile.text.substring(arg.pos + 1, arg.end - 1);
        }
      }
      if (child.name != null) {
        const start = sourceFile.getLineAndCharacterOfPosition(arg.pos);
        const end = sourceFile.getLineAndCharacterOfPosition(arg.end);
        child.nameRange = new ParsedRange(start.line + 1, start.character + 2, end.line + 1, end.character - 1);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`NamedBlock but no name found for ${type} tsNode=`, tsNode);
      }

      parseResult.addNode(child);
    } else {
      // block has no name, thus perform extra dedup check by line info
      parseResult.addNode(child, true);
    }

    return child;
  };

  function searchNodes(parent: ParsedNode) {
    const findText = (expression: any) => (expression && expression.text ? expression.text : undefined);
    return (node: ts.Node) => {
      let sNode: ?ParsedNode;
      if (node.kind === ts.SyntaxKind.CallExpression) {
        const text = node.expression ? findText(node.expression) || findText(node.expression.expression) : undefined;

        if (text === 'describe') {
          sNode = addNode(node, parent, 'describe');
        } else if (text === 'it' || text === 'test' || text === 'fit') {
          sNode = addNode(node, parent, 'it');
        } else {
          let element = node.expression;
          let expectText = '';
          while (element && !expectText) {
            expectText = element.text;
            element = element.expression;
          }
          if (expectText === 'expect') {
            sNode = addNode(node, parent, 'expect');
          }
        }
      }
      ts.forEachChild(node, searchNodes(sNode || parent));
    };
  }

  ts.forEachChild(sourceFile, searchNodes(parseResult.root));
  return parseResult;
}
