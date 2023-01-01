import { IncomingMessage, ServerResponse } from 'node:http';

export type RouteHandler = (
  request: IncomingMessage,
  response: ServerResponse
) => void;
