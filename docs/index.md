---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: '@http-rpc'
  text: 'Unify Frontend-Backend Interactions'
  tagline: RPC layer on top of http with full typesafety and more
  image: /logo.png
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: View on Github
      link: https://github.com/lacherogwu/http-rpc

features:
  - icon: 🔗
    title: Unified Communication
    details: Seamlessly bridges frontend and backend applications, creating a harmonized communication environment
    link: /configuration-options/#output-format
  - icon: ⚓
    title: RPC over HTTP Protocol
    details: Utilizes the well-established HTTP protocol to deliver robust Remote Procedure Call (RPC) capabilities
  - icon: 🛠️
    title: Full TypeScript Support
    details: Ensures robust coding support with complete TypeScript intellisense, enhancing code accuracy & developer productivity
  - icon: 🔒
    title: Typesafety
    details: Provides strict typing to prevent errors and enhance code quality, leveraging the full power of TypeScript's type system
  - icon: 💆
    title: Ease of Integration
    details: Designed with ease of integration in mind, works cooperatively with existing frontend and backend technologies
  - icon: 💥
    title: Efficient Error Handling
    details: Following Problem Details for HTTP APIs (RFC 9457)
---

## @http-rpc/server

a simple example of how to use `@http-rpc/server` with `fastify`:

::: code-group

```ts [server.ts]
import Fastify from 'fastify';
import { createRoute } from '@http-rpc/server';
import { rpcFastify, FastifyContext } from '@http-rpc/server/adapters/fastify';

const fastify = Fastify({
	logger: true,
});

const publicRoute = createRoute<FastifyContext>();

const router = {
	version: publicRoute.get(() => {
		return { version: 'v1.0.0' };
	}),
};

export type Router = typeof router;

fastify.register(rpcFastify, {
	prefix: '/rpc',
	router,
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });
```

:::

## @http-rpc/client

a simple example of how to use `@http-rpc/client`:

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
