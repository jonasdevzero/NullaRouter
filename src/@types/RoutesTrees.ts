import RouterTree from "../Router/RouterTree";

export type HTTPMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";

export interface RoutesTrees {
  [key: string]: RouterTree;
}
