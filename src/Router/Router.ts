import type { IncomingMessage, ServerResponse } from "node:http";
import type { RouteHandler } from "../@types/RouteHandler";
import type { RoutesTrees, HTTPMethod } from "../@types/RoutesTrees";
import RouterTree from "./RouterTree";

class Router {
  private trees = {} as RoutesTrees;

  lookup(request: IncomingMessage, response: ServerResponse) {
    const { method } = request;
    const [pathname] = (request.url as string).split("?");

    const tree = this.trees[method as string];

    const handler = tree.lookup(pathname) ?? this.onRouteNotFound;
    handler(request, response);
  }

  on(method: HTTPMethod, path: string, handler: RouteHandler) {
    if (this.trees[method] === undefined) this.trees[method] = new RouterTree();

    const currentNode = this.trees[method];
    currentNode.insertChild(path, handler);
  }

  get(path: string, handler: RouteHandler) {
    this.on("GET", path, handler);
  }

  post(path: string, handler: RouteHandler) {
    this.on("POST", path, handler);
  }

  put(path: string, handler: RouteHandler) {
    this.on("PUT", path, handler);
  }

  patch(path: string, handler: RouteHandler) {
    this.on("PATCH", path, handler);
  }

  delete(path: string, handler: RouteHandler) {
    this.on("DELETE", path, handler);
  }

  use(prefix: string, router: Router) {
    const trees = router.trees;

    Object.entries(trees).forEach(([method, tree]) => {
      let currentTree = this.trees[method as HTTPMethod];

      if (!currentTree) {
        currentTree = new RouterTree();
        this.trees[method as HTTPMethod] = currentTree;
      }

      currentTree.mergeTree(tree, prefix);
    });
  }

  private onRouteNotFound(_request: IncomingMessage, response: ServerResponse) {
    response.statusCode = 404;
    response.end("Route Not Found");
  }
}

export default Router;
