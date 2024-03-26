---
title: Routes
---

# {{ $frontmatter.title }}

## What are Routes?

Routes precede endpoints. Routes can be viewed as middleware that executes before reaching the endpoint.

Endpoints are applied to routes.

## How to Create a Route

::: code-group

```ts [route.ts]
import { createRoute, RPCError } from '@http-rpc/server';
import { FastifyContext } from '@http-rpc/server/adapters/fastify';

// this is a public route. nothing special about it.
export const publicRoute = createRoute<FastifyContext>();

// only authenticated users can access this route.
export const protectedRoute = publicRoute.middleware(async ctx => {
	const token = ctx.req.headers.authorization;
	if (!token) throw new RPCError({ code: 'UNAUTHORIZED' });

	const user = await getUserByToken(token);
	if (!user) throw new RPCError({ code: 'UNAUTHORIZED' });

	return { user };
});
```

:::

Continue to the Endpoint section to see how to apply these routes.
