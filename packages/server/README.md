# HTTP RPC Server

## Installation

```bash
npm install @http-rpc/server
```

### Recommended Dependencies

```bash
npm install fastify superjson zod
```

## Usage

`./app.ts`

```typescript
import { fastifyRPCPlugin } from '@http-rpc/server/adapters/fastify';
import superjson from 'superjson';
import { router } from './rpc/router';

fastify.register(fastifyRPCPlugin, {
	prefix: '/rpc',
	router,
	transformer: superjson,
});
```

`./router.ts`

```typescript
import { createRoute, RPCError } from '@http-rpc/server';
import { FastifyContext } from '@http-rpc/server/adapters/fastify';
import { z } from 'zod';

const publicRoute = createRoute<FastifyContext>();
const authenticatedRoute = publicRoute.middleware(ctx => {
	const { authorization } = ctx.req.headers;
	const user = await prisma.user.findUnique({ where: { token: authorization } });
	if (!user) throw new RPCError({ code: 'UNAUTHORIZED' });

	return {
		userId: user.id,
	};
});

export const router = {
	version: publicRoute
		.output(
			z.object({
				version: z.string(),
			}),
		)
		.get(() => ({ version: '1.0.0' })),
	orders: {
		list: authenticatedRoute
			.input(z.object({ fields: z.array(z.string()) }))
			.output(z.array(z.object({ id: z.number(), amount: z.number() })))
			.get(ctx => {
				const { userId } = ctx;
				const { fields } = ctx.input;
				return await prisma.order.findMany({
					where: {
						userId,
					},
					select: Object.keys(fields).reduce((acc, field) => {
						acc[field] = true;
						return acc;
					}, {}),
				});
			}),
	},
};

export type Router = typeof router;
```
