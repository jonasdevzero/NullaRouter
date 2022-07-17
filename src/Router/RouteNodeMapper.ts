import type { RouteHandler } from "../@types/RouteHandler";
import RouteNode from "./RouteNode";

interface MappedRouteNode {
  path: string;
  handler: RouteHandler;
}

class RouteNodeMapper {
  private static nodes = [] as MappedRouteNode[];

  static map(node: RouteNode) {
    return this.mapNode(node);
  }

  private static mapNode(node: RouteNode, mappedPath = "") {
    mappedPath += node.label;
    this.mapNodeChildren(node, mappedPath);
    this.setMappedNodes(node, mappedPath);

    return this.nodes;
  }

  private static mapNodeChildren(node: RouteNode, mappedPath: string) {
    this.mapNodes(node.children, mappedPath);

    if (node.parametricChild) this.mapNode(node.parametricChild, mappedPath);
  }

  private static mapNodes(nodes: RouteNode[], mappedPath: string) {
    for (const child of nodes) if (child) this.mapNode(child, mappedPath);
  }

  private static setMappedNodes(node: RouteNode, mappedPath: string) {
    if (node.wildcardChild)
      this.setMappedWildcardNode(node.wildcardChild, mappedPath);

    this.setMappedNode(node, mappedPath);
  }

  private static setMappedWildcardNode(node: RouteNode, mappedPath: string) {
    mappedPath += "*";
    this.setMappedNode(node, mappedPath);
  }

  private static setMappedNode(node: RouteNode, mappedPath: string) {
    if (!node.handler) return;

    if (this.hasParametric(mappedPath) && this.hasParams(node))
      mappedPath = this.createParametricPath(mappedPath, node.params);

    this.nodes.push({ path: mappedPath, handler: node.handler });
  }

  private static hasParametric(path: string) {
    return path.indexOf(":") >= 0;
  }

  private static hasParams(node: RouteNode) {
    return !!node.params.length;
  }

  private static createParametricPath(path: string, params: string[]) {
    let parametricStart = 0;

    for (const param of params) {
      parametricStart = path.indexOf(":", parametricStart);

      const pathStarts = path.slice(0, parametricStart);
      const parametric = `:${param}/`;
      const pathEnds = path.slice(parametricStart + 1);

      path = pathStarts + parametric + pathEnds;

      parametricStart += parametric.length - 1;
    }

    if (path.endsWith("/")) path = path.slice(0, path.length - 1);

    return path;
  }
}

export default RouteNodeMapper;
