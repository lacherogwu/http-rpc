---
title: Recommended Usage
---

# {{ $frontmatter.title }}

## Installation

```sh
npm install @http-rpc/server superjson zod
```

## Best Practice

I recommend using [superjson](https://github.com/blitz-js/superjson) as the transformer. It is a superset of JSON that supports Dates, BigInts, and more.
this is not required, but it is a good practice.
using this transformer will make your life easier when working with dates, bigints, sets, maps, and other javascript/non-json types.

::: warning
Ensure that the client-side uses the same transformer.
:::

## Folder Structure

I suggest organizing your routes, endpoints, and router in separate files.

I create an `rpc/` folder at the project's root and make these files:

- `rpc/route.ts`
- `rpc/router.ts`
- `rpc/routes/*.ts`

::: code-group

```ts [rpc/route.ts]
import { createRoute } from '@http-rpc/server';
import { FastifyContext } from '@http-rpc/server/adapters/fastify';

export const publicRoute = createRoute<FastifyContext>();
```

```ts [rpc/router.ts]
import * as users from './routes/users/endpoints';
import * as orders from './routes/orders/endpoints';

export const router = {
	users,
	orders,
};
export type Router = typeof router;
```

:::

::: code-group

```ts [rpc/routes/users/endpoints.ts]
import { publicRoute } from '../../route';

export const findOne = publicRoute.get(async () => {
	return { name: 'John Doe' };
});
```

```ts [rpc/routes/orders/endpoints.ts]
export * as transactions from './transactions/endpoints';
```

```ts [rpc/routes/orders/transactions/endpoints.ts]
import { publicRoute } from '../../../route';

export const list = publicRoute.get(async () => {
	return [
		{ id: 1, amount: 100 },
		{ id: 2, amount: 200 },
	];
});
```

:::

Here is an example of how the client will look like
::: code-group

```ts [client.ts]
import { rpc } from '#rpc/client';

const user = await rpc.users.findOne.get();
//    ^? { name: string }

const transactions = await rpc.orders.transactions.list.get();
//    ^? { id: number, amount: number }[]
```

:::
