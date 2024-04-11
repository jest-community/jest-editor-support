/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {CodeLocation} from '../types';

/**
 * range and location here are 1-based position.
 */
export class ParsedRange {
  start: CodeLocation;

  end: CodeLocation;

  constructor(startLine: number, startCol: number, endLine: number, endCol: number) {
    this.start = {column: startCol, line: startLine};
    this.end = {column: endCol, line: endLine};
  }
}

export enum ParsedNodeType {
  describe = 'describe',
  expect = 'expect',
  it = 'it',
  root = 'root',
}

export class ParsedNode {
  type: ParsedNodeType;

  start?: CodeLocation;

  end?: CodeLocation;

  file: string;

  children?: ParsedNode[];

  constructor(type: ParsedNodeType, file: string) {
    this.type = type;
    this.file = file;
  }

  addChild(type: ParsedNodeType): ParsedNode {
    let child: ParsedNode;

    switch (type) {
      case ParsedNodeType.describe:
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        child = new DescribeBlock(this.file);
        break;
      case ParsedNodeType.it:
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        child = new ItBlock(this.file);
        break;
      case ParsedNodeType.expect:
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        child = new Expect(this.file);
        break;
      default:
        throw TypeError(`unexpected child node type: ${type}`);
    }
    if (!this.children) {
      this.children = [child];
    } else {
      this.children.push(child);
    }
    return child;
  }

  filter(f: (node: ParsedNode) => boolean, filterSelf = false): ParsedNode[] {
    const filtered: ParsedNode[] = [];

    const deepFilter = (node: ParsedNode, _filterSelf: boolean) => {
      if (_filterSelf && f(node)) {
        filtered.push(node);
      }

      if (node.children) {
        node.children.forEach((c) => deepFilter(c, true));
      }
    };

    deepFilter(this, filterSelf);
    return filtered;
  }
}

export class Expect extends ParsedNode {
  constructor(file: string) {
    super(ParsedNodeType.expect, file);
  }
}

export class NamedBlock extends ParsedNode {
  name: string;

  nameRange?: ParsedRange;

  lastProperty?: string;

  /**
   * type of the name, it's the babel Node["type"], such as "Literal", "TemplateLiteral" etc
   *
   * TODO babel parser currently returns "Literal" for the it/describe name argument, which is not part of its "type" definition, therefore declare a string type for now until it is fixed in babel.
   * */
  nameType?: string;

  constructor(type: ParsedNodeType, file: string, name?: string) {
    super(type, file);
    this.name = name ?? '';
  }
}

export class ItBlock extends NamedBlock {
  constructor(file: string, name?: string) {
    super(ParsedNodeType.it, file, name);
  }
}
export class DescribeBlock extends NamedBlock {
  constructor(file: string, name?: string) {
    super(ParsedNodeType.describe, file, name);
  }
}

// export type NodeClass = Node | Expect | ItBlock | DescribeBlock;

export interface IParseResults {
  describeBlocks: DescribeBlock[];

  expects: Expect[];

  itBlocks: ItBlock[];

  root: ParsedNode;

  file: string;
}
export class ParseResult implements IParseResults {
  describeBlocks: DescribeBlock[];

  expects: Expect[];

  itBlocks: ItBlock[];

  root: ParsedNode;

  file: string;

  constructor(file: string) {
    this.file = file;
    this.root = new ParsedNode(ParsedNodeType.root, file);

    this.describeBlocks = [];
    this.expects = [];
    this.itBlocks = [];
  }

  addNode(node: ParsedNode, dedup = false): void {
    if (node instanceof DescribeBlock) {
      this.describeBlocks.push(node);
    } else if (node instanceof ItBlock) {
      this.itBlocks.push(node);
    } else if (node instanceof Expect) {
      if (
        dedup &&
        this.expects.some((e) => e.start?.line === node.start?.line && e.start?.column === node.start?.column)
      ) {
        // found dup, return
        return;
      }

      this.expects.push(node);
    } else {
      throw new TypeError(`unexpected node class '${typeof node}': ${JSON.stringify(node)}`);
    }
  }
}
