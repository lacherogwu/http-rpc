# HTTP RPC Server

## Installation

```bash
npm install @http-rpc/server
```

## Usage

`./app.ts`

```typescript
import { fastifyRPCPlugin } from '@http-rpc/server';
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
import { Route } from '@http-rpc/server';
import { z } from 'zod';

const publicRoute = new Route();
const authenticatedRoute = publicRoute.middleware(ctx => {
	const { authorization } = ctx.request.headers;
	const user = await prisma.user.findUnique({ where: { token: authorization } });
	if (!user) throw new Error('Unauthorized');

	return {
		userId: user.id,
	};
});

export const router = {
	version: publicRoute.output(z.object({ version: z.string() })).get(() => ({ version: '1.0.0' })),
	orders: {
		list: authenticatedRoute
			.input(z.object({ fields: z.array(z.string()) }))
			.output(z.array(z.object({ id: z.number(), amount: z.number() })))
			.get(ctx => {
				const { fields } = ctx.input;
				return await prisma.order.findMany({
					select: Object.keys(fields).reduce((acc, field) => {
						acc[field] = true;
						return acc;
					}, {}),
				});
			}),
	},
};
```

## Generate Client Types (temporary)

```typescript
import { generateClientTypes } from '@http-rpc/server';
import { router } from './router';
import fs from 'node:fs';

const dts = generateClientTypes(router);
fs.writeFileSync('../web/src/services/.rpcClient.d.ts', dts);
```
