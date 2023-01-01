import { RouteHandler } from './RouteHandler';
import { RouteNode, RouteNodeType } from './RouteNode';

const WILDCARD = 42;
const PARAMETRIC = 58;

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'
  | 'TRACE';

export class Router {
  private readonly trees = {} as { [key: string]: RouteNode };

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
  }

  find(method: string, path: string) {
    let currentNode: RouteNode | null = this.trees[method];

    if (!currentNode) return null;

    let readLength = 0;
    let totalLength = path.length;

    let wildcardNode = currentNode.wildcardNode;
    let lastWildcardIndex = 0;

    const params: { [key: string]: string } = {};
    const paramsValues: string[] = [];

    while (true) {
      if (readLength === totalLength) break;

      currentNode = currentNode.next(path, readLength);

      if (!currentNode) break;

      if (currentNode.type === RouteNodeType.PARAMETRIC) {
        let nextIndex = path.indexOf('/', readLength + 1);
        nextIndex = nextIndex === -1 ? totalLength : nextIndex;

        paramsValues.push(path.slice(readLength + 1, nextIndex));
        readLength = nextIndex;

        continue;
      }

      readLength += currentNode.prefix.length;

      if (currentNode.type === RouteNodeType.WILDCARD) {
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

    if (type === RouteNodeType.WILDCARD)
      params['*'] = path.slice(lastWildcardIndex + 1);

    return { handler, params };
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
