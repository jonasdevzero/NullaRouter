import { RouteHandler } from "../@types/RouteHandler";
import RouteNode from "./RouteNode";
import RouteNodeMapper from "./RouteNodeMapper";

const WILDCARD = 42;
const PARAMETRIC = 58;
const PARAMETRIC_END = "/";

class RouterTree {
  root: RouteNode;

  constructor() {
    this.root = new RouteNode("\0");
  }

  insertChild(label: string, handler: RouteHandler) {
    let currentNode = this.root;
    const params = [] as string[];

    for (let currentIndex = 0; currentIndex < label.length; currentIndex++) {
      const charIndex = label.charCodeAt(currentIndex);

      if (this.isWildcard(charIndex)) {
        currentNode = this.insertAndReturnWildcardNode(currentNode);
        break;
      }

      if (this.isParametric(charIndex)) {
        currentNode = currentNode.parametricChild
          ? currentNode.parametricChild
          : this.insertAndReturnParametricNode(currentNode);

        const parametricEnd = this.getParametricIndexEnd(label, currentIndex);

        const parametricName = label.slice(currentIndex + 1, parametricEnd);
        params.push(parametricName);

        currentIndex = parametricEnd;

        continue;
      }

      const child = currentNode.children[charIndex];

      if (!child) {
        const childNode = new RouteNode(label.charAt(currentIndex));
        currentNode.children[charIndex] = childNode;

        currentNode = childNode;
        continue;
      }

      currentNode = child;
    }

    currentNode.paramsName = params;
    currentNode.handler = handler;
  }

  private isWildcard(charCode: number) {
    return charCode === WILDCARD;
  }

  private insertAndReturnWildcardNode(node: RouteNode) {
    const wildcardChild = new RouteNode("*");
    node.wildcardChild = wildcardChild;

    return wildcardChild;
  }

  private isParametric(charCode: number) {
    return charCode === PARAMETRIC;
  }

  private insertAndReturnParametricNode(node: RouteNode) {
    const parametricChild = new RouteNode(":");
    node.parametricChild = parametricChild;

    return parametricChild;
  }

  private getParametricIndexEnd(label: string, startIndex: number) {
    return label.slice(startIndex).split(PARAMETRIC_END)[0].length + startIndex;
  }

  lookup(path: string) {
    let currentNode = this.root;
    const params = {} as { [key: string]: string };
    const paramsValue: string[] = [];

    for (let currentIndex = 0; currentIndex < path.length; currentIndex++) {
      const child = currentNode.children[path.charCodeAt(currentIndex)];

      if (!child) {
        if (!!currentNode.wildcardChild) {
          paramsValue.push(path.slice(currentIndex));
          return currentNode.wildcardChild.handler;
        }

        if (!!currentNode.parametricChild) {
          currentNode = currentNode.parametricChild;
          const parametricEnd = this.getParametricIndexEnd(path, currentIndex);
          paramsValue.push(path.slice(currentIndex, parametricEnd));

          currentIndex = parametricEnd;
          continue;
        }

        return null;
      }

      currentNode = child;
    }

    if (paramsValue.length) {
      let paramIndex = 0;
      for (const paramName of currentNode.paramsName) {
        params[paramName] = paramsValue[paramIndex];
        paramIndex++;
      }
    }

    return currentNode.handler;
  }

  mergeTree(tree: RouterTree, prefix: string = "") {
    const children = tree.root.children;

    for (const child of children) {
      if (!child) continue;

      const mappedNode = RouteNodeMapper.map(child);

      for (const currentNode of mappedNode) {
        let nodePath = `${prefix}${currentNode.path}`;

        if (nodePath.endsWith("/"))
          nodePath = nodePath.slice(0, nodePath.length - 1);

        this.insertChild(nodePath, currentNode.handler);
      }
    }
  }
}

export default RouterTree;
