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

  insertChild(path: string, handler: RouteHandler) {
    let currentNode = this.root;
    const params = [] as string[];

    for (let index = 0; index < path.length; index++) {
      const charCode = path.charCodeAt(index);

      if (this.isWildcard(charCode)) {
        currentNode = this.insertAndReturnWildcardNode(currentNode);
        break;
      }

      if (this.isParametric(charCode)) {
        currentNode = this.insertAndReturnParametricNode(currentNode);
        index = this.pushParamAndReturnNextIndex(params, path, index);
        continue;
      }

      const nextNode = currentNode.children[charCode];

      if (!nextNode) {
        currentNode = this.insertAndReturnStaticNode(currentNode, charCode);
        continue;
      }

      currentNode = nextNode;
    }

    currentNode.params = params;
    currentNode.handler = handler;
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
      for (const paramName of currentNode.params) {
        params[paramName] = paramsValue[paramIndex];
        paramIndex++;
      }
    }

    return currentNode.handler;
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
    if (node.parametricChild) return node.parametricChild;

    const parametricChild = new RouteNode(":");
    node.parametricChild = parametricChild;

    return parametricChild;
  }

  private pushParamAndReturnNextIndex(
    params: string[],
    label: string,
    startIndex: number
  ) {
    const paramIndexEnd = this.getParametricIndexEnd(label, startIndex);

    const parametricName = label.slice(startIndex + 1, paramIndexEnd);
    params.push(parametricName);

    return paramIndexEnd;
  }

  private getParametricIndexEnd(label: string, startIndex: number) {
    return label.slice(startIndex).split(PARAMETRIC_END)[0].length + startIndex;
  }

  private insertAndReturnStaticNode(node: RouteNode, charCode: number) {
    const staticNode = new RouteNode(String.fromCharCode(charCode));
    node.children[charCode] = staticNode;

    return staticNode;
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
