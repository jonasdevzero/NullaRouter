<h1 align="center">Nulla Router</h1>

A very fast HTTP router NPM package based in compact prefix tree, supports all http methods, route params and wildcards.

- [Install](#install)
- [Example](#example)
- [API](#api)
  - [Options](#router-options)
  - [Register routes](#register-routes)
  - [Parametric](#parametric-routes)
  - [Wildcard](#wildcard-routes)
  - [Multiple routers](#merge-routes)
- [Acknowledgements](#acknowledgements)

## Install

```sh
  npm install nulla-router
```

## Example

```js
import http from 'http';
import Router from 'nulla-router';

const router = new Router();

router.get('/', (request, response) => response.end('Hello World'));

const server = http.createServer((request, response) => {
  router.lookup(request, response);
});

server.listen(5000);
```

## API

### Router Options

You can pass a route to handle not found routes.

```js
const router = new Router({
  onNotFound: (request, response) => {
    response.statusCode = 404;
    response.end('Route not found :(');
  },
});
```

To enforces url patterns in routes, the path pattern is for normal paths and param is for parameters name, you can pass: `camelCase`, `PascalCase`, `snake_case`, `kebab-case`, `any`.

```js
const router = new Router({
  patterns: {
    path: 'camelCase',
    param: 'camelCase',
  },
});
```

### Register routes

To register new routes, supports all HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `TRACE`, `CONNECT`, `OPTIONS`.

```js
router.on('GET', '/', (request, response) => response.end('Hello World'));
```

Also has the syntax sugar:

```js
router.get('/', (request, response) => /* Your code */);

router.post('/', (request, response) => /* Your code */);

router.put('/', (request, response) => /* Your code */);

router.patch('/', (request, response) => /* Your code */);

router.delete('/', (request, response) => /* Your code */);

router.head('/', (request, response) => /* Your code */);

router.trace('/', (request, response) => /* Your code */);

router.connection('/', (request, response) => /* Your code */);

router.options('/', (request, response) => /* Your code */);
```

### Parametric

```js
router.get('/user/:id', (request, response, params) => {
  const { id } = params;
  response.end(`You id is: ${id}`);
});
```

### Wildcard

```js
router.get('/user/*', (request, response, params) => {
  const wildcard = params['*'];
  response.end(`The wildcard passed: ${wildcard}`);
});
```

### Multiple routers

To use multiple routers you can merge them

```js
const router = new Router();
router.get('/', (request, response) => response.end('Hello World'));

const userRouter = new Router();
userRouter.get('/', (request, response) => response.end('Hello World / user'));

router.merge(userRouter, '/user');
```

## Acknowledgements

It is inspired by the [Find My Way](https://www.npmjs.com/package/find-my-way) router.
