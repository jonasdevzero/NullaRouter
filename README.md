# Nulla Router

:construction: In Development :construction: A very fast HTTP router based in prefix tree

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

Supports all http methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `TRACE`, `CONNECT`, `OPTIONS`

## Future features

- Custom options
