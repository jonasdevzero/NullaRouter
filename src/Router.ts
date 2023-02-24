import type { IncomingMessage, ServerResponse } from 'node:http';
import { isPathPatternValid } from './helpers/validatePathPattern';
import { RouteNode } from './RouteNode';
import { RouteTreeMapper } from './RouteTreeMapper';
import {
  BrotherNode,
  HttpMethod,
  NodeType,
  NotFoundRoute,
  RouteHandler,
  RouterOptions,
} from './types';

const WILDCARD = 42;
const PARAMETRIC = 58;

const defaultConfig = {
  onNotFound(_: IncomingMessage, response: ServerResponse) {
    response.statusCode = 404;
    response.end('Route Not Found');
  },
};

export class Router {
  readonly trees = {} as { [key in HttpMethod]: RouteNode };
  private readonly config: RouterOptions;
  private readonly onNotFound: NotFoundRoute;

  constructor(config: RouterOptions = {}) {
    this.config = config;
    this.onNotFound = config.onNotFound || defaultConfig.onNotFound;
  }

  on(method: HttpMethod, path: string, handler: RouteHandler) {
    if (!isPathPatternValid(path, this.config.patterns)) {
      throw new SyntaxError(`path pattern is not valid, path: "${path}"`);
    }

    if (!this.trees[method]) {
      this.trees[method] = new RouteNode('\0');
    }

    let currentNode = this.trees[method];
    let pathIndex = 0;
    let pathLength = path.length;
    const paramsName: string[] = [];

    for (let index = 0; index <= path.length; index++) {
      if (index === pathLength) {
        currentNode = currentNode.insert(path.slice(pathIndex, pathLength));
        break;
      }

      const charCode = path.charCodeAt(index);
      const isWildcard = charCode === WILDCARD;
      const isParametric = charCode === PARAMETRIC;

      if (isWildcard && path.charAt(index + 1)) {
        throw new Error(`Route after parametric symbol is invalid: ${path}`);
      }

      if (isWildcard && currentNode.wildcardNode !== null) {
        throw new Error(`Duplicated wildcard route: ${path}`);
      }

      if (isWildcard) {
        const wildcardPath = path.slice(pathIndex, index - 1) + '*';
        currentNode = currentNode.insert(wildcardPath);
        paramsName.push('"*"');
        break;
      }

      if (isParametric) {
        let parametricEnd = path.indexOf('/', index);
        if (parametricEnd === -1) parametricEnd = pathLength;

        const paramName = path.slice(index + 1, parametricEnd);
        const parametricPath = path.slice(
          pathIndex,
          parametricEnd - paramName.length
        );

        paramsName.push(paramName);
        currentNode = currentNode.insert(parametricPath);

        index = parametricEnd;
        pathIndex = parametricEnd;
      }
    }

    currentNode.handler = handler;
    currentNode.paramsName = paramsName;
  }

  find(method: HttpMethod, path: string) {
    let currentNode: RouteNode | null = this.trees[method];

    if (!currentNode) return null;

    let readLength = 0;
    const totalLength = path.length;

    const nodeStack = new Array<BrotherNode>();
    const paramsValues: string[] = [];

    while (true) {
      if (readLength === totalLength) {
        const { handler, buildParamsObject } = currentNode;
        const params: { [key: string]: string } =
          buildParamsObject(paramsValues);

        return { handler, params };
      }

      currentNode = currentNode.next(path, readLength, nodeStack);

      if (currentNode === null) {
        if (nodeStack.length === 0) return null;

        const { node, pathIndex } = nodeStack.pop() as BrotherNode;
        readLength = pathIndex;
        currentNode = node;
      }

      if (currentNode.type === NodeType.PARAMETRIC) {
        let nextIndex = path.indexOf('/', readLength + 1);
        nextIndex = nextIndex === -1 ? totalLength : nextIndex;

        paramsValues.push(path.slice(readLength + 1, nextIndex));
        readLength = nextIndex;

        continue;
      }

      readLength += currentNode.prefix.length;

      if (currentNode.type === NodeType.WILDCARD) {
        paramsValues.push(path.slice(readLength));
        break;
      }
    }
  }

  lookup(request: IncomingMessage, response: ServerResponse) {
    const { method = 'GET', url = '/' } = request;
    const [path] = url.split('?');

    const route = this.find(method as HttpMethod, path);

    if (!route || !route.handler) {
      return this.onNotFound(request, response);
    }

    const { handler, params } = route;

    handler(request, response, params);
  }

  get(path: string, handler: RouteHandler) {
    this.on('GET', path, handler);
  }

  post(path: string, handler: RouteHandler) {
    this.on('POST', path, handler);
  }

  put(path: string, handler: RouteHandler) {
    this.on('PUT', path, handler);
  }

  patch(path: string, handler: RouteHandler) {
    this.on('PATCH', path, handler);
  }

  delete(path: string, handler: RouteHandler) {
    this.on('DELETE', path, handler);
  }

  head(path: string, handler: RouteHandler) {
    this.on('HEAD', path, handler);
  }

  options(path: string, handler: RouteHandler) {
    this.on('OPTIONS', path, handler);
  }

  connect(path: string, handler: RouteHandler) {
    this.on('CONNECT', path, handler);
  }

  trace(path: string, handler: RouteHandler) {
    this.on('TRACE', path, handler);
  }

  merge(router: Router, prefix?: string) {
    for (const tree of Object.entries(router.trees)) {
      const [method, root] = tree as [HttpMethod, RouteNode];

      RouteTreeMapper.map(root, prefix).forEach(({ fullPath, handler }) => {
        this.on(method, fullPath, handler);
      });
    }
  }
}
