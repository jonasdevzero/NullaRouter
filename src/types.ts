import type { IncomingMessage, ServerResponse } from 'node:http';
import { RouteNode } from './RouteNode';

export type Pattern =
  | 'camelCase'
  | 'snake_case'
  | 'PascalCase'
  | 'kebab-case'
  | 'any';

export interface PathPatterns {
  path?: Pattern;
  param?: Pattern;
}

export type NotFoundRoute = (
  request: IncomingMessage,
  response: ServerResponse
) => unknown;

export interface RouterOptions {
  patterns?: PathPatterns;
  onNotFound?: NotFoundRoute;
}

export enum NodeType {
  STATIC = 0,
  PARAMETRIC = 1,
  WILDCARD = 2,
}

export interface BrotherNode {
  node: RouteNode;
  pathIndex: number;
}

export type RouteParams = { [key: string]: string };

export type RouteHandler = (
  request: IncomingMessage,
  response: ServerResponse,
  params: RouteParams
) => void;

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
