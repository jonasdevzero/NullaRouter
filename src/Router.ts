import type { IncomingMessage, ServerResponse } from 'node:http';
import { RouteNode } from './RouteNode';
import { Stack } from './Stack';
import { BrotherNode, HttpMethod, NodeType, RouteHandler } from './types';

const WILDCARD = 42;
const PARAMETRIC = 58;

export class Router {
  readonly trees = {} as { [key: string]: RouteNode };

  on(method: HttpMethod, path: string, handler: RouteHandler) {
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

  find(method: string, path: string) {
    let currentNode: RouteNode | null = this.trees[method];

    if (!currentNode) return null;

    let readLength = 0;
    let totalLength = path.length;

    let wildcardNode = currentNode.wildcardNode;
    let lastWildcardIndex = 0;

    const nodeStack = new Stack<BrotherNode>();
    const params: { [key: string]: string } = {};
    const paramsValues: string[] = [];

    while (true) {
      if (readLength === totalLength) break;

      currentNode = currentNode.next(path, readLength, nodeStack);

      if (!currentNode) {
        if (nodeStack.isEmpty()) return null;

        const brother = nodeStack.pop() as BrotherNode;
        readLength = brother.pathIndex;
        currentNode = brother.node;
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
        lastWildcardIndex = readLength;
        break;
      }

      if (currentNode.wildcardNode) {
        wildcardNode = currentNode.wildcardNode;
        lastWildcardIndex = readLength;
      }
    }

    if (!currentNode || !currentNode.handler) {
      if (!wildcardNode) return null;
      currentNode = wildcardNode;
    }

    const { type, handler, paramsName } = currentNode;

    if (paramsName)
      for (let index = 0; index < paramsName.length; index++)
        params[paramsName[index]] = paramsValues[index];

    if (type === NodeType.WILDCARD) params['*'] = path.slice(lastWildcardIndex);

    return { handler, params };
  }

  lookup(request: IncomingMessage, response: ServerResponse) {
    const { method = 'GET', url = '/' } = request;
    const [path] = url.split('?');

    const route = this.find(method, path);

    if (!route || !route.handler) {
      response.statusCode = 404;
      return response.end('Route not found');
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
}
