import { IncomingMessage, ServerResponse } from "http";

export type RouteHandler = (
  request: IncomingMessage,
  response: ServerResponse
) => void;
