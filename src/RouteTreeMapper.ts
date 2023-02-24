import { RouteNode } from './RouteNode';
import { RouteHandler } from './types';

interface MappedNode {
  fullPath: string;
  handler: RouteHandler;
}

export class RouteTreeMapper {
  private static readonly elements: MappedNode[] = [];

  static map(root: RouteNode, prefix = '/') {
    const { wildcardNode, children, parametricNode } = root;
    const treePrefix = prefix === '/' ? '' : prefix;

    if (wildcardNode && wildcardNode.handler) {
      this.elements.push({
        fullPath: '/*',
        handler: wildcardNode.handler,
      });

      return this.elements;
    }

    for (const node of Object.values(children)) {
      this.mapNode(node, treePrefix);
    }

    if (parametricNode) {
      this.mapNode(parametricNode, treePrefix + '/');
    }

    return this.elements;
  }

  private static mapNode(node: RouteNode, parentPrefix: string = '') {
    const {
      prefix,
      handler,
      wildcardNode,
      parametricNode,
      children,
      paramsName,
    } = node;

    const path = parentPrefix + prefix;

    if (handler) {
      const fullPath = this.buildPath(path, paramsName || []);
      this.elements.push({ fullPath, handler });
    }

    if (wildcardNode && wildcardNode.handler) {
      const params = wildcardNode.paramsName;
      const fullPath = this.buildPath(path, params || []);

      this.elements.push({
        fullPath: fullPath + '/*',
        handler: wildcardNode.handler,
      });

      return;
    }

    if (parametricNode !== null) {
      this.mapNode(parametricNode, path + '/');
    }

    for (const child of Object.values(children)) {
      this.mapNode(child, path);
    }
  }

  private static buildPath(path: string, params: string[]) {
    let fullPath = path;

    for (const param of params) {
      fullPath = fullPath.replace(':', `^${param}`);
    }

    fullPath = fullPath.replace(/\^/g, ':');

    if (fullPath.length > 1 && fullPath.endsWith('/')) {
      fullPath = fullPath.slice(0, -1);
    }

    return fullPath;
  }
}
