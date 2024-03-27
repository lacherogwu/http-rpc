# Server Setup

## Installation

```sh
npm i @http-rpc/server fastify zod superjson
```

::: tip

- `fastify` is used as an example, in the future you could use any other framework.
- `superjson` is not required, but it is recommended to use it for serialization.

:::

## Usage

::: code-group

```ts [server.ts]
import Fastify from 'fastify';
import { rpcFastify } from '@http-rpc/server/adapters/fastify';
import { router } from './rpc/router';
import superjson from 'superjson';

const fastify = Fastify({
	logger: true,
});

fastify.register(rpcFastify, {
	prefix: '/rpc',
	router,
	transformer: superjson,
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });
```

```ts [rpc/router.ts]
import { publicRoute } from './route';

export const router = {
	version: publicRoute.get(() => {
		return { version: 'v1.0.0' };
	}),
};
export type Router = typeof router;
```

```ts [rpc/route.ts]
import { createRoute } from '@http-rpc/server';
import { FastifyContext } from '@http-rpc/server/adapters/fastify';

export const publicRoute = createRoute<FastifyContext>();
```

:::
