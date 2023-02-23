import { Stack } from './Stack';
import { BrotherNode, NodeType, RouteHandler } from './types';

const WILDCARD = 42;
const PARAMETRIC = 58;

export class RouteNode {
  prefix: string;
  type: NodeType = NodeType.STATIC;
  handler: RouteHandler | null = null;
  private match: Function = () => true;

  children: { [key: string]: RouteNode } = {};
  parametricNode: RouteNode | null = null;
  paramsName: string[] | null = null;

  wildcardNode: RouteNode | null = null;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.setupMatch();
  }

  private setupMatch() {
    if ([WILDCARD, PARAMETRIC].includes(this.prefix.charCodeAt(0))) return;

    let lines: string[] = [];

    for (let index = 0; index < this.prefix.length; index++) {
      const charCode = this.prefix.charCodeAt(index);
      lines.push(`path.charCodeAt(${index} + startIndex) === ${charCode}`);
    }

    this.match = new Function(
      'path',
      'startIndex',
      `return ${lines.join(' && ')}`
    );
  }

  insert(path: string): RouteNode {
    if (path.endsWith('*')) return this.insertWildcardNode(path);
    if (path.endsWith('/:')) return this.insertParametricNode(path);

    let child = this.children[path.charAt(0)];

    if (child) {
      for (let index = 0; index < path.length; index++)
        if (child.prefix[index] !== path[index])
          return child.split(this, index).insert(path.slice(index));

      if (child.prefix.length === path.length) return child;
    }

    const node = new RouteNode(path);
    this.children[path.charAt(0)] = node;

    return node;
  }

  private insertWildcardNode(path: string) {
    const wildcardIndex = path.indexOf('*');
    if (wildcardIndex === -1) return this;

    const parentPath = path.slice(0, wildcardIndex);
    const parentNode = parentPath ? this.insert(parentPath) : this;

    const wildcardNode = new RouteNode('*');
    wildcardNode.type = NodeType.WILDCARD;

    parentNode.wildcardNode = wildcardNode;

    return wildcardNode;
  }

  private insertParametricNode(path: string) {
    const parametricIndex = path.indexOf('/:');
    if (parametricIndex === -1) return this;

    const parentPath = path.slice(0, parametricIndex);
    const parentNode = parentPath ? this.insert(parentPath) : this;

    if (parentNode.parametricNode) return parentNode.parametricNode;

    const parametricNode = new RouteNode(':');

    parametricNode.type = NodeType.PARAMETRIC;
    parentNode.parametricNode = parametricNode;

    return parametricNode;
  }

  private split(parent: RouteNode, position: number) {
    if (!this.prefix[position + 1]) return this;

    const parentPrefix = this.prefix.slice(0, position);
    const childPrefix = this.prefix.slice(position);

    this.prefix = childPrefix;
    this.setupMatch();

    const node = new RouteNode(parentPrefix);

    node.children[childPrefix.charAt(0)] = this;
    parent.children[parentPrefix.charAt(0)] = node;

    return node;
  }

  next(path: string, startIndex: number, nodeStack: Stack<BrotherNode>) {
    const node = this.findNextStaticNode(path, startIndex);

    if (!node) return this.parametricNode || this.wildcardNode;

    if (this.wildcardNode !== null)
      nodeStack.push({ pathIndex: startIndex, node: this.wildcardNode });

    if (this.parametricNode !== null)
      nodeStack.push({ pathIndex: startIndex, node: this.parametricNode });

    return node;
  }

  private findNextStaticNode(path: string, startIndex: number) {
    let node: RouteNode | null = this.children[path.charAt(startIndex)];

    if (!node || !node.match(path, startIndex)) return null;
    return node;
  }

  prettyPrint() {
    for (const child of Object.values(this.children)) {
      this.print(child, 1, '', true);
    }
  }

  private print(node: RouteNode, level = 1, before = '', isEnd = false) {
    const ident = isEnd ? '└──' : '├──';
    const type = node.handler ? '+' : '-';

    console.log(`${before}${ident} ${type} ${node.prefix}`);

    const children = Object.values(node.children);
    const size = children.length;
    const newBefore = before + (!isEnd && level > 1 ? '│  ' : '  ');

    children.forEach((child, index) => {
      const isEnd = index + 1 === size;
      node.print(child, level + 1, newBefore, isEnd);
    });
  }
}
