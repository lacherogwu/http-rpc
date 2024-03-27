# Introduction

[[toc]]

## Overview

The `@http-rpc` package is a cutting-edge tool designed to streamline and unify communication between frontend and backend web applications. By creating a convenient RPC layer over HTTP, it simplifies the development process and facilitates faster delivery. Fully integrated with TypeScript, it offers enhanced code accuracy with IntelliSense and strict type safety. In essence, `@http-rpc` accelerates web development and boosts efficiency, making it an indispensable asset for modern web developers.

inspired by [trpc](https://github.com/trpc/trpc)

### `@http-rpc` vs `trpc`

At the beginning, I used `trpc` and enjoyed it. However, I noticed that on large-scale projects, the intellisense was slow. Being someone who values speed and great developer experience, I couldn't tolerate this. Hence, I developed my own library with a similar concept but improved developer experience. Along the way, I enhanced error handling, middleware implementation, API documentation, and more.

## Installation

```sh
npm i @http-rpc/server @http-rpc/client zod
```

## Quick Start

First, set up a server using `fastify`. We are currently expanding to support additional frameworks.

then add our server adapter:
::: code-group

```ts [server.ts]
import Fastify from 'fastify';
import { rpcFastify, FastifyContext } from '@http-rpc/server/adapters/fastify';
import { createRoute } from '@http-rpc/server';

const fastify = Fastify({
	logger: true,
});

// create a route
const publicRoute = createRoute<FastifyContext>();

// create a router
const router = {
	version: publicRoute.get(() => {
		return { version: 'v1.0.0' };
	}),
};
export type Router = typeof router;

// register the plugin
fastify.register(rpcFastify, {
	prefix: '/rpc',
	router,
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });
```

:::

Then setup the client:

::: code-group

```ts [client.ts]
import { createClient } from '@http-rpc/client';
import type { Router } from './server';

const client = createClient<Router>({
	url: 'http://localhost:3000/rpc',
});

const versionData = await client.version.get();
//    ^? { version: string }
```

:::

## The Why

For large-scale applications, consistency, clarity, and efficiency in HTTP communication are paramount. Traditional methods - handling GET and POST requests in different ways, separate protocols for query strings, and bodies - can lead to complexity and inconsistency.

`@http-rpc` shines here: it simplifies HTTP interactions by standardizing how parameters are passed, regardless of the request type. The package also supports TypeScript IntelliSense and full typesafety, ensuring code accuracy and productivity. Its unique ability to handle middlewares and enforce input-output validations simplifies maintenance for large-scale apps, keeping code clean and manageable.
