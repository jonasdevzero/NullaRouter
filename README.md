# Nulla Router

A very fast HTTP router based in prefix tree

Supports all http methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `TRACE`, `CONNECT`, `OPTIONS`

## Example

```js
import http from 'http';
import Router from 'nulla-router';

const router = new Router();

router.get('/user', (request, response) => response.end('Hello World'));

const server = http.createServer((request, response) => {
  router.lookup(request, response);
});

server.listen(5000);
```

## Router Options

```js
  {
    // handler for not found routes
    onNotFound: (request: IncomingMessage, response: ServerResponse) => unknown,

    // enforces url patterns, options: ['any', 'camelCase', 'PascalCase', 'kebab-case', 'snake_case]
    patterns: {
      // normal path
      path: 'camelCase',

      // parameter name
      param: 'camelCase',
    }
  }
```
